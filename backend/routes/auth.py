from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from passlib.context import CryptContext
from jose import JWTError, jwt
from datetime import datetime, timedelta
from typing import Optional
from db import get_db
from models import User, KidProfile
from config import settings
from auth_utils import require_parent

router = APIRouter(prefix="/auth", tags=["auth"])
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

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
    
    hashed_password = pwd_context.hash(request.password)
    new_user = User(email=request.email, password_hash=hashed_password)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    access_token = create_access_token({"sub": str(new_user.id), "role": "parent"})
    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user_id=new_user.id,
        role="parent"
    )

@router.post("/parent/login", response_model=TokenResponse)
def parent_login(request: ParentLoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == request.email).first()
    if not user or not pwd_context.verify(request.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    access_token = create_access_token({"sub": str(user.id), "role": "parent"})
    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user_id=user.id,
        role="parent"
    )

@router.post("/kid/login", response_model=TokenResponse)
def kid_login(request: KidLoginRequest, db: Session = Depends(get_db)):
    profile = db.query(KidProfile).filter(KidProfile.id == request.profile_id).first()
    if not profile or not pwd_context.verify(request.pin, profile.pin):
        raise HTTPException(status_code=401, detail="Invalid PIN")
    
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
    
    hashed_pin = pwd_context.hash(request.pin)
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
