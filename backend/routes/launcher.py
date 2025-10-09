from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import Optional
import secrets
import random
from db import get_db
from models import Device, PairingCode, App, FamilyApp, TimeLimit, UsageLog, User, KidProfile, Policy, Title
from auth_utils import require_parent

router = APIRouter()

def get_device_from_headers(
    x_device_id: Optional[str] = Header(None),
    x_api_key: Optional[str] = Header(None),
    db: Session = Depends(get_db)
):
    if not x_device_id or not x_api_key:
        raise HTTPException(status_code=401, detail="Missing device authentication headers")
    
    device = db.query(Device).filter(
        Device.device_id == x_device_id,
        Device.api_key == x_api_key
    ).first()
    
    if not device:
        raise HTTPException(status_code=401, detail="Invalid device credentials")
    
    db.query(Device).filter(Device.id == device.id).update({"last_active": datetime.utcnow()})
    db.commit()
    
    return device

@router.post("/pair")
async def pair_device(
    request: dict,
    db: Session = Depends(get_db)
):
    pairing_code = request.get("pairingCode")
    
    if not pairing_code or len(pairing_code) != 6:
        raise HTTPException(status_code=400, detail="Invalid pairing code format")
    
    code_entry = db.query(PairingCode).filter(
        PairingCode.code == pairing_code,
        PairingCode.is_used == False,
        PairingCode.expires_at > datetime.utcnow()
    ).first()
    
    if not code_entry:
        raise HTTPException(status_code=404, detail="Invalid or expired pairing code")
    
    device_id = secrets.token_urlsafe(32)
    api_key = secrets.token_urlsafe(48)
    
    device = Device(
        device_id=device_id,
        api_key=api_key,
        family_id=code_entry.family_id
    )
    db.add(device)
    
    db.query(PairingCode).filter(PairingCode.id == code_entry.id).update({"is_used": True})
    db.commit()
    db.refresh(device)
    
    family = db.query(User).filter(User.id == code_entry.family_id).first()
    family_name = family.email.split('@')[0] if family else "Family"
    
    return {
        "deviceId": device_id,
        "apiKey": api_key,
        "familyName": family_name.title()
    }

@router.get("/apps")
async def get_apps(
    device: Device = Depends(get_device_from_headers),
    db: Session = Depends(get_db)
):
    kid_profiles = db.query(KidProfile).filter(
        KidProfile.parent_id == device.family_id
    ).all()
    
    if not kid_profiles:
        return []
    
    allowed_titles = []
    seen_title_ids = set()
    
    for profile in kid_profiles:
        policies = db.query(Policy, Title).join(
            Title, Policy.title_id == Title.id
        ).filter(
            Policy.kid_profile_id == profile.id,
            Policy.is_allowed == True
        ).all()
        
        for policy, title in policies:
            if title.id not in seen_title_ids:
                seen_title_ids.add(title.id)
                
                poster_url = f"https://image.tmdb.org/t/p/w500{title.poster_path}" if title.poster_path else ""
                backdrop_url = f"https://image.tmdb.org/t/p/w780{title.backdrop_path}" if title.backdrop_path else ""
                
                primary_link = ""
                if title.deep_links and isinstance(title.deep_links, dict):
                    for provider_id, link in title.deep_links.items():
                        if link:
                            primary_link = link
                            break
                
                allowed_titles.append({
                    "id": str(title.id),
                    "appName": title.title,
                    "packageName": primary_link or f"tmdb.{title.media_type}.{title.tmdb_id}",
                    "iconUrl": poster_url,
                    "coverArt": backdrop_url,
                    "isEnabled": True,
                    "ageRating": title.rating or "All",
                    "category": title.media_type.upper() if title.media_type else "Content"
                })
    
    return allowed_titles

@router.get("/time-limits")
async def get_time_limits(
    device: Device = Depends(get_device_from_headers),
    db: Session = Depends(get_db)
):
    time_limit = db.query(TimeLimit).filter(
        TimeLimit.family_id == device.family_id
    ).first()
    
    if not time_limit:
        return {
            "dailyLimitMinutes": None,
            "bedtimeStart": None,
            "bedtimeEnd": None,
            "scheduleEnabled": False
        }
    
    return {
        "dailyLimitMinutes": time_limit.daily_limit_minutes,
        "bedtimeStart": time_limit.bedtime_start,
        "bedtimeEnd": time_limit.bedtime_end,
        "scheduleEnabled": time_limit.schedule_enabled
    }

@router.get("/stats")
async def get_stats(
    device: Device = Depends(get_device_from_headers),
    db: Session = Depends(get_db)
):
    kid_profiles = db.query(KidProfile).filter(
        KidProfile.parent_id == device.family_id
    ).all()
    
    allowed_title_ids = set()
    for profile in kid_profiles:
        policies = db.query(Policy).filter(
            Policy.kid_profile_id == profile.id,
            Policy.is_allowed == True
        ).all()
        for policy in policies:
            allowed_title_ids.add(policy.title_id)
    
    total_apps = len(allowed_title_ids)
    
    today = datetime.utcnow().date()
    today_start = datetime.combine(today, datetime.min.time())
    
    usage_today = db.query(UsageLog).filter(
        UsageLog.device_id == device.id,
        UsageLog.start_time >= today_start
    ).all()
    
    time_used_today = sum(log.duration_minutes for log in usage_today)
    
    time_limit = db.query(TimeLimit).filter(
        TimeLimit.family_id == device.family_id
    ).first()
    
    time_remaining = None
    if time_limit and time_limit.daily_limit_minutes is not None:
        time_remaining = max(0, int(time_limit.daily_limit_minutes) - time_used_today)
    
    app_usage = {}
    for log in usage_today:
        if log.app_name not in app_usage:
            app_usage[log.app_name] = 0
        app_usage[log.app_name] += log.duration_minutes
    
    most_used_app = max(app_usage.items(), key=lambda x: x[1])[0] if app_usage else None
    
    return {
        "totalAppsEnabled": total_apps,
        "timeUsedToday": time_used_today,
        "timeRemainingToday": time_remaining,
        "mostUsedApp": most_used_app
    }

@router.post("/usage-logs")
async def log_usage(
    request: dict,
    device: Device = Depends(get_device_from_headers),
    db: Session = Depends(get_db)
):
    app_id = request.get("appId")
    app_name = request.get("appName")
    start_time = request.get("startTime")
    end_time = request.get("endTime")
    duration_minutes = request.get("durationMinutes")
    
    if not all([app_name, start_time, end_time, duration_minutes]):
        raise HTTPException(status_code=400, detail="Missing required fields")
    
    try:
        start_dt = datetime.fromisoformat(str(start_time).replace('Z', '+00:00'))
        end_dt = datetime.fromisoformat(str(end_time).replace('Z', '+00:00'))
    except:
        raise HTTPException(status_code=400, detail="Invalid datetime format")
    
    app_id_int = None
    if app_id:
        try:
            app_id_int = int(app_id)
            app_exists = db.query(FamilyApp).join(App).filter(
                FamilyApp.family_id == device.family_id,
                FamilyApp.app_id == app_id_int
            ).first()
            
            if not app_exists:
                app_id_int = None
        except:
            app_id_int = None
    
    usage_log = UsageLog(
        device_id=device.id,
        app_id=app_id_int,
        app_name=app_name,
        start_time=start_dt,
        end_time=end_dt,
        duration_minutes=duration_minutes
    )
    
    db.add(usage_log)
    db.commit()
    
    return {"success": True}

@router.post("/pairing-code/generate")
async def generate_pairing_code(
    current_user: User = Depends(require_parent),
    db: Session = Depends(get_db)
):
    code = ''.join([str(random.randint(0, 9)) for _ in range(6)])
    
    while db.query(PairingCode).filter(PairingCode.code == code, PairingCode.is_used == False).first():
        code = ''.join([str(random.randint(0, 9)) for _ in range(6)])
    
    pairing_code = PairingCode(
        code=code,
        family_id=current_user.id,
        expires_at=datetime.utcnow() + timedelta(hours=24)
    )
    
    db.add(pairing_code)
    db.commit()
    db.refresh(pairing_code)
    
    return {"code": code, "expires_at": pairing_code.expires_at}
