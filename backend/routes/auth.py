from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
import bcrypt
from jose import JWTError, jwt
from datetime import datetime, timedelta
from typing import Optional
from db import get_db
from models import User, KidProfile, PairingCode, Device, Policy
import secrets
from config import settings
from auth_utils import require_parent, require_admin

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

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)
    return encoded_jwt

@router.post("/parent/signup", response_model=TokenResponse)
def parent_signup(request: ParentSignupRequest, db: Session = Depends(get_db)):
    existing_user = db.query(User).filter(User.email == request.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
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
        raise HTTPException(status_code=401, detail="Profile not found")
    
    access_token = create_access_token({"sub": str(profile.id), "role": "kid"})
    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        profile_id=profile.id,
        role="kid"
    )

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
def get_all_kid_profiles(db: Session = Depends(get_db)):
    profiles = db.query(KidProfile).all()
    return [{"id": p.id, "name": p.name, "age": p.age} for p in profiles]

@router.get("/admin/parents")
def get_all_parents(
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Admin endpoint to view all parent accounts"""
    parents = db.query(User).all()
    
    result = []
    for parent in parents:
        kid_profiles = db.query(KidProfile).filter(KidProfile.parent_id == parent.id).all()
        devices = db.query(Device).join(KidProfile).filter(KidProfile.parent_id == parent.id).all()
        
        result.append({
            "id": parent.id,
            "email": parent.email,
            "created_at": parent.created_at,
            "kid_profiles_count": len(kid_profiles),
            "devices_count": len(devices),
            "kid_profiles": [{"id": k.id, "name": k.name, "age": k.age} for k in kid_profiles]
        })
    
    return result

@router.get("/admin/kid-profiles")
def get_all_kid_profiles_admin(
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Admin endpoint to view all kid profiles with parent info"""
    profiles = db.query(KidProfile).all()
    
    result = []
    for profile in profiles:
        parent = db.query(User).filter(User.id == profile.parent_id).first()
        policies = db.query(Policy).filter(Policy.kid_profile_id == profile.id).all()
        devices = db.query(Device).filter(Device.kid_profile_id == profile.id).all()
        
        result.append({
            "id": profile.id,
            "name": profile.name,
            "age": profile.age,
            "parent_email": parent.email if parent else None,
            "parent_id": profile.parent_id,
            "policies_count": len(policies),
            "devices_count": len(devices),
            "created_at": profile.created_at
        })
    
    return result
