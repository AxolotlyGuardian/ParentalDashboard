from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from pydantic import BaseModel, EmailStr, field_validator
import bcrypt
from jose import JWTError, jwt
from datetime import datetime, timedelta
from typing import Optional
from db import get_db
from models import User, KidProfile, PairingCode, Device, Policy, RevokedToken
import secrets
import uuid
from config import settings
from auth_utils import get_current_user, require_parent, require_admin

router = APIRouter(prefix="/auth", tags=["auth"])

class ParentSignupRequest(BaseModel):
    email: EmailStr
    password: str

class ParentLoginRequest(BaseModel):
    email: EmailStr
    password: str

class KidLoginRequest(BaseModel):
    profile_id: int
    pin: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user_id: Optional[int] = None
    profile_id: Optional[int] = None
    role: str

class KidProfileCreateRequest(BaseModel):
    parent_id: int
    name: str
    age: int
    pin: str

    @field_validator('pin')
    @classmethod
    def pin_must_be_valid(cls, v):
        if len(v) < 4:
            raise ValueError('PIN must be at least 4 characters')
        return v

class KidProfileUpdateRequest(BaseModel):
    name: Optional[str] = None
    age: Optional[int] = None
    pin: Optional[str] = None

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire, "jti": str(uuid.uuid4())})
    encoded_jwt = jwt.encode(to_encode, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)
    return encoded_jwt

@router.post("/parent/signup", response_model=TokenResponse)
def parent_signup(request: ParentSignupRequest, db: Session = Depends(get_db)):
    existing_user = db.query(User).filter(User.email == request.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    if len(request.password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters")

    hashed_password = bcrypt.hashpw(request.password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    new_user = User(email=request.email, password_hash=hashed_password)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    access_token = create_access_token({"sub": str(new_user.id), "role": "parent", "is_admin": new_user.is_admin})
    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user_id=new_user.id,
        role="parent"
    )

@router.post("/parent/login", response_model=TokenResponse)
def parent_login(request: ParentLoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == request.email).first()
    if not user or not user.password_hash:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    try:
        password_valid = bcrypt.checkpw(request.password.encode('utf-8'), user.password_hash.encode('utf-8'))
    except (ValueError, TypeError):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if not password_valid:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    access_token = create_access_token({"sub": str(user.id), "role": "parent", "is_admin": user.is_admin})
    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user_id=user.id,
        role="parent"
    )

@router.post("/kid/login", response_model=TokenResponse)
def kid_login(request: KidLoginRequest, db: Session = Depends(get_db)):
    profile = db.query(KidProfile).filter(KidProfile.id == request.profile_id).first()
    if not profile:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    try:
        pin_valid = bcrypt.checkpw(request.pin.encode('utf-8'), profile.pin.encode('utf-8'))
    except (ValueError, TypeError):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    if not pin_valid:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    access_token = create_access_token({"sub": str(profile.id), "role": "kid"})
    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        profile_id=profile.id,
        role="kid"
    )

@router.post("/logout")
def logout(
    auth_data: tuple = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Revoke the current access token so it cannot be reused."""
    user, profile, role, payload = auth_data
    jti = payload.get("jti")
    if jti:
        exp = payload.get("exp")
        expires_at = datetime.utcfromtimestamp(exp) if exp else datetime.utcnow()
        revoked = RevokedToken(jti=jti, expires_at=expires_at)
        db.add(revoked)
        db.commit()
    return {"message": "Logged out successfully"}


@router.post("/kid/profile")
def create_kid_profile(
    request: KidProfileCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_parent)
):
    if current_user.id != request.parent_id:
        raise HTTPException(status_code=403, detail="Can only create profiles for yourself")
    
    hashed_pin = bcrypt.hashpw(request.pin.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    new_profile = KidProfile(
        parent_id=request.parent_id,
        name=request.name,
        age=request.age,
        pin=hashed_pin
    )
    db.add(new_profile)
    db.commit()
    db.refresh(new_profile)
    return {"id": new_profile.id, "name": new_profile.name, "age": new_profile.age}

@router.get("/kid/profiles/{parent_id}")
def get_kid_profiles(
    parent_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_parent)
):
    if current_user.id != parent_id:
        raise HTTPException(status_code=403, detail="Can only view your own profiles")
    
    profiles = db.query(KidProfile).filter(KidProfile.parent_id == parent_id).all()
    return [{"id": p.id, "name": p.name, "age": p.age} for p in profiles]

@router.get("/kid/profiles")
def get_all_kid_profiles(
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Admin-only endpoint to view all kid profiles"""
    profiles = db.query(KidProfile).all()
    return [{"id": p.id, "name": p.name, "age": p.age} for p in profiles]

@router.get("/admin/parents")
def get_all_parents(
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Admin endpoint to view all parent accounts"""
    # Get all parents with kid profile counts and device counts in one query
    kid_count_sub = (
        db.query(KidProfile.parent_id, func.count(KidProfile.id).label("kid_count"))
        .group_by(KidProfile.parent_id)
        .subquery()
    )
    device_count_sub = (
        db.query(KidProfile.parent_id, func.count(Device.id).label("device_count"))
        .join(Device, Device.kid_profile_id == KidProfile.id)
        .group_by(KidProfile.parent_id)
        .subquery()
    )
    rows = (
        db.query(User, kid_count_sub.c.kid_count, device_count_sub.c.device_count)
        .outerjoin(kid_count_sub, User.id == kid_count_sub.c.parent_id)
        .outerjoin(device_count_sub, User.id == device_count_sub.c.parent_id)
        .all()
    )

    # Batch-load kid profiles for all parents
    parent_ids = [row[0].id for row in rows]
    all_kids = db.query(KidProfile).filter(KidProfile.parent_id.in_(parent_ids)).all() if parent_ids else []
    kids_by_parent = {}
    for k in all_kids:
        kids_by_parent.setdefault(k.parent_id, []).append(k)

    result = []
    for parent, kid_count, device_count in rows:
        kids = kids_by_parent.get(parent.id, [])
        result.append({
            "id": parent.id,
            "email": parent.email,
            "created_at": parent.created_at,
            "kid_profiles_count": kid_count or 0,
            "devices_count": device_count or 0,
            "kid_profiles": [{"id": k.id, "name": k.name, "age": k.age} for k in kids]
        })

    return result

@router.put("/kid/profile/{profile_id}")
def update_kid_profile(
    profile_id: int,
    request: KidProfileUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_parent)
):
    """Update a kid profile's name, age, or PIN"""
    profile = db.query(KidProfile).filter(
        KidProfile.id == profile_id,
        KidProfile.parent_id == current_user.id
    ).first()

    if not profile:
        raise HTTPException(status_code=404, detail="Kid profile not found")

    if request.name is not None:
        profile.name = request.name
    if request.age is not None:
        if request.age < 1 or request.age > 17:
            raise HTTPException(status_code=400, detail="Age must be between 1 and 17")
        profile.age = request.age
    if request.pin is not None:
        if len(request.pin) < 4:
            raise HTTPException(status_code=400, detail="PIN must be at least 4 characters")
        profile.pin = bcrypt.hashpw(request.pin.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

    db.commit()
    db.refresh(profile)
    return {"id": profile.id, "name": profile.name, "age": profile.age}

@router.delete("/kid/profile/{profile_id}")
def delete_kid_profile(
    profile_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_parent)
):
    """Delete a kid profile and its associated policies and device links"""
    profile = db.query(KidProfile).filter(
        KidProfile.id == profile_id,
        KidProfile.parent_id == current_user.id
    ).first()

    if not profile:
        raise HTTPException(status_code=404, detail="Kid profile not found")

    # Unlink devices from this profile (don't delete devices, just unassign)
    db.query(Device).filter(Device.kid_profile_id == profile_id).update(
        {"kid_profile_id": None}
    )

    # Delete associated policies
    db.query(Policy).filter(Policy.kid_profile_id == profile_id).delete()

    db.delete(profile)
    db.commit()

    return {"success": True, "message": f"Profile '{profile.name}' deleted"}

@router.get("/admin/kid-profiles")
def get_all_kid_profiles_admin(
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Admin endpoint to view all kid profiles with parent info"""
    policy_count_sub = (
        db.query(Policy.kid_profile_id, func.count(Policy.id).label("policy_count"))
        .group_by(Policy.kid_profile_id)
        .subquery()
    )
    device_count_sub = (
        db.query(Device.kid_profile_id, func.count(Device.id).label("device_count"))
        .group_by(Device.kid_profile_id)
        .subquery()
    )

    rows = (
        db.query(KidProfile, User.email, policy_count_sub.c.policy_count, device_count_sub.c.device_count)
        .join(User, KidProfile.parent_id == User.id)
        .outerjoin(policy_count_sub, KidProfile.id == policy_count_sub.c.kid_profile_id)
        .outerjoin(device_count_sub, KidProfile.id == device_count_sub.c.kid_profile_id)
        .all()
    )

    return [
        {
            "id": profile.id,
            "name": profile.name,
            "age": profile.age,
            "parent_email": parent_email,
            "parent_id": profile.parent_id,
            "policies_count": policy_count or 0,
            "devices_count": device_count or 0,
            "created_at": profile.created_at
        }
        for profile, parent_email, policy_count, device_count in rows
    ]
