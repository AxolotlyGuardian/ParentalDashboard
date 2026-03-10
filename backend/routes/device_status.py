from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from db import get_db
from models import Device, KidProfile, OTARelease
from auth_utils import require_parent

router = APIRouter(tags=["device-status"])


class DeviceInfoRequest(BaseModel):
    device_model: Optional[str] = None
    device_manufacturer: Optional[str] = None
    app_version: Optional[str] = None
    app_version_code: Optional[int] = None
    fcm_token: Optional[str] = None


def _get_device_by_headers(
    device_id: str = Header(..., alias="X-Device-ID"),
    api_key: str = Header(..., alias="X-API-Key"),
    db: Session = Depends(get_db),
) -> Device:
    """Authenticate device by X-Device-ID + X-API-Key headers."""
    device = db.query(Device).filter(Device.device_id == device_id).first()
    if not device or device.api_key != api_key:
        raise HTTPException(status_code=401, detail="Invalid device credentials")
    # Update heartbeat on every authenticated request
    device.last_active = datetime.utcnow()
    db.commit()
    return device


@router.post("/device/info")
def report_device_info(
    body: DeviceInfoRequest,
    device: Device = Depends(_get_device_by_headers),
    db: Session = Depends(get_db),
):
    """Device reports its hardware info and app version. Called on boot / periodically."""
    if body.device_model is not None:
        device.device_model = body.device_model
    if body.device_manufacturer is not None:
        device.device_manufacturer = body.device_manufacturer
    if body.app_version is not None:
        device.app_version = body.app_version
    if body.app_version_code is not None:
        device.app_version_code = body.app_version_code
    if body.fcm_token is not None:
        device.fcm_token = body.fcm_token
    db.commit()
    return {"status": "ok"}


@router.post("/device/heartbeat")
def device_heartbeat(
    device: Device = Depends(_get_device_by_headers),
    db: Session = Depends(get_db),
):
    """Lightweight heartbeat — just updates last_active (already done in dependency)."""
    return {
        "status": "ok",
        "server_time": datetime.utcnow().isoformat(),
    }


@router.get("/parent/device-status")
def get_device_status(
    current_user=Depends(require_parent),
    db: Session = Depends(get_db),
):
    """Parent: get status of all paired devices (online/offline, version, last seen)."""
    devices = db.query(Device).filter(Device.family_id == current_user.id).all()

    now = datetime.utcnow()
    result = []

    for d in devices:
        kid_profile = None
        if d.kid_profile_id:
            kid_profile = db.query(KidProfile).filter(KidProfile.id == d.kid_profile_id).first()

        # Online = heartbeat within last 5 minutes
        is_online = False
        if d.last_active:
            seconds_since = (now - d.last_active).total_seconds()
            is_online = seconds_since < 300  # 5 min

        # Check if device needs an update
        needs_update = False
        latest_version = None
        if d.app_version_code is not None:
            latest = db.query(OTARelease).filter(
                OTARelease.channel == "production",
                OTARelease.is_active == True,
            ).order_by(OTARelease.version_code.desc()).first()
            if latest:
                latest_version = latest.version_name
                needs_update = d.app_version_code < latest.version_code

        result.append({
            "id": d.id,
            "device_id": d.device_id,
            "device_name": d.device_name or f"Device {d.device_id[:8]}",
            "kid_name": kid_profile.name if kid_profile else "Unassigned",
            "kid_profile_id": d.kid_profile_id,
            "is_online": is_online,
            "last_active": d.last_active.isoformat() if d.last_active else None,
            "device_model": d.device_model,
            "device_manufacturer": d.device_manufacturer,
            "app_version": d.app_version,
            "app_version_code": d.app_version_code,
            "latest_version": latest_version,
            "needs_update": needs_update,
            "created_at": d.created_at.isoformat() if d.created_at else None,
        })

    return {"devices": result}
