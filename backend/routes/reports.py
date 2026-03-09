from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta
from db import get_db
from models import User, Device, KidProfile, UsageLog, WeeklyReport
from auth_utils import require_parent, require_admin
from config import settings
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/reports", tags=["reports"])


def _generate_weekly_report_data(
    user_id: int,
    week_start: datetime,
    week_end: datetime,
    db: Session,
) -> dict:
    """Build the weekly report data structure for a family."""
    devices = db.query(Device).filter(Device.family_id == user_id).all()
    device_ids = [d.id for d in devices]

    if not device_ids:
        return {"total_minutes": 0, "daily_breakdown": [], "per_child": [], "top_apps": []}

    # Get all usage logs for the week
    logs = (
        db.query(UsageLog)
        .filter(
            UsageLog.device_id.in_(device_ids),
            UsageLog.start_time >= week_start,
            UsageLog.start_time < week_end,
        )
        .all()
    )

    total_minutes = sum(l.duration_minutes for l in logs)

    # Daily breakdown (7 days)
    daily_breakdown = []
    for day_offset in range(7):
        day = week_start + timedelta(days=day_offset)
        day_end = day + timedelta(days=1)
        day_logs = [l for l in logs if day <= l.start_time < day_end]
        day_minutes = sum(l.duration_minutes for l in day_logs)
        daily_breakdown.append({
            "date": day.strftime("%Y-%m-%d"),
            "day_name": day.strftime("%A"),
            "minutes": day_minutes,
        })

    # Per-child breakdown
    device_to_kid: dict[int, str] = {}
    for d in devices:
        if d.kid_profile_id:
            kid = db.query(KidProfile).filter(KidProfile.id == d.kid_profile_id).first()
            device_to_kid[d.id] = kid.name if kid else "Unknown"
        else:
            device_to_kid[d.id] = "Unassigned"

    child_minutes: dict[str, int] = {}
    child_apps: dict[str, dict[str, int]] = {}
    for l in logs:
        kid_name = device_to_kid.get(l.device_id, "Unknown")
        child_minutes[kid_name] = child_minutes.get(kid_name, 0) + l.duration_minutes
        if kid_name not in child_apps:
            child_apps[kid_name] = {}
        child_apps[kid_name][l.app_name] = child_apps[kid_name].get(l.app_name, 0) + l.duration_minutes

    per_child = []
    for name, minutes in sorted(child_minutes.items(), key=lambda x: -x[1]):
        apps = child_apps.get(name, {})
        top = sorted(apps.items(), key=lambda x: -x[1])[:3]
        per_child.append({
            "name": name,
            "total_minutes": minutes,
            "top_apps": [{"app": a, "minutes": m} for a, m in top],
        })

    # Global top apps
    app_minutes: dict[str, int] = {}
    for l in logs:
        app_minutes[l.app_name] = app_minutes.get(l.app_name, 0) + l.duration_minutes
    top_apps = [
        {"app": a, "minutes": m}
        for a, m in sorted(app_minutes.items(), key=lambda x: -x[1])[:5]
    ]

    return {
        "total_minutes": total_minutes,
        "daily_breakdown": daily_breakdown,
        "per_child": per_child,
        "top_apps": top_apps,
    }


def _send_report_email(email: str, report_data: dict, week_start: datetime, week_end: datetime):
    """Send the weekly report email. Falls back to logging if SendGrid not configured."""
    total_hrs = report_data["total_minutes"] / 60

    subject = f"Axolotly Weekly Report — {week_start.strftime('%b %d')} to {week_end.strftime('%b %d')}"
    body_lines = [
        f"Hi! Here's your family's screen time summary for the week of {week_start.strftime('%b %d')}.\n",
        f"Total screen time: {total_hrs:.1f} hours ({report_data['total_minutes']} minutes)\n",
    ]

    if report_data["per_child"]:
        body_lines.append("Per child:")
        for child in report_data["per_child"]:
            hrs = child["total_minutes"] / 60
            body_lines.append(f"  - {child['name']}: {hrs:.1f} hrs")
            for app_stat in child["top_apps"]:
                body_lines.append(f"      {app_stat['app']}: {app_stat['minutes']} min")

    body_lines.append("\nDaily breakdown:")
    for day in report_data["daily_breakdown"]:
        bar = "#" * max(1, day["minutes"] // 10)
        body_lines.append(f"  {day['day_name'][:3]}: {day['minutes']} min  {bar}")

    body_lines.append("\n— The Axolotly Team")
    body = "\n".join(body_lines)

    if not settings.SENDGRID_API_KEY:
        logger.info("WEEKLY REPORT to %s — %s\n%s  [SendGrid not configured]", email, subject, body)
        return

    try:
        import sendgrid
        from sendgrid.helpers.mail import Mail

        sg = sendgrid.SendGridAPIClient(api_key=settings.SENDGRID_API_KEY)
        message = Mail(
            from_email=settings.EMAIL_FROM,
            to_emails=email,
            subject=subject,
            plain_text_content=body,
        )
        sg.send(message)
        logger.info("Weekly report sent to %s", email)
    except Exception as e:
        logger.error("Failed to send weekly report to %s: %s", email, e)


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.get("/weekly")
def get_weekly_report(
    week_offset: int = 0,
    current_user: User = Depends(require_parent),
    db: Session = Depends(get_db),
):
    """Get weekly screen time report for the current family.

    week_offset=0 means this week, 1 = last week, etc.
    """
    today = datetime.utcnow().date()
    # Week starts Monday
    week_start_date = today - timedelta(days=today.weekday() + 7 * week_offset)
    week_start = datetime.combine(week_start_date, datetime.min.time())
    week_end = week_start + timedelta(days=7)

    # Check for cached report
    existing = db.query(WeeklyReport).filter(
        WeeklyReport.user_id == current_user.id,
        WeeklyReport.week_start == week_start,
    ).first()

    if existing:
        return {
            "week_start": week_start.isoformat(),
            "week_end": week_end.isoformat(),
            "report": existing.report_data,
        }

    # Generate fresh
    report_data = _generate_weekly_report_data(current_user.id, week_start, week_end, db)

    # Cache completed weeks
    if week_end <= datetime.combine(today, datetime.min.time()):
        report = WeeklyReport(
            user_id=current_user.id,
            week_start=week_start,
            week_end=week_end,
            report_data=report_data,
        )
        db.add(report)
        db.commit()

    return {
        "week_start": week_start.isoformat(),
        "week_end": week_end.isoformat(),
        "report": report_data,
    }


@router.post("/weekly/send-all")
def send_weekly_reports(
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Admin: trigger weekly report generation and email for all families.

    In production this would be called by a cron job (e.g., every Monday at 8 AM).
    """
    today = datetime.utcnow().date()
    # Last week
    week_start_date = today - timedelta(days=today.weekday() + 7)
    week_start = datetime.combine(week_start_date, datetime.min.time())
    week_end = week_start + timedelta(days=7)

    parents = db.query(User).filter(User.is_admin == False).all()
    sent_count = 0

    for parent in parents:
        # Skip if already sent
        existing = db.query(WeeklyReport).filter(
            WeeklyReport.user_id == parent.id,
            WeeklyReport.week_start == week_start,
            WeeklyReport.email_sent == True,
        ).first()
        if existing:
            continue

        report_data = _generate_weekly_report_data(parent.id, week_start, week_end, db)

        # Skip if no usage
        if report_data["total_minutes"] == 0:
            continue

        # Save report
        report = db.query(WeeklyReport).filter(
            WeeklyReport.user_id == parent.id,
            WeeklyReport.week_start == week_start,
        ).first()
        if not report:
            report = WeeklyReport(
                user_id=parent.id,
                week_start=week_start,
                week_end=week_end,
                report_data=report_data,
            )
            db.add(report)

        _send_report_email(parent.email, report_data, week_start, week_end)
        report.email_sent = True
        db.commit()
        sent_count += 1

    return {"sent": sent_count, "week": week_start.strftime("%Y-%m-%d")}
