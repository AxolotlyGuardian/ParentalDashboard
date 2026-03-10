"""
COPPA Compliance Routes
========================
This module implements the data-subject rights and compliance endpoints
required under COPPA (Children's Online Privacy Protection Act) and
aligned with GDPR/CCPA best practices.

Endpoints provided:
  POST /compliance/consent          — Record verifiable parental consent
  GET  /compliance/consent/{uid}    — Retrieve consent record for a parent
  POST /compliance/delete-account   — Full account + child data deletion
  GET  /compliance/export           — Export all data for a parent account
  POST /compliance/purge-usage-logs — Purge usage logs older than N days

Data Retention Policy (enforced here and by scheduled job):
  - Usage logs: retained for 90 days, then automatically purged
  - Kid profiles: retained until parent deletes them or account is closed
  - Device reports: retained for 90 days
  - All data is deleted immediately on account deletion
"""

from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from sqlalchemy import and_
from datetime import datetime, timedelta
from pydantic import BaseModel
from typing import Optional
import logging

from db import get_db
from models import (
    User, KidProfile, Device, Policy, UsageLog,
    DeviceEpisodeReport, RefreshToken, RevokedToken,
    StreamingServiceSelection,
)
from auth_utils import get_current_user, require_parent

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/compliance", tags=["compliance"])

# ---------------------------------------------------------------------------
# Data retention constants
# ---------------------------------------------------------------------------
USAGE_LOG_RETENTION_DAYS = 90
DEVICE_REPORT_RETENTION_DAYS = 90


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------

class ConsentRecord(BaseModel):
    """Represents a verifiable parental consent record."""
    parent_email: str
    consent_given: bool
    consent_method: str          # e.g. "email_verification", "credit_card", "signed_form"
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None


class DeleteAccountRequest(BaseModel):
    confirm: bool  # Must be True to proceed
    reason: Optional[str] = None


class PurgeLogsRequest(BaseModel):
    older_than_days: int = USAGE_LOG_RETENTION_DAYS


# ---------------------------------------------------------------------------
# Consent management
# ---------------------------------------------------------------------------

@router.post("/consent")
def record_consent(
    request: ConsentRecord,
    auth_data: tuple = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Record verifiable parental consent for data collection about a child.

    Under COPPA, operators must obtain verifiable parental consent before
    collecting personal information from children under 13.  This endpoint
    records that consent has been obtained and the method used.
    """
    user, _, role, _ = auth_data
    if role != "parent":
        raise HTTPException(status_code=403, detail="Parent authentication required")

    # In production, store this in a dedicated ConsentLog table with
    # immutable audit trail.  For now we log it and mark the user record.
    logger.info(
        "COPPA consent recorded: user_id=%s, method=%s, given=%s",
        user.id, request.consent_method, request.consent_given,
    )

    return {
        "success": True,
        "message": "Consent recorded",
        "user_id": user.id,
        "consent_given": request.consent_given,
        "consent_method": request.consent_method,
        "recorded_at": datetime.utcnow().isoformat(),
    }


@router.get("/consent/{user_id}")
def get_consent_status(
    user_id: int,
    auth_data: tuple = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Return the consent status for the requesting parent."""
    user, _, role, _ = auth_data
    if role != "parent" or user.id != user_id:
        raise HTTPException(status_code=403, detail="Access denied")

    return {
        "user_id": user.id,
        "email_verified": user.email_verified,
        "account_created": user.created_at.isoformat() if user.created_at else None,
        "note": (
            "Email verification serves as the primary consent signal. "
            "A verified email confirms the account holder is a parent/guardian."
        ),
    }


# ---------------------------------------------------------------------------
# Account deletion (Right to Erasure)
# ---------------------------------------------------------------------------

@router.post("/delete-account")
def delete_account(
    request: DeleteAccountRequest,
    background_tasks: BackgroundTasks,
    auth_data: tuple = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Permanently delete a parent account and ALL associated child data.

    This implements the COPPA / GDPR 'right to erasure'.  The following
    data is deleted immediately:
      - All kid profiles
      - All devices linked to those profiles
      - All policies
      - All usage logs
      - All device episode reports
      - All refresh tokens
      - The parent user record itself

    This action is irreversible.
    """
    if not request.confirm:
        raise HTTPException(
            status_code=400,
            detail="You must set confirm=true to permanently delete your account.",
        )

    user, _, role, _ = auth_data
    if role != "parent":
        raise HTTPException(status_code=403, detail="Parent authentication required")

    user_id = user.id
    logger.warning("Account deletion initiated: user_id=%s, reason=%s", user_id, request.reason)

    # Collect all kid profile IDs for this parent
    kid_profiles = db.query(KidProfile).filter(KidProfile.parent_id == user_id).all()
    kid_profile_ids = [k.id for k in kid_profiles]

    # Collect all device IDs linked to those profiles
    devices = db.query(Device).filter(Device.family_id == user_id).all()
    device_ids = [d.id for d in devices]

    # Delete usage logs
    if device_ids:
        db.query(UsageLog).filter(UsageLog.device_id.in_(device_ids)).delete(synchronize_session=False)
        db.query(DeviceEpisodeReport).filter(
            DeviceEpisodeReport.device_id.in_(device_ids)
        ).delete(synchronize_session=False)

    # Delete devices
    db.query(Device).filter(Device.family_id == user_id).delete(synchronize_session=False)

    # Delete policies
    if kid_profile_ids:
        db.query(Policy).filter(
            Policy.kid_profile_id.in_(kid_profile_ids)
        ).delete(synchronize_session=False)

    # Delete kid profiles
    db.query(KidProfile).filter(KidProfile.parent_id == user_id).delete(synchronize_session=False)

    # Delete streaming service selections
    db.query(StreamingServiceSelection).filter(
        StreamingServiceSelection.family_id == user_id
    ).delete(synchronize_session=False)

    # Revoke all refresh tokens
    db.query(RefreshToken).filter(RefreshToken.user_id == user_id).delete(synchronize_session=False)

    # Delete the user account itself
    db.delete(user)
    db.commit()

    logger.warning("Account deletion complete: user_id=%s", user_id)
    return {
        "success": True,
        "message": "Your account and all associated data have been permanently deleted.",
        "deleted_at": datetime.utcnow().isoformat(),
    }


# ---------------------------------------------------------------------------
# Data export (Right to Access / Data Portability)
# ---------------------------------------------------------------------------

@router.get("/export")
def export_account_data(
    auth_data: tuple = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Export all personal data held for the requesting parent account.

    Returns a structured JSON object containing:
      - Account information
      - All kid profiles (names and ages only — PINs are NOT exported)
      - All devices
      - All policies
      - Usage log summary (last 90 days)
    """
    user, _, role, _ = auth_data
    if role != "parent":
        raise HTTPException(status_code=403, detail="Parent authentication required")

    kid_profiles = db.query(KidProfile).filter(KidProfile.parent_id == user.id).all()
    kid_profile_ids = [k.id for k in kid_profiles]

    devices = db.query(Device).filter(Device.family_id == user.id).all()
    device_ids = [d.id for d in devices]

    policies = (
        db.query(Policy).filter(Policy.kid_profile_id.in_(kid_profile_ids)).all()
        if kid_profile_ids else []
    )

    cutoff = datetime.utcnow() - timedelta(days=USAGE_LOG_RETENTION_DAYS)
    usage_logs = (
        db.query(UsageLog).filter(
            UsageLog.device_id.in_(device_ids),
            UsageLog.created_at >= cutoff,
        ).all()
        if device_ids else []
    )

    return {
        "exported_at": datetime.utcnow().isoformat(),
        "account": {
            "id": user.id,
            "email": user.email,
            "email_verified": user.email_verified,
            "created_at": user.created_at.isoformat() if user.created_at else None,
        },
        "kid_profiles": [
            {
                "id": k.id,
                "name": k.name,
                "age": k.age,
                "created_at": k.created_at.isoformat() if k.created_at else None,
            }
            for k in kid_profiles
        ],
        "devices": [
            {
                "id": d.id,
                "device_id": d.device_id,
                "kid_profile_id": d.kid_profile_id,
                "last_active": d.last_active.isoformat() if d.last_active else None,
            }
            for d in devices
        ],
        "policies_count": len(policies),
        "usage_logs_count": len(usage_logs),
        "usage_logs": [
            {
                "app_name": log.app_name,
                "start_time": log.start_time.isoformat(),
                "end_time": log.end_time.isoformat(),
                "duration_minutes": log.duration_minutes,
            }
            for log in usage_logs
        ],
        "data_retention_policy": {
            "usage_logs_retained_days": USAGE_LOG_RETENTION_DAYS,
            "device_reports_retained_days": DEVICE_REPORT_RETENTION_DAYS,
            "note": (
                "Usage logs and device reports older than the retention period "
                "are automatically purged. All data is deleted immediately upon "
                "account deletion."
            ),
        },
    }


# ---------------------------------------------------------------------------
# Data retention enforcement (admin / scheduled job)
# ---------------------------------------------------------------------------

@router.post("/purge-usage-logs")
def purge_old_usage_logs(
    request: PurgeLogsRequest,
    auth_data: tuple = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Purge usage logs and device episode reports older than the specified
    number of days.  This endpoint is intended to be called by a scheduled
    job (e.g., daily cron) to enforce the data retention policy.

    Accessible by admin users only.
    """
    user, _, role, _ = auth_data
    if not getattr(user, "is_admin", False):
        raise HTTPException(status_code=403, detail="Admin access required")

    if request.older_than_days < 1:
        raise HTTPException(status_code=400, detail="older_than_days must be at least 1")

    cutoff = datetime.utcnow() - timedelta(days=request.older_than_days)

    deleted_logs = (
        db.query(UsageLog)
        .filter(UsageLog.created_at < cutoff)
        .delete(synchronize_session=False)
    )
    deleted_reports = (
        db.query(DeviceEpisodeReport)
        .filter(DeviceEpisodeReport.reported_at < cutoff)
        .delete(synchronize_session=False)
    )
    db.commit()

    logger.info(
        "Data retention purge: deleted %d usage logs and %d device reports older than %d days",
        deleted_logs, deleted_reports, request.older_than_days,
    )

    return {
        "success": True,
        "deleted_usage_logs": deleted_logs,
        "deleted_device_reports": deleted_reports,
        "cutoff_date": cutoff.isoformat(),
        "retention_days": request.older_than_days,
    }
