from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from sqlalchemy.orm import Session
from typing import Optional
from db import get_db
from models import User, KidProfile
from config import settings

security = HTTPBearer()

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> tuple[Optional[User], Optional[KidProfile], str, dict]:
    try:
        token = credentials.credentials
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
        user_id: str = payload.get("sub")
        role: str = payload.get("role")
        
        if user_id is None or role is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication credentials"
            )
        
        if role == "parent":
            user = db.query(User).filter(User.id == int(user_id)).first()
            if not user:
                raise HTTPException(status_code=404, detail="User not found")
            return user, None, role, payload
        elif role == "kid":
            profile = db.query(KidProfile).filter(KidProfile.id == int(user_id)).first()
            if not profile:
                raise HTTPException(status_code=404, detail="Profile not found")
            return None, profile, role, payload
        else:
            raise HTTPException(status_code=401, detail="Invalid role")
            
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials"
        )

def require_parent(
    auth_data: tuple = Depends(get_current_user)
) -> User:
    user, profile, role, payload = auth_data
    if role != "parent" or not user:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Parent access required"
        )
    return user

def require_kid(
    auth_data: tuple = Depends(get_current_user)
) -> KidProfile:
    user, profile, role, payload = auth_data
    if role != "kid" or not profile:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Kid access required"
        )
    return profile

def require_admin(
    auth_data: tuple = Depends(get_current_user)
) -> User:
    user, profile, role, payload = auth_data
    if role != "parent" or not user:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    # Verify BOTH the JWT token claim AND the database flag
    token_is_admin = payload.get("is_admin", False)
    if not token_is_admin or not user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin privileges required"
        )
    return user
