from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List
from db import get_db
from models import Policy, Title, KidProfile

router = APIRouter(prefix="/policy", tags=["policy"])

class PolicyCreateRequest(BaseModel):
    kid_profile_id: int
    title_id: int
    is_allowed: bool

class PolicyUpdateRequest(BaseModel):
    is_allowed: bool

@router.post("/")
def create_policy(request: PolicyCreateRequest, db: Session = Depends(get_db)):
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
def get_profile_policies(kid_profile_id: int, db: Session = Depends(get_db)):
    profile = db.query(KidProfile).filter(KidProfile.id == kid_profile_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    policies = db.query(Policy).filter(Policy.kid_profile_id == kid_profile_id).all()
    
    result = []
    for policy in policies:
        title = db.query(Title).filter(Title.id == policy.title_id).first()
        if title:
            result.append({
                "policy_id": policy.id,
                "title_id": title.id,
                "title": title.title,
                "media_type": title.media_type,
                "poster_path": f"https://image.tmdb.org/t/p/w500{title.poster_path}" if title.poster_path else None,
                "is_allowed": policy.is_allowed
            })
    
    return {"kid_profile_id": kid_profile_id, "policies": result}

@router.put("/{policy_id}")
def update_policy(policy_id: int, request: PolicyUpdateRequest, db: Session = Depends(get_db)):
    policy = db.query(Policy).filter(Policy.id == policy_id).first()
    if not policy:
        raise HTTPException(status_code=404, detail="Policy not found")
    
    policy.is_allowed = request.is_allowed
    db.commit()
    return {"message": "Policy updated"}

@router.delete("/{policy_id}")
def delete_policy(policy_id: int, db: Session = Depends(get_db)):
    policy = db.query(Policy).filter(Policy.id == policy_id).first()
    if not policy:
        raise HTTPException(status_code=404, detail="Policy not found")
    
    db.delete(policy)
    db.commit()
    return {"message": "Policy deleted"}

@router.get("/allowed/{kid_profile_id}")
def get_allowed_titles(kid_profile_id: int, db: Session = Depends(get_db)):
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
                "rating": title.rating
            })
    
    return {"allowed_titles": titles}
