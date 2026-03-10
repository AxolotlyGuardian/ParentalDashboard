from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from db import get_db
from models import User, Device, KidProfile
from auth_utils import require_parent, require_admin
from config import settings
import logging
import json

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/notifications", tags=["notifications"])


class SendNotificationRequest(BaseModel):
    device_id: Optional[int] = None     # specific device, or None for all family devices
    title: str
    body: str
    data: Optional[dict] = None         # extra payload for the app


class RegisterTokenRequest(BaseModel):
    fcm_token: str


# ---------------------------------------------------------------------------
# FCM helper
# ---------------------------------------------------------------------------

def _send_fcm_message(fcm_token: str, title: str, body: str, data: Optional[dict] = None) -> bool:
    """Send a push notification via Firebase Cloud Messaging (HTTP v1 API).

    Requires FIREBASE_SERVER_KEY or FIREBASE_SERVICE_ACCOUNT env var.
    Returns True on success, False on failure.
    """
    server_key = getattr(settings, "FIREBASE_SERVER_KEY", "") or ""

    if not server_key:
        logger.warning(
            "FCM not configured — would send: title=%s, body=%s, token=%s...  [set FIREBASE_SERVER_KEY]",
            title, body, fcm_token[:20],
        )
        return False

    try:
        import httpx

        message = {
            "to": fcm_token,
            "notification": {
                "title": title,
                "body": body,
            },
        }
        if data:
            message["data"] = {k: str(v) for k, v in data.items()}

        resp = httpx.post(
            "https://fcm.googleapis.com/fcm/send",
            json=message,
            headers={
                "Authorization": f"key={server_key}",
                "Content-Type": "application/json",
            },
            timeout=10,
        )

        if resp.status_code == 200:
            result = resp.json()
            if result.get("success", 0) > 0:
                logger.info("FCM sent to %s...", fcm_token[:20])
                return True
            else:
                logger.warning("FCM delivery failed: %s", result)
                return False
        else:
            logger.error("FCM HTTP error %d: %s", resp.status_code, resp.text[:200])
            return False
    except Exception as e:
        logger.error("FCM send error: %s", e)
        return False


def send_to_family_devices(user_id: int, title: str, body: str, db: Session, data: Optional[dict] = None):
    """Send a push notification to all devices belonging to a family."""
    devices = db.query(Device).filter(
        Device.family_id == user_id,
        Device.fcm_token.isnot(None),
    ).all()

    sent = 0
    for device in devices:
        if _send_fcm_message(device.fcm_token, title, body, data):
            sent += 1
    return sent


# ---------------------------------------------------------------------------
# Parent endpoints
# ---------------------------------------------------------------------------

@router.post("/send")
def send_notification(
    request: SendNotificationRequest,
    current_user: User = Depends(require_parent),
    db: Session = Depends(get_db),
):
    """Parent: send a push notification to a specific device or all family devices.

    Use cases: "Time to stop!", "Dinner's ready!", custom messages.
    """
    if request.device_id:
        device = db.query(Device).filter(
            Device.id == request.device_id,
            Device.family_id == current_user.id,
        ).first()
        if not device:
            raise HTTPException(status_code=404, detail="Device not found.")
        if not device.fcm_token:
            raise HTTPException(status_code=400, detail="Device has no push token registered.")

        success = _send_fcm_message(device.fcm_token, request.title, request.body, request.data)
        return {"sent": 1 if success else 0, "total_devices": 1}
    else:
        sent = send_to_family_devices(
            current_user.id, request.title, request.body, db, request.data
        )
        devices_count = db.query(Device).filter(
            Device.family_id == current_user.id,
            Device.fcm_token.isnot(None),
        ).count()
        return {"sent": sent, "total_devices": devices_count}


# ---------------------------------------------------------------------------
# System notifications (called internally by other routes)
# ---------------------------------------------------------------------------

def notify_time_limit_warning(user_id: int, kid_name: str, minutes_remaining: int, db: Session):
    """Send time limit warning to family devices."""
    send_to_family_devices(
        user_id,
        "Screen Time Warning",
        f"{kid_name} has {minutes_remaining} minutes of screen time remaining.",
        db,
        data={"type": "time_limit_warning", "minutes_remaining": minutes_remaining},
    )


def notify_bedtime_reminder(user_id: int, minutes_until_bedtime: int, db: Session):
    """Send bedtime reminder to family devices."""
    send_to_family_devices(
        user_id,
        "Bedtime Reminder",
        f"Bedtime starts in {minutes_until_bedtime} minutes. Time to wind down!",
        db,
        data={"type": "bedtime_reminder", "minutes_until": minutes_until_bedtime},
    )


def notify_weekly_summary(user_id: int, total_hours: float, db: Session):
    """Send weekly summary push notification."""
    send_to_family_devices(
        user_id,
        "Weekly Screen Time Summary",
        f"Your family used {total_hours:.1f} hours of screen time this week. Check your email for the full report!",
        db,
        data={"type": "weekly_summary"},
    )
