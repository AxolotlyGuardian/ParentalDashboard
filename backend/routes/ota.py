from fastapi import APIRouter, Depends, HTTPException, Header, UploadFile, File
from sqlalchemy.orm import Session
from sqlalchemy import desc
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
import hashlib
import random
from db import get_db
from models import OTARelease, Device, User
from auth_utils import require_admin

router = APIRouter(prefix="/ota", tags=["ota"])


# ---------------------------------------------------------------------------
# Public endpoint — called by the Android launcher
# ---------------------------------------------------------------------------

@router.get("/manifest")
def get_ota_manifest(
    channel: str = "production",
    current_version_code: Optional[int] = None,
    device_id: Optional[str] = Header(None, alias="X-Device-ID"),
    db: Session = Depends(get_db),
):
    """
    Return the latest OTA release info for the launcher.

    The launcher calls this on startup and periodically to check for updates.
    Supports beta/production channels and staged rollouts.
    """
    if channel not in ("production", "beta"):
        channel = "production"

    release = (
        db.query(OTARelease)
        .filter(
            OTARelease.channel == channel,
            OTARelease.is_active == True,
        )
        .order_by(desc(OTARelease.version_code))
        .first()
    )

    if not release:
        return {
            "update_available": False,
            "channel": channel,
        }

    # Staged rollout: use device_id as seed for deterministic bucket
    if release.rollout_percentage < 100 and device_id:
        bucket = int(hashlib.md5(device_id.encode()).hexdigest()[:8], 16) % 100
        if bucket >= release.rollout_percentage:
            return {
                "update_available": False,
                "channel": channel,
                "message": "Update not yet available for this device (staged rollout)",
            }

    # Check if the device actually needs this update
    update_available = True
    if current_version_code is not None and current_version_code >= release.version_code:
        update_available = False

    return {
        "update_available": update_available,
        "latest_version": release.version_name,
        "version_code": release.version_code,
        "apk_url": release.apk_url,
        "sha256": release.sha256,
        "channel": release.channel,
        "min_version_code": release.min_version_code,
        "release_notes": release.release_notes,
        "rollout_percentage": release.rollout_percentage,
    }


# ---------------------------------------------------------------------------
# Admin endpoints — manage OTA releases
# ---------------------------------------------------------------------------

class CreateReleaseRequest(BaseModel):
    version_name: str
    version_code: int
    channel: str = "production"
    apk_url: str
    sha256: str
    min_version_code: int = 0
    release_notes: Optional[str] = None
    rollout_percentage: int = 100


class UpdateReleaseRequest(BaseModel):
    rollout_percentage: Optional[int] = None
    is_active: Optional[bool] = None
    release_notes: Optional[str] = None
    min_version_code: Optional[int] = None


@router.get("/admin/releases")
def list_releases(
    channel: Optional[str] = None,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Admin: list all OTA releases."""
    query = db.query(OTARelease).order_by(desc(OTARelease.version_code))
    if channel:
        query = query.filter(OTARelease.channel == channel)
    releases = query.all()

    return [
        {
            "id": r.id,
            "version_name": r.version_name,
            "version_code": r.version_code,
            "channel": r.channel,
            "apk_url": r.apk_url,
            "sha256": r.sha256,
            "min_version_code": r.min_version_code,
            "release_notes": r.release_notes,
            "rollout_percentage": r.rollout_percentage,
            "is_active": r.is_active,
            "created_at": r.created_at.isoformat() if r.created_at else None,
        }
        for r in releases
    ]


@router.post("/admin/releases")
def create_release(
    request: CreateReleaseRequest,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Admin: create a new OTA release."""
    if request.channel not in ("production", "beta"):
        raise HTTPException(status_code=400, detail="Channel must be 'production' or 'beta'.")

    if request.rollout_percentage < 0 or request.rollout_percentage > 100:
        raise HTTPException(status_code=400, detail="Rollout percentage must be 0-100.")

    # Check for duplicate version_code + channel
    existing = db.query(OTARelease).filter(
        OTARelease.version_code == request.version_code,
        OTARelease.channel == request.channel,
    ).first()
    if existing:
        raise HTTPException(
            status_code=409,
            detail=f"Version code {request.version_code} already exists for channel '{request.channel}'.",
        )

    release = OTARelease(
        version_name=request.version_name,
        version_code=request.version_code,
        channel=request.channel,
        apk_url=request.apk_url,
        sha256=request.sha256,
        min_version_code=request.min_version_code,
        release_notes=request.release_notes,
        rollout_percentage=request.rollout_percentage,
        is_active=True,
        created_by=current_user.id,
    )
    db.add(release)
    db.commit()
    db.refresh(release)

    return {
        "id": release.id,
        "version_name": release.version_name,
        "version_code": release.version_code,
        "channel": release.channel,
        "message": "Release created successfully.",
    }


@router.put("/admin/releases/{release_id}")
def update_release(
    release_id: int,
    request: UpdateReleaseRequest,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Admin: update a release (rollout %, active status, notes)."""
    release = db.query(OTARelease).filter(OTARelease.id == release_id).first()
    if not release:
        raise HTTPException(status_code=404, detail="Release not found.")

    if request.rollout_percentage is not None:
        if request.rollout_percentage < 0 or request.rollout_percentage > 100:
            raise HTTPException(status_code=400, detail="Rollout percentage must be 0-100.")
        release.rollout_percentage = request.rollout_percentage

    if request.is_active is not None:
        release.is_active = request.is_active

    if request.release_notes is not None:
        release.release_notes = request.release_notes

    if request.min_version_code is not None:
        release.min_version_code = request.min_version_code

    db.commit()

    return {"message": "Release updated.", "id": release.id}


@router.delete("/admin/releases/{release_id}")
def deactivate_release(
    release_id: int,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Admin: deactivate a release (soft delete)."""
    release = db.query(OTARelease).filter(OTARelease.id == release_id).first()
    if not release:
        raise HTTPException(status_code=404, detail="Release not found.")

    release.is_active = False
    db.commit()

    return {"message": "Release deactivated.", "id": release.id}
