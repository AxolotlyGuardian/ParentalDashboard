from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from db import get_db
from models import User, NPSSurvey
from auth_utils import require_parent, require_admin

router = APIRouter(prefix="/nps", tags=["nps"])

# Trigger days after account creation
NPS_TRIGGER_DAYS = [30, 90]


class NPSSubmitRequest(BaseModel):
    score: int             # 0-10
    comment: Optional[str] = None


# ---------------------------------------------------------------------------
# Parent endpoints
# ---------------------------------------------------------------------------

@router.get("/check")
def check_nps_due(
    current_user: User = Depends(require_parent),
    db: Session = Depends(get_db),
):
    """Check if an NPS survey is due for this user.

    Returns the pending survey if one exists, or creates one if the user
    has crossed a trigger day boundary without being surveyed.
    """
    now = datetime.utcnow()
    days_since_signup = (now - current_user.created_at).days if current_user.created_at else 0

    # Check existing pending survey first
    pending = db.query(NPSSurvey).filter(
        NPSSurvey.user_id == current_user.id,
        NPSSurvey.status == "pending",
    ).first()

    if pending:
        # Mark as shown if first time
        if not pending.shown_at:
            pending.shown_at = now
            db.commit()
        return {
            "survey_due": True,
            "survey_id": pending.id,
            "trigger_day": pending.trigger_day,
        }

    # Check if we should create a new survey
    for trigger_day in NPS_TRIGGER_DAYS:
        if days_since_signup >= trigger_day:
            existing = db.query(NPSSurvey).filter(
                NPSSurvey.user_id == current_user.id,
                NPSSurvey.trigger_day == trigger_day,
            ).first()
            if not existing:
                survey = NPSSurvey(
                    user_id=current_user.id,
                    trigger_day=trigger_day,
                    status="pending",
                    shown_at=now,
                )
                db.add(survey)
                db.commit()
                db.refresh(survey)
                return {
                    "survey_due": True,
                    "survey_id": survey.id,
                    "trigger_day": trigger_day,
                }

    return {"survey_due": False}


@router.post("/{survey_id}/submit")
def submit_nps(
    survey_id: int,
    request: NPSSubmitRequest,
    current_user: User = Depends(require_parent),
    db: Session = Depends(get_db),
):
    """Submit an NPS survey response."""
    survey = db.query(NPSSurvey).filter(
        NPSSurvey.id == survey_id,
        NPSSurvey.user_id == current_user.id,
    ).first()

    if not survey:
        raise HTTPException(status_code=404, detail="Survey not found.")

    if survey.status == "completed":
        raise HTTPException(status_code=400, detail="Survey already submitted.")

    if request.score < 0 or request.score > 10:
        raise HTTPException(status_code=400, detail="Score must be 0-10.")

    survey.score = request.score
    survey.comment = request.comment
    survey.status = "completed"
    survey.responded_at = datetime.utcnow()
    db.commit()

    return {"message": "Thank you for your feedback!", "score": request.score}


@router.post("/{survey_id}/dismiss")
def dismiss_nps(
    survey_id: int,
    current_user: User = Depends(require_parent),
    db: Session = Depends(get_db),
):
    """Dismiss an NPS survey (user chose not to respond)."""
    survey = db.query(NPSSurvey).filter(
        NPSSurvey.id == survey_id,
        NPSSurvey.user_id == current_user.id,
        NPSSurvey.status == "pending",
    ).first()

    if not survey:
        raise HTTPException(status_code=404, detail="Survey not found.")

    survey.status = "dismissed"
    survey.responded_at = datetime.utcnow()
    db.commit()

    return {"message": "Survey dismissed."}


# ---------------------------------------------------------------------------
# Admin endpoints
# ---------------------------------------------------------------------------

@router.get("/admin/results")
def get_nps_results(
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Admin: view NPS results summary and individual responses."""
    surveys = db.query(NPSSurvey).filter(NPSSurvey.status == "completed").all()

    if not surveys:
        return {
            "total_responses": 0,
            "average_score": None,
            "nps_score": None,
            "responses": [],
        }

    scores = [s.score for s in surveys]
    avg_score = sum(scores) / len(scores)

    # NPS = % promoters (9-10) minus % detractors (0-6)
    promoters = sum(1 for s in scores if s >= 9)
    detractors = sum(1 for s in scores if s <= 6)
    nps_score = round(((promoters - detractors) / len(scores)) * 100)

    responses = []
    for s in surveys:
        user = db.query(User).filter(User.id == s.user_id).first()
        responses.append({
            "id": s.id,
            "email": user.email if user else None,
            "score": s.score,
            "comment": s.comment,
            "trigger_day": s.trigger_day,
            "responded_at": s.responded_at.isoformat() if s.responded_at else None,
        })

    return {
        "total_responses": len(surveys),
        "average_score": round(avg_score, 1),
        "nps_score": nps_score,
        "breakdown": {
            "promoters": promoters,
            "passives": sum(1 for s in scores if 7 <= s <= 8),
            "detractors": detractors,
        },
        "responses": sorted(responses, key=lambda r: r["responded_at"] or "", reverse=True),
    }
