"""
Chinampas Community Feature API

Community-created content collections that parents can browse, plant, and adopt.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, or_
from pydantic import BaseModel, field_validator
from typing import List, Optional
from datetime import datetime
from db import get_db
from models import (
    Chinampa, ChinampaTitle, ChinampaAdoption, ChinampaReport,
    Title, Policy, KidProfile, User,
)
from auth_utils import require_parent, require_admin
import logging
import re

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/chinampas", tags=["chinampas"])

VALID_AGE_RANGES = ["1-3", "2-4", "3-8", "5-12", "6-10", "8-14"]
TITLES_MIN = 3
TITLES_MAX = 100
MAX_CHINAMPAS_PER_USER = 10

# --- Request / Response schemas ---

class ChinampaCreateRequest(BaseModel):
    name: str
    description: str
    age_range: str
    title_ids: List[int]
    publish: bool = False

    @field_validator("name")
    @classmethod
    def name_valid(cls, v: str) -> str:
        v = v.strip()
        if not v or len(v) > 60:
            raise ValueError("Name must be 1-60 characters")
        return v

    @field_validator("description")
    @classmethod
    def description_valid(cls, v: str) -> str:
        v = v.strip()
        if not v or len(v) > 500:
            raise ValueError("Description must be 1-500 characters")
        return v

    @field_validator("age_range")
    @classmethod
    def age_range_valid(cls, v: str) -> str:
        if v not in VALID_AGE_RANGES:
            raise ValueError(f"age_range must be one of: {VALID_AGE_RANGES}")
        return v


class ChinampaUpdateRequest(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    age_range: Optional[str] = None
    title_ids: Optional[List[int]] = None

    @field_validator("name")
    @classmethod
    def name_valid(cls, v):
        if v is not None:
            v = v.strip()
            if not v or len(v) > 60:
                raise ValueError("Name must be 1-60 characters")
        return v

    @field_validator("description")
    @classmethod
    def description_valid(cls, v):
        if v is not None:
            v = v.strip()
            if not v or len(v) > 500:
                raise ValueError("Description must be 1-500 characters")
        return v

    @field_validator("age_range")
    @classmethod
    def age_range_valid(cls, v):
        if v is not None and v not in VALID_AGE_RANGES:
            raise ValueError(f"age_range must be one of: {VALID_AGE_RANGES}")
        return v


class AdoptRequest(BaseModel):
    child_profile_id: int
    excluded_title_ids: List[int] = []


class ReportRequest(BaseModel):
    reason: str

    @field_validator("reason")
    @classmethod
    def reason_valid(cls, v: str) -> str:
        v = v.strip()
        if not v or len(v) > 1000:
            raise ValueError("Reason must be 1-1000 characters")
        return v


class RejectRequest(BaseModel):
    reason: Optional[str] = None


# --- Helpers ---

def _serialize_title(title: Title) -> dict:
    return {
        "id": title.id,
        "tmdb_id": title.tmdb_id,
        "title": title.title,
        "media_type": title.media_type,
        "poster_path": f"https://image.tmdb.org/t/p/w500{title.poster_path}" if title.poster_path else None,
        "rating": title.rating,
        "release_date": title.release_date,
        "genres": title.genres,
        "providers": title.providers,
    }


def _serialize_chinampa(chinampa: Chinampa, include_titles: bool = False) -> dict:
    result = {
        "id": chinampa.id,
        "name": chinampa.name,
        "description": chinampa.description,
        "age_range": chinampa.age_range,
        "status": chinampa.status,
        "is_staff_pick": chinampa.is_staff_pick,
        "adoption_count": chinampa.adoption_count,
        "creator_display_name": chinampa.creator.email.split("@")[0] if chinampa.creator else "Anonymous",
        "title_count": len(chinampa.titles) if chinampa.titles else 0,
        "created_at": chinampa.created_at.isoformat() if chinampa.created_at else None,
        "updated_at": chinampa.updated_at.isoformat() if chinampa.updated_at else None,
        "published_at": chinampa.published_at.isoformat() if chinampa.published_at else None,
    }

    if include_titles and chinampa.titles:
        result["titles"] = []
        for ct in chinampa.titles:
            if ct.title:
                title_data = _serialize_title(ct.title)
                title_data["note"] = ct.note
                result["titles"].append(title_data)

    # Poster previews (first 6 titles)
    if chinampa.titles:
        result["poster_previews"] = [
            f"https://image.tmdb.org/t/p/w200{ct.title.poster_path}"
            for ct in chinampa.titles[:6]
            if ct.title and ct.title.poster_path
        ]

    return result


def _auto_flag_check(chinampa: Chinampa, creator: User, db: Session) -> bool:
    """Check if chinampa should be auto-flagged for extra review scrutiny."""
    if chinampa.age_range in ("1-3", "2-4"):
        return True
    if re.search(r'https?://|@.*\.\w', chinampa.description or ""):
        return True
    if creator.created_at and (datetime.utcnow() - creator.created_at).days < 7:
        return True
    return False


# =====================================================================
# IMPORTANT: Fixed-path routes (/mine/*, /admin/*) MUST come before
# parameterized routes (/{chinampa_id}) to avoid FastAPI matching
# "mine" or "admin" as an integer path parameter.
# =====================================================================

# --- My Chinampas (created) ---

@router.get("/mine/planted")
def get_my_chinampas(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_parent),
):
    chinampas = db.query(Chinampa).options(
        joinedload(Chinampa.creator),
        joinedload(Chinampa.titles).joinedload(ChinampaTitle.title),
    ).filter(
        Chinampa.creator_id == current_user.id,
    ).order_by(Chinampa.created_at.desc()).all()

    return {"chinampas": [_serialize_chinampa(c) for c in chinampas]}


# --- My Adopted Chinampas ---

@router.get("/mine/adopted")
def get_adopted_chinampas(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_parent),
):
    adoptions = db.query(ChinampaAdoption).options(
        joinedload(ChinampaAdoption.chinampa).joinedload(Chinampa.creator),
        joinedload(ChinampaAdoption.chinampa).joinedload(Chinampa.titles).joinedload(ChinampaTitle.title),
        joinedload(ChinampaAdoption.child_profile),
    ).filter(
        ChinampaAdoption.adopter_id == current_user.id,
    ).order_by(ChinampaAdoption.adopted_at.desc()).all()

    return {
        "adoptions": [
            {
                "id": a.id,
                "chinampa": _serialize_chinampa(a.chinampa) if a.chinampa else None,
                "child_profile_name": a.child_profile.name if a.child_profile else None,
                "child_profile_id": a.child_profile_id,
                "titles_adopted": a.titles_adopted,
                "adopted_at": a.adopted_at.isoformat() if a.adopted_at else None,
            }
            for a in adoptions
        ]
    }


# --- Get approved titles for creating a chinampa ---

@router.get("/mine/approved-titles")
def get_approved_titles(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_parent),
):
    """Get all titles approved in any of this parent's child profiles."""
    kid_profiles = db.query(KidProfile).filter(KidProfile.parent_id == current_user.id).all()

    title_ids = set()
    for profile in kid_profiles:
        policies = db.query(Policy).filter(
            Policy.kid_profile_id == profile.id,
            Policy.is_allowed == True,
        ).all()
        for p in policies:
            title_ids.add(p.title_id)

    if not title_ids:
        return {"titles": []}

    titles = db.query(Title).filter(Title.id.in_(title_ids)).all()
    return {"titles": [_serialize_title(t) for t in titles]}


# --- Admin: Moderation ---

@router.get("/admin/review-queue")
def admin_review_queue(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    chinampas = db.query(Chinampa).options(
        joinedload(Chinampa.creator),
        joinedload(Chinampa.titles).joinedload(ChinampaTitle.title),
    ).filter(
        Chinampa.status == "in_review",
    ).order_by(Chinampa.created_at.asc()).all()

    result = []
    for c in chinampas:
        data = _serialize_chinampa(c, include_titles=True)
        data["auto_flagged"] = _auto_flag_check(c, c.creator, db)

        # Get pending reports
        reports = db.query(ChinampaReport).filter(
            ChinampaReport.chinampa_id == c.id,
            ChinampaReport.status == "pending",
        ).all()
        data["pending_reports"] = [
            {"id": r.id, "reason": r.reason, "created_at": r.created_at.isoformat() if r.created_at else None}
            for r in reports
        ]
        result.append(data)

    return {"chinampas": result}


@router.post("/admin/{chinampa_id}/approve")
def admin_approve_chinampa(
    chinampa_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    chinampa = db.query(Chinampa).filter(Chinampa.id == chinampa_id).first()
    if not chinampa:
        raise HTTPException(status_code=404, detail="Chinampa not found")

    chinampa.status = "published"
    chinampa.published_at = datetime.utcnow()
    chinampa.rejection_reason = None
    chinampa.report_count = 0

    # Dismiss any pending reports
    db.query(ChinampaReport).filter(
        ChinampaReport.chinampa_id == chinampa_id,
        ChinampaReport.status == "pending",
    ).update({"status": "reviewed"})

    db.commit()
    return {"message": "Chinampa approved and published"}


@router.post("/admin/{chinampa_id}/reject")
def admin_reject_chinampa(
    chinampa_id: int,
    request: RejectRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    chinampa = db.query(Chinampa).filter(Chinampa.id == chinampa_id).first()
    if not chinampa:
        raise HTTPException(status_code=404, detail="Chinampa not found")

    chinampa.status = "rejected"
    chinampa.rejection_reason = request.reason

    db.commit()
    return {"message": "Chinampa rejected"}


@router.post("/admin/{chinampa_id}/staff-pick")
def admin_toggle_staff_pick(
    chinampa_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    chinampa = db.query(Chinampa).filter(Chinampa.id == chinampa_id).first()
    if not chinampa:
        raise HTTPException(status_code=404, detail="Chinampa not found")

    chinampa.is_staff_pick = not chinampa.is_staff_pick
    db.commit()
    return {"is_staff_pick": chinampa.is_staff_pick}


# =====================================================================
# Parameterized routes below — these come AFTER fixed-path routes
# =====================================================================

# --- Browse Published Chinampas ---

@router.get("")
def browse_chinampas(
    age_range: Optional[str] = None,
    sort: str = "popular",
    search: Optional[str] = None,
    staff_picks: bool = False,
    skip: int = 0,
    limit: int = 20,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_parent),
):
    query = db.query(Chinampa).options(
        joinedload(Chinampa.creator),
        joinedload(Chinampa.titles).joinedload(ChinampaTitle.title),
    ).filter(Chinampa.status == "published")

    if age_range and age_range in VALID_AGE_RANGES:
        query = query.filter(Chinampa.age_range == age_range)

    if staff_picks:
        query = query.filter(Chinampa.is_staff_pick == True)

    if search:
        search_term = f"%{search}%"
        query = query.filter(
            or_(
                Chinampa.name.ilike(search_term),
                Chinampa.description.ilike(search_term),
            )
        )

    if sort == "new":
        query = query.order_by(Chinampa.published_at.desc())
    else:
        query = query.order_by(Chinampa.adoption_count.desc(), Chinampa.published_at.desc())

    # Count without joinedload to avoid row multiplication
    from sqlalchemy.orm import lazyload
    total = query.options(lazyload('*')).count()
    chinampas = query.offset(skip).limit(limit).all()

    return {
        "chinampas": [_serialize_chinampa(c) for c in chinampas],
        "total": total,
        "skip": skip,
        "limit": limit,
    }


# --- Chinampa Detail ---

@router.get("/{chinampa_id}")
def get_chinampa(
    chinampa_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_parent),
):
    chinampa = db.query(Chinampa).options(
        joinedload(Chinampa.creator),
        joinedload(Chinampa.titles).joinedload(ChinampaTitle.title),
    ).filter(Chinampa.id == chinampa_id).first()

    if not chinampa:
        raise HTTPException(status_code=404, detail="Chinampa not found")

    # Allow viewing own chinampas regardless of status, others only if published
    if chinampa.creator_id != current_user.id and chinampa.status != "published":
        if not current_user.is_admin:
            raise HTTPException(status_code=404, detail="Chinampa not found")

    return _serialize_chinampa(chinampa, include_titles=True)


# --- Plant (Create) ---

@router.post("")
def create_chinampa(
    request: ChinampaCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_parent),
):
    # Check max chinampas limit
    existing_count = db.query(Chinampa).filter(
        Chinampa.creator_id == current_user.id,
        Chinampa.status.in_(["draft", "in_review", "published"]),
    ).count()

    if existing_count >= MAX_CHINAMPAS_PER_USER:
        raise HTTPException(
            status_code=400,
            detail=f"You can have at most {MAX_CHINAMPAS_PER_USER} active chinampas",
        )

    # Validate title count
    if len(request.title_ids) < TITLES_MIN:
        raise HTTPException(status_code=400, detail=f"A chinampa must have at least {TITLES_MIN} titles")
    if len(request.title_ids) > TITLES_MAX:
        raise HTTPException(status_code=400, detail=f"A chinampa can have at most {TITLES_MAX} titles")

    # Verify titles exist and are in at least one of this parent's child's profiles
    approved_title_ids = set()
    kid_profiles = db.query(KidProfile).filter(KidProfile.parent_id == current_user.id).all()
    for profile in kid_profiles:
        policies = db.query(Policy).filter(
            Policy.kid_profile_id == profile.id,
            Policy.is_allowed == True,
        ).all()
        for p in policies:
            approved_title_ids.add(p.title_id)

    invalid_titles = set(request.title_ids) - approved_title_ids
    if invalid_titles:
        raise HTTPException(
            status_code=400,
            detail=f"Titles must be approved in at least one of your child's profiles. Invalid: {list(invalid_titles)[:5]}",
        )

    chinampa_status = "in_review" if request.publish else "draft"

    chinampa = Chinampa(
        creator_id=current_user.id,
        name=request.name,
        description=request.description,
        age_range=request.age_range,
        status=chinampa_status,
    )
    db.add(chinampa)
    db.flush()

    for title_id in request.title_ids:
        db.add(ChinampaTitle(chinampa_id=chinampa.id, title_id=title_id))

    db.commit()
    db.refresh(chinampa)

    logger.info("Chinampa %d created by user %d (status=%s)", chinampa.id, current_user.id, chinampa_status)

    return {"id": chinampa.id, "status": chinampa.status, "message": "Chinampa created"}


# --- Update ---

@router.put("/{chinampa_id}")
def update_chinampa(
    chinampa_id: int,
    request: ChinampaUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_parent),
):
    chinampa = db.query(Chinampa).filter(
        Chinampa.id == chinampa_id,
        Chinampa.creator_id == current_user.id,
    ).first()

    if not chinampa:
        raise HTTPException(status_code=404, detail="Chinampa not found")

    if request.name is not None:
        chinampa.name = request.name
    if request.description is not None:
        chinampa.description = request.description
    if request.age_range is not None:
        chinampa.age_range = request.age_range

    if request.title_ids is not None:
        if len(request.title_ids) < TITLES_MIN:
            raise HTTPException(status_code=400, detail=f"A chinampa must have at least {TITLES_MIN} titles")
        if len(request.title_ids) > TITLES_MAX:
            raise HTTPException(status_code=400, detail=f"A chinampa can have at most {TITLES_MAX} titles")

        # Verify titles are approved in at least one child profile
        approved_title_ids = set()
        kid_profiles = db.query(KidProfile).filter(KidProfile.parent_id == current_user.id).all()
        for profile in kid_profiles:
            policies = db.query(Policy).filter(
                Policy.kid_profile_id == profile.id,
                Policy.is_allowed == True,
            ).all()
            for p in policies:
                approved_title_ids.add(p.title_id)

        invalid_titles = set(request.title_ids) - approved_title_ids
        if invalid_titles:
            raise HTTPException(
                status_code=400,
                detail=f"Titles must be approved in at least one of your child's profiles. Invalid: {list(invalid_titles)[:5]}",
            )

        # Delete existing and re-add
        db.query(ChinampaTitle).filter(ChinampaTitle.chinampa_id == chinampa_id).delete()
        for title_id in request.title_ids:
            db.add(ChinampaTitle(chinampa_id=chinampa_id, title_id=title_id))

    # If was published, re-enter review
    if chinampa.status == "published":
        chinampa.status = "in_review"

    db.commit()
    return {"id": chinampa.id, "status": chinampa.status, "message": "Chinampa updated"}


# --- Delete ---

@router.delete("/{chinampa_id}")
def delete_chinampa(
    chinampa_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_parent),
):
    chinampa = db.query(Chinampa).filter(
        Chinampa.id == chinampa_id,
        Chinampa.creator_id == current_user.id,
    ).first()

    if not chinampa:
        raise HTTPException(status_code=404, detail="Chinampa not found")

    db.delete(chinampa)
    db.commit()
    return {"message": "Chinampa deleted"}


# --- Adopt ---

@router.post("/{chinampa_id}/adopt")
def adopt_chinampa(
    chinampa_id: int,
    request: AdoptRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_parent),
):
    chinampa = db.query(Chinampa).options(
        joinedload(Chinampa.titles),
    ).filter(
        Chinampa.id == chinampa_id,
        Chinampa.status == "published",
    ).first()

    if not chinampa:
        raise HTTPException(status_code=404, detail="Chinampa not found")

    # Verify child profile belongs to this parent
    profile = db.query(KidProfile).filter(
        KidProfile.id == request.child_profile_id,
        KidProfile.parent_id == current_user.id,
    ).first()

    if not profile:
        raise HTTPException(status_code=400, detail="Child profile not found or not yours")

    # Get existing policies for this child to avoid duplicates
    existing_title_ids = {
        p.title_id for p in db.query(Policy).filter(
            Policy.kid_profile_id == request.child_profile_id,
            Policy.is_allowed == True,
        ).all()
    }

    excluded = set(request.excluded_title_ids)
    titles_adopted = 0

    for ct in chinampa.titles:
        if ct.title_id in excluded:
            continue
        if ct.title_id in existing_title_ids:
            continue

        db.add(Policy(
            kid_profile_id=request.child_profile_id,
            title_id=ct.title_id,
            is_allowed=True,
        ))
        titles_adopted += 1

    # Record adoption
    existing_adoption = db.query(ChinampaAdoption).filter(
        ChinampaAdoption.chinampa_id == chinampa_id,
        ChinampaAdoption.adopter_id == current_user.id,
        ChinampaAdoption.child_profile_id == request.child_profile_id,
    ).first()

    if existing_adoption:
        existing_adoption.titles_adopted += titles_adopted
        existing_adoption.adopted_at = datetime.utcnow()
    else:
        # Check for previous adoptions by this user (different child profiles) BEFORE adding
        has_previous = db.query(ChinampaAdoption).filter(
            ChinampaAdoption.chinampa_id == chinampa_id,
            ChinampaAdoption.adopter_id == current_user.id,
        ).first()

        db.add(ChinampaAdoption(
            chinampa_id=chinampa_id,
            adopter_id=current_user.id,
            child_profile_id=request.child_profile_id,
            titles_adopted=titles_adopted,
        ))

        # Increment adoption_count only for first adoption by this user
        if not has_previous:
            chinampa.adoption_count += 1

    db.commit()

    return {
        "message": "Chinampa adopted",
        "titles_adopted": titles_adopted,
        "chinampa_name": chinampa.name,
    }


# --- Report ---

@router.post("/{chinampa_id}/report")
def report_chinampa(
    chinampa_id: int,
    request: ReportRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_parent),
):
    chinampa = db.query(Chinampa).filter(
        Chinampa.id == chinampa_id,
        Chinampa.status == "published",
    ).first()

    if not chinampa:
        raise HTTPException(status_code=404, detail="Chinampa not found")

    # Check for duplicate report
    existing = db.query(ChinampaReport).filter(
        ChinampaReport.chinampa_id == chinampa_id,
        ChinampaReport.reporter_id == current_user.id,
        ChinampaReport.status == "pending",
    ).first()

    if existing:
        raise HTTPException(status_code=400, detail="You already reported this chinampa")

    db.add(ChinampaReport(
        chinampa_id=chinampa_id,
        reporter_id=current_user.id,
        reason=request.reason,
    ))

    chinampa.report_count += 1

    # Auto-unpublish at 3 reports
    if chinampa.report_count >= 3:
        chinampa.status = "in_review"
        logger.warning("Chinampa %d auto-unpublished after %d reports", chinampa_id, chinampa.report_count)

    db.commit()
    return {"message": "Report submitted"}
