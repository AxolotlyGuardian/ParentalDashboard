"""
Enhanced Usage Reporting Routes
================================
Provides rich screen-time analytics for the parent dashboard, including:
  - Daily, weekly, and monthly breakdowns
  - Per-app usage summaries
  - Per-child usage summaries
  - Trend data for charts
  - Top apps by usage

All data is scoped to the authenticated parent's family and respects the
90-day data retention policy.
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from datetime import datetime, timedelta, date
from typing import Optional, List
from pydantic import BaseModel

from db import get_db
from models import KidProfile, Device, UsageLog
from auth_utils import get_current_user

router = APIRouter(prefix="/reporting", tags=["reporting"])

# Maximum lookback enforced by data retention policy
MAX_LOOKBACK_DAYS = 90


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------

class AppUsageSummary(BaseModel):
    app_name: str
    total_minutes: int
    session_count: int
    average_session_minutes: float
    last_used: Optional[str] = None


class DailyUsage(BaseModel):
    date: str
    total_minutes: int
    session_count: int


class KidUsageSummary(BaseModel):
    kid_profile_id: int
    kid_name: str
    total_minutes: int
    session_count: int
    top_apps: List[AppUsageSummary]
    daily_breakdown: List[DailyUsage]


class FamilyReportResponse(BaseModel):
    period_start: str
    period_end: str
    total_family_minutes: int
    kids: List[KidUsageSummary]


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _clamp_days(days: int) -> int:
    """Clamp the lookback period to the data retention window."""
    return min(max(1, days), MAX_LOOKBACK_DAYS)


def _get_family_device_ids(user_id: int, db: Session) -> list:
    """Return all device IDs belonging to the authenticated parent."""
    devices = db.query(Device).filter(Device.family_id == user_id).all()
    return [d.id for d in devices]


def _get_kid_device_map(user_id: int, db: Session) -> dict:
    """Return a mapping of kid_profile_id -> list of device_ids."""
    kids = db.query(KidProfile).filter(KidProfile.parent_id == user_id).all()
    result = {}
    for kid in kids:
        devices = db.query(Device).filter(
            Device.family_id == user_id,
            Device.kid_profile_id == kid.id,
        ).all()
        result[kid] = [d.id for d in devices]
    return result


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.get("/summary", response_model=FamilyReportResponse)
def get_family_report(
    days: int = Query(default=7, ge=1, le=MAX_LOOKBACK_DAYS, description="Lookback period in days"),
    auth_data: tuple = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Return a full family usage report for the specified lookback period.

    Includes per-child breakdowns with daily usage and top apps.
    """
    user, _, role, _ = auth_data
    if role != "parent":
        raise HTTPException(status_code=403, detail="Parent authentication required")

    days = _clamp_days(days)
    cutoff = datetime.utcnow() - timedelta(days=days)
    period_start = cutoff.date().isoformat()
    period_end = date.today().isoformat()

    kid_device_map = _get_kid_device_map(user.id, db)
    total_family_minutes = 0
    kids_summaries = []

    for kid, device_ids in kid_device_map.items():
        if not device_ids:
            kids_summaries.append(KidUsageSummary(
                kid_profile_id=kid.id,
                kid_name=kid.name,
                total_minutes=0,
                session_count=0,
                top_apps=[],
                daily_breakdown=[],
            ))
            continue

        # Aggregate per-app usage
        app_rows = (
            db.query(
                UsageLog.app_name,
                func.sum(UsageLog.duration_minutes).label("total_minutes"),
                func.count(UsageLog.id).label("session_count"),
                func.max(UsageLog.end_time).label("last_used"),
            )
            .filter(
                UsageLog.device_id.in_(device_ids),
                UsageLog.start_time >= cutoff,
            )
            .group_by(UsageLog.app_name)
            .order_by(func.sum(UsageLog.duration_minutes).desc())
            .limit(10)
            .all()
        )

        top_apps = [
            AppUsageSummary(
                app_name=row.app_name,
                total_minutes=int(row.total_minutes or 0),
                session_count=int(row.session_count or 0),
                average_session_minutes=round(
                    (row.total_minutes or 0) / max(row.session_count, 1), 1
                ),
                last_used=row.last_used.isoformat() if row.last_used else None,
            )
            for row in app_rows
        ]

        # Daily breakdown
        daily_rows = (
            db.query(
                func.date(UsageLog.start_time).label("usage_date"),
                func.sum(UsageLog.duration_minutes).label("total_minutes"),
                func.count(UsageLog.id).label("session_count"),
            )
            .filter(
                UsageLog.device_id.in_(device_ids),
                UsageLog.start_time >= cutoff,
            )
            .group_by(func.date(UsageLog.start_time))
            .order_by(func.date(UsageLog.start_time))
            .all()
        )

        daily_breakdown = [
            DailyUsage(
                date=str(row.usage_date),
                total_minutes=int(row.total_minutes or 0),
                session_count=int(row.session_count or 0),
            )
            for row in daily_rows
        ]

        kid_total = sum(d.total_minutes for d in daily_breakdown)
        kid_sessions = sum(d.session_count for d in daily_breakdown)
        total_family_minutes += kid_total

        kids_summaries.append(KidUsageSummary(
            kid_profile_id=kid.id,
            kid_name=kid.name,
            total_minutes=kid_total,
            session_count=kid_sessions,
            top_apps=top_apps,
            daily_breakdown=daily_breakdown,
        ))

    return FamilyReportResponse(
        period_start=period_start,
        period_end=period_end,
        total_family_minutes=total_family_minutes,
        kids=kids_summaries,
    )


@router.get("/kid/{kid_profile_id}/apps")
def get_kid_app_breakdown(
    kid_profile_id: int,
    days: int = Query(default=30, ge=1, le=MAX_LOOKBACK_DAYS),
    auth_data: tuple = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Return a detailed per-app usage breakdown for a specific child profile.
    """
    user, _, role, _ = auth_data
    if role != "parent":
        raise HTTPException(status_code=403, detail="Parent authentication required")

    # Verify ownership
    kid = db.query(KidProfile).filter(
        KidProfile.id == kid_profile_id,
        KidProfile.parent_id == user.id,
    ).first()
    if not kid:
        raise HTTPException(status_code=404, detail="Child profile not found")

    days = _clamp_days(days)
    cutoff = datetime.utcnow() - timedelta(days=days)

    device_ids = [
        d.id for d in db.query(Device).filter(
            Device.family_id == user.id,
            Device.kid_profile_id == kid_profile_id,
        ).all()
    ]

    if not device_ids:
        return {"kid_name": kid.name, "apps": [], "period_days": days}

    rows = (
        db.query(
            UsageLog.app_name,
            func.sum(UsageLog.duration_minutes).label("total_minutes"),
            func.count(UsageLog.id).label("session_count"),
            func.min(UsageLog.start_time).label("first_used"),
            func.max(UsageLog.end_time).label("last_used"),
        )
        .filter(
            UsageLog.device_id.in_(device_ids),
            UsageLog.start_time >= cutoff,
        )
        .group_by(UsageLog.app_name)
        .order_by(func.sum(UsageLog.duration_minutes).desc())
        .all()
    )

    apps = [
        {
            "app_name": row.app_name,
            "total_minutes": int(row.total_minutes or 0),
            "total_hours": round((row.total_minutes or 0) / 60, 1),
            "session_count": int(row.session_count or 0),
            "average_session_minutes": round(
                (row.total_minutes or 0) / max(row.session_count, 1), 1
            ),
            "first_used": row.first_used.isoformat() if row.first_used else None,
            "last_used": row.last_used.isoformat() if row.last_used else None,
        }
        for row in rows
    ]

    return {
        "kid_name": kid.name,
        "period_days": days,
        "period_start": cutoff.date().isoformat(),
        "period_end": date.today().isoformat(),
        "total_minutes": sum(a["total_minutes"] for a in apps),
        "apps": apps,
    }


@router.get("/kid/{kid_profile_id}/trend")
def get_kid_usage_trend(
    kid_profile_id: int,
    days: int = Query(default=30, ge=7, le=MAX_LOOKBACK_DAYS),
    auth_data: tuple = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Return daily screen-time trend data for a specific child, suitable for
    rendering a line or bar chart on the parent dashboard.
    """
    user, _, role, _ = auth_data
    if role != "parent":
        raise HTTPException(status_code=403, detail="Parent authentication required")

    kid = db.query(KidProfile).filter(
        KidProfile.id == kid_profile_id,
        KidProfile.parent_id == user.id,
    ).first()
    if not kid:
        raise HTTPException(status_code=404, detail="Child profile not found")

    days = _clamp_days(days)
    cutoff = datetime.utcnow() - timedelta(days=days)

    device_ids = [
        d.id for d in db.query(Device).filter(
            Device.family_id == user.id,
            Device.kid_profile_id == kid_profile_id,
        ).all()
    ]

    # Build a complete date series (fill in zeros for days with no usage)
    daily_data = {}
    for i in range(days):
        day = (cutoff + timedelta(days=i)).date()
        daily_data[str(day)] = {"date": str(day), "total_minutes": 0, "session_count": 0}

    if device_ids:
        rows = (
            db.query(
                func.date(UsageLog.start_time).label("usage_date"),
                func.sum(UsageLog.duration_minutes).label("total_minutes"),
                func.count(UsageLog.id).label("session_count"),
            )
            .filter(
                UsageLog.device_id.in_(device_ids),
                UsageLog.start_time >= cutoff,
            )
            .group_by(func.date(UsageLog.start_time))
            .all()
        )
        for row in rows:
            key = str(row.usage_date)
            if key in daily_data:
                daily_data[key]["total_minutes"] = int(row.total_minutes or 0)
                daily_data[key]["session_count"] = int(row.session_count or 0)

    trend = sorted(daily_data.values(), key=lambda x: x["date"])
    average_daily = round(sum(d["total_minutes"] for d in trend) / max(len(trend), 1), 1)

    return {
        "kid_name": kid.name,
        "period_days": days,
        "average_daily_minutes": average_daily,
        "trend": trend,
    }
