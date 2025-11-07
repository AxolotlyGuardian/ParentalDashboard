from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List
from db import get_db
from models import Policy, Title, KidProfile, User
from auth_utils import require_parent
import sys
import os
sys.path.append(os.path.dirname(__file__))
from catalog import fetch_and_update_providers, normalize_providers

router = APIRouter(prefix="/policy", tags=["policy"])

class PolicyCreateRequest(BaseModel):
    kid_profile_id: int
    title_id: int
    is_allowed: bool
    title: str = None
    media_type: str = None
    poster_path: str = None
    rating: str = None

class PolicyUpdateRequest(BaseModel):
    is_allowed: bool

@router.post("")
def create_policy(
    request: PolicyCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_parent)
):
    profile = db.query(KidProfile).filter(KidProfile.id == request.kid_profile_id).first()
    if not profile or profile.parent_id != current_user.id:
        raise HTTPException(status_code=403, detail="Can only manage your own kid's policies")
    
    title = db.query(Title).filter(Title.id == request.title_id).first()
    if not title:
        if not request.title:
            raise HTTPException(status_code=400, detail="Title data required for new titles")
        new_title = Title(
            id=request.title_id,
            title=request.title,
            media_type=request.media_type or "movie",
            poster_path=request.poster_path,
            rating=request.rating or "NR"
        )
        db.add(new_title)
        db.commit()
    
    existing_policy = db.query(Policy).filter(
        Policy.kid_profile_id == request.kid_profile_id,
        Policy.title_id == request.title_id
    ).first()
    
    if existing_policy:
        existing_policy.is_allowed = request.is_allowed
        db.commit()
        db.refresh(existing_policy)
        return {"id": existing_policy.id, "message": "Policy updated"}
    
    new_policy = Policy(
        kid_profile_id=request.kid_profile_id,
        title_id=request.title_id,
        is_allowed=request.is_allowed
    )
    db.add(new_policy)
    db.commit()
    db.refresh(new_policy)
    return {"id": new_policy.id, "message": "Policy created"}

@router.get("/profile/{kid_profile_id}")
async def get_profile_policies(
    kid_profile_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_parent)
):
    profile = db.query(KidProfile).filter(KidProfile.id == kid_profile_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    if profile.parent_id != current_user.id:
        raise HTTPException(status_code=403, detail="Can only view your own kid's policies")
    
    policies = db.query(Policy).filter(Policy.kid_profile_id == kid_profile_id).all()
    
    result = []
    for policy in policies:
        title = db.query(Title).filter(Title.id == policy.title_id).first()
        if title:
            # Normalize existing provider data to canonical format
            if title.providers:
                normalized = normalize_providers(title.providers)
                if normalized != title.providers:
                    title.providers = normalized
                    db.commit()
                    db.refresh(title)
            
            # Fetch provider info if missing and title has tmdb_id
            if (not title.providers or len(title.providers) == 0) and hasattr(title, 'tmdb_id') and title.tmdb_id:
                await fetch_and_update_providers(title, db)
                db.refresh(title)
            
            result.append({
                "policy_id": policy.id,
                "title_id": title.id,
                "title": title.title,
                "media_type": title.media_type,
                "poster_path": f"https://image.tmdb.org/t/p/w500{title.poster_path}" if title.poster_path else None,
                "is_allowed": policy.is_allowed,
                "providers": title.providers or []
            })
    
    return {"kid_profile_id": kid_profile_id, "policies": result}

@router.put("/{policy_id}")
def update_policy(
    policy_id: int,
    request: PolicyUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_parent)
):
    policy = db.query(Policy).filter(Policy.id == policy_id).first()
    if not policy:
        raise HTTPException(status_code=404, detail="Policy not found")
    
    profile = db.query(KidProfile).filter(KidProfile.id == policy.kid_profile_id).first()
    if not profile or profile.parent_id != current_user.id:
        raise HTTPException(status_code=403, detail="Can only update your own kid's policies")
    
    policy.is_allowed = request.is_allowed
    db.commit()
    return {"message": "Policy updated"}

@router.delete("/{policy_id}")
def delete_policy(
    policy_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_parent)
):
    policy = db.query(Policy).filter(Policy.id == policy_id).first()
    if not policy:
        raise HTTPException(status_code=404, detail="Policy not found")
    
    profile = db.query(KidProfile).filter(KidProfile.id == policy.kid_profile_id).first()
    if not profile or profile.parent_id != current_user.id:
        raise HTTPException(status_code=403, detail="Can only delete your own kid's policies")
    
    db.delete(policy)
    db.commit()
    return {"message": "Policy deleted"}

@router.get("/allowed/{kid_profile_id}")
def get_allowed_titles(
    kid_profile_id: int,
    db: Session = Depends(get_db)
):
    profile = db.query(KidProfile).filter(KidProfile.id == kid_profile_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    allowed_policies = db.query(Policy).filter(
        Policy.kid_profile_id == kid_profile_id,
        Policy.is_allowed == True
    ).all()
    
    titles = []
    for policy in allowed_policies:
        title = db.query(Title).filter(Title.id == policy.title_id).first()
        if title:
            titles.append({
                "id": title.id,
                "title": title.title,
                "media_type": title.media_type,
                "poster_path": f"https://image.tmdb.org/t/p/w500{title.poster_path}" if title.poster_path else None,
                "overview": title.overview,
                "rating": title.rating,
                "providers": title.providers or [],
                "deep_links": title.deep_links or {}
            })
    
    return {"allowed_titles": titles}
