from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import Optional
import secrets
import random
import hashlib
import hmac
from db import get_db
from models import Device, PairingCode, PendingDevice, App, FamilyApp, TimeLimit, UsageLog, User, KidProfile, Policy, Title, DeviceEpisodeReport, Episode, EpisodeLink
from auth_utils import require_parent, require_admin
from services.movie_api import movie_api_client
import json


def hash_api_key(api_key: str) -> str:
    """Hash an API key for secure storage using SHA-256."""
    return hashlib.sha256(api_key.encode('utf-8')).hexdigest()


def verify_api_key(provided_key: str, stored_hash: str) -> bool:
    """Verify an API key against its stored hash using constant-time comparison."""
    return hmac.compare_digest(
        hashlib.sha256(provided_key.encode('utf-8')).hexdigest(),
        stored_hash
    )


router = APIRouter()

@router.post("/pairing/initiate")
async def initiate_pairing(
    request: dict,
    db: Session = Depends(get_db)
):
    """Device initiates pairing by sending device_id and pairing_code"""
    device_id = request.get("device_id")
    pairing_code = request.get("pairing_code")
    
    if not device_id or not pairing_code:
        raise HTTPException(status_code=400, detail="device_id and pairing_code required")
    
    if len(pairing_code) != 6 or not pairing_code.isdigit():
        raise HTTPException(status_code=400, detail="pairing_code must be 6 digits")
    
    # Allow existing devices to re-pair (they may have lost credentials)
    # The device will be updated with new credentials when pairing is confirmed
    
    # Check if this device already has a pending pairing (allow retries)
    existing_pending = db.query(PendingDevice).filter(
        PendingDevice.device_id == device_id
    ).first()
    
    # Check if pairing code is already in use by a different device
    code_in_use = db.query(PendingDevice).filter(
        PendingDevice.pairing_code == pairing_code,
        PendingDevice.device_id != device_id
    ).first()
    if code_in_use:
        raise HTTPException(status_code=409, detail="Pairing code already in use")
    
    # Create or update pending device entry with 15 minute expiration
    expires_at = datetime.utcnow() + timedelta(minutes=15)
    
    if existing_pending:
        # Update existing pending entry (allow retry)
        existing_pending.pairing_code = pairing_code
        existing_pending.expires_at = expires_at
    else:
        # Create new pending device entry
        pending_device = PendingDevice(
            device_id=device_id,
            pairing_code=pairing_code,
            expires_at=expires_at
        )
        db.add(pending_device)
    
    db.commit()
    
    return {"status": "pending_confirmation"}

@router.get("/pairing/status/{device_id}")
async def check_pairing_status(
    device_id: str,
    db: Session = Depends(get_db)
):
    """Device polls this endpoint to check if pairing is complete"""
    # Check if device has been paired (moved from pending to devices table)
    device = db.query(Device).filter(Device.device_id == device_id).first()
    
    if device:
        # Check if there's a one-time key delivery pending for this device
        # The api_key_plaintext is stored temporarily in pending_devices during pairing
        pending = db.query(PendingDevice).filter(
            PendingDevice.device_id == device_id
        ).first()

        api_key_to_deliver = None
        if pending and hasattr(pending, 'api_key_plaintext') and pending.api_key_plaintext:
            api_key_to_deliver = pending.api_key_plaintext
            db.delete(pending)
            db.commit()

        return {
            "is_paired": True,
            "api_key": api_key_to_deliver
        }

    return {
        "is_paired": False,
        "api_key": None
    }

@router.post("/pairing/confirm")
async def confirm_pairing(
    request: dict,
    current_user: User = Depends(require_parent),
    db: Session = Depends(get_db)
):
    """Parent confirms pairing by entering the pairing code from the device"""
    pairing_code = request.get("pairing_code")
    kid_profile_id = request.get("kid_profile_id")
    
    if not pairing_code or not kid_profile_id:
        raise HTTPException(status_code=400, detail="pairing_code and kid_profile_id required")
    
    # Verify kid profile belongs to this parent
    kid_profile = db.query(KidProfile).filter(
        KidProfile.id == kid_profile_id,
        KidProfile.parent_id == current_user.id
    ).first()
    
    if not kid_profile:
        raise HTTPException(status_code=404, detail="Kid profile not found")
    
    # Find pending device with this pairing code
    pending = db.query(PendingDevice).filter(
        PendingDevice.pairing_code == pairing_code
    ).first()
    
    if not pending:
        raise HTTPException(status_code=404, detail="Invalid pairing code")
    
    # Check if expired
    if pending.expires_at < datetime.utcnow():
        db.delete(pending)
        db.commit()
        raise HTTPException(status_code=410, detail="Pairing code expired")
    
    # Generate new API key and hash it for storage
    api_key = secrets.token_urlsafe(48)
    api_key_hashed = hash_api_key(api_key)

    # Check if device already exists (re-pairing scenario)
    existing_device = db.query(Device).filter(Device.device_id == pending.device_id).first()

    if existing_device:
        existing_device.api_key = api_key_hashed
        existing_device.family_id = current_user.id
        existing_device.kid_profile_id = kid_profile_id
        device = existing_device
    else:
        device = Device(
            device_id=pending.device_id,
            api_key=api_key_hashed,
            family_id=current_user.id,
            kid_profile_id=kid_profile_id
        )
        db.add(device)

    # Store the plaintext key temporarily so the device can retrieve it once
    pending.api_key_plaintext = api_key
    db.commit()
    db.refresh(device)
    
    return {
        "success": True,
        "device_id": device.device_id,
        "kid_name": kid_profile.name
    }

def get_device_from_headers(
    x_device_id: Optional[str] = Header(None),
    x_api_key: Optional[str] = Header(None),
    db: Session = Depends(get_db)
):
    if not x_device_id or not x_api_key:
        raise HTTPException(status_code=401, detail="Missing device authentication headers")

    device = db.query(Device).filter(Device.device_id == x_device_id).first()

    if not device:
        raise HTTPException(status_code=401, detail="Invalid device credentials")

    # Support both hashed and legacy plaintext keys during migration
    if not verify_api_key(x_api_key, device.api_key) and device.api_key != x_api_key:
        raise HTTPException(status_code=401, detail="Invalid device credentials")

    db.query(Device).filter(Device.id == device.id).update({"last_active": datetime.utcnow()})
    db.commit()

    return device

@router.get("/device/validate")
async def validate_device(
    device: Device = Depends(get_device_from_headers),
    db: Session = Depends(get_db)
):
    """Validate a device's saved credentials and return profile info"""
    if not device.kid_profile_id:
        raise HTTPException(status_code=404, detail="Device not linked to a kid profile")
    
    kid_profile = db.query(KidProfile).filter(
        KidProfile.id == device.kid_profile_id
    ).first()
    
    if not kid_profile:
        raise HTTPException(status_code=404, detail="Kid profile not found")
    
    return {
        "is_paired": True,
        "kid_profile_id": kid_profile.id,
        "kid_name": kid_profile.name,
        "kid_age": kid_profile.age
    }

@router.post("/device/pair")
async def pair_device_to_kid(
    request: dict,
    parent_id: int = Depends(require_parent),
    db: Session = Depends(get_db)
):
    """Pair a device (by device_id) to a kid profile"""
    device_id_input = request.get("device_id")
    kid_profile_id = request.get("kid_profile_id")
    
    if not device_id_input or not kid_profile_id:
        raise HTTPException(status_code=400, detail="device_id and kid_profile_id required")
    
    # Verify kid profile belongs to this parent
    kid_profile = db.query(KidProfile).filter(
        KidProfile.id == kid_profile_id,
        KidProfile.parent_id == parent_id
    ).first()
    
    if not kid_profile:
        raise HTTPException(status_code=404, detail="Kid profile not found")
    
    # Check if device already exists
    device = db.query(Device).filter(Device.device_id == device_id_input).first()
    
    if device:
        # Security: Prevent device hijacking - only allow reassignment if device belongs to this parent
        if device.family_id != parent_id:
            raise HTTPException(
                status_code=403, 
                detail="This device is already paired to another family"
            )
        # Update existing device to link to this kid
        device.kid_profile_id = kid_profile_id
        device.last_active = datetime.utcnow()
    else:
        # Create new device with hashed API key
        api_key = secrets.token_urlsafe(48)
        device = Device(
            device_id=device_id_input,
            api_key=hash_api_key(api_key),
            family_id=parent_id,
            kid_profile_id=kid_profile_id
        )
        db.add(device)

    db.commit()
    db.refresh(device)

    return {
        "device_id": device.device_id,
        "api_key": api_key if 'api_key' in dir() else None,
        "family_id": device.family_id,
        "kid_profile_id": device.kid_profile_id,
        "kid_name": kid_profile.name
    }

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
        raise HTTPException(status_code=401, detail="Invalid or expired pairing code")
    
    device_id = secrets.token_urlsafe(32)
    api_key = secrets.token_urlsafe(48)
    api_key_hashed = hash_api_key(api_key)

    device = Device(
        device_id=device_id,
        api_key=api_key_hashed,
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
    
    provider_groups = {}
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
                
                # Determine primary provider for package name
                provider_package_map = {
                    "netflix": "com.netflix.mediaclient",
                    "disney_plus": "com.disney.disneyplus",
                    "hulu": "com.hulu.plus",
                    "prime_video": "com.amazon.avod.thirdpartyclient",
                    "peacock": "com.peacocktv.peacockandroid",
                    "youtube": "com.google.android.youtube"
                }
                
                primary_provider = None
                if title.providers and len(title.providers) > 0:
                    primary_provider = title.providers[0].lower().replace(" ", "_") if title.providers[0] else None
                
                package_name = provider_package_map.get(primary_provider, "com.google.android.youtube")
                
                # Get series-level deep link
                series_deep_link = ""
                if title.deep_links and isinstance(title.deep_links, dict):
                    for provider_id, link in title.deep_links.items():
                        if link:
                            series_deep_link = link
                            break
                
                # Build base content item
                content_item = {
                    "id": str(title.id),
                    "appName": str(title.title) if title and hasattr(title, 'title') else "Unknown",
                    "packageName": package_name,
                    "iconUrl": poster_url,
                    "coverArt": backdrop_url,
                    "isEnabled": True,
                    "ageRating": title.rating or "All",
                    "mediaType": title.media_type.upper() if title.media_type else "Content",
                    "deepLink": series_deep_link
                }
                
                # For TV shows, add episodes array
                if title.media_type == 'tv':
                    episodes_array = []
                    
                    # Get episode 1
                    episode_1 = db.query(Episode).filter(
                        Episode.title_id == title.id,
                        Episode.season_number == 1,
                        Episode.episode_number == 1
                    ).first()
                    
                    if episode_1:
                        # Get episode 1 deep link
                        episode_link = db.query(EpisodeLink).filter(
                            EpisodeLink.episode_id == episode_1.id,
                            EpisodeLink.deep_link_url.isnot(None)
                        ).first()
                        
                        episode_deep_link = ""
                        if episode_link and episode_link.deep_link_url:
                            episode_deep_link = episode_link.deep_link_url
                        
                        episodes_array.append({
                            "id": f"s{episode_1.season_number}e{episode_1.episode_number}",
                            "name": episode_1.episode_name or "Episode 1",
                            "deepLink": episode_deep_link
                        })
                    
                    content_item["episodes"] = episodes_array
                
                if title.providers and len(title.providers) > 0:
                    for provider in title.providers:
                        normalized_provider = provider.lower().replace(" ", "_") if provider else "other"
                        if normalized_provider not in provider_groups:
                            provider_groups[normalized_provider] = []
                        provider_groups[normalized_provider].append(content_item)
                else:
                    if "other" not in provider_groups:
                        provider_groups["other"] = []
                    provider_groups["other"].append(content_item)
    
    provider_info = {
        "netflix": {"name": "Netflix", "package": "com.netflix.mediaclient"},
        "disney_plus": {"name": "Disney+", "package": "com.disney.disneyplus"},
        "hulu": {"name": "Hulu", "package": "com.hulu.plus"},
        "prime_video": {"name": "Prime Video", "package": "com.amazon.avod.thirdpartyclient"},
        "peacock": {"name": "Peacock", "package": "com.peacocktv.peacockandroid"},
        "youtube": {"name": "YouTube", "package": "com.google.android.youtube"},
        "other": {"name": "Other", "package": ""}
    }
    
    categories = []
    for provider_id in sorted(provider_groups.keys()):
        info = provider_info.get(provider_id, {"name": provider_id.title(), "package": ""})
        categories.append({
            "id": provider_id,
            "name": info["name"],
            "package": info["package"],
            "content": provider_groups[provider_id],
            "count": len(provider_groups[provider_id])
        })
    
    return categories

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

@router.get("/launcher/devices")
async def get_devices(
    current_user: User = Depends(require_parent),
    db: Session = Depends(get_db)
):
    """Get all devices for the current parent's family"""
    devices = db.query(Device).filter(
        Device.family_id == current_user.id
    ).all()
    
    result = []
    for device in devices:
        kid_profile = None
        if device.kid_profile_id:
            kid_profile = db.query(KidProfile).filter(
                KidProfile.id == device.kid_profile_id
            ).first()
        
        result.append({
            "id": device.id,
            "device_id": device.device_id,
            "device_name": device.device_name or f"Device {device.device_id[:8]}",
            "kid_profile_name": kid_profile.name if kid_profile else "Unassigned",
            "kid_profile_id": device.kid_profile_id,
            "created_at": device.created_at.isoformat() if device.created_at else None,
            "last_active": device.last_active.isoformat() if device.last_active else None
        })
    
    return result

@router.get("/launcher/admin/devices")
async def get_all_devices_admin(
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Admin endpoint: Get all devices with kid profile and parent information"""
    devices = db.query(Device).all()
    
    result = []
    for device in devices:
        kid_profile = None
        parent = None
        
        if device.kid_profile_id:
            kid_profile = db.query(KidProfile).filter(KidProfile.id == device.kid_profile_id).first()
            if kid_profile:
                parent = db.query(User).filter(User.id == kid_profile.parent_id).first()
        
        result.append({
            "id": device.id,
            "device_id": device.device_id,
            "device_name": device.device_name or f"Device {device.device_id[:8]}",
            "kid_profile_id": device.kid_profile_id,
            "kid_name": kid_profile.name if kid_profile else "Unassigned",
            "kid_age": kid_profile.age if kid_profile else None,
            "parent_email": parent.email if parent else None,
            "parent_id": kid_profile.parent_id if kid_profile else None,
            "created_at": device.created_at.isoformat() if device.created_at else None,
            "last_active": device.last_active.isoformat() if device.last_active else None
        })
    
    return result

@router.put("/launcher/device/{device_id}/name")
async def update_device_name(
    device_id: int,
    request: dict,
    current_user: User = Depends(require_parent),
    db: Session = Depends(get_db)
):
    """Update a device's display name"""
    device_name = request.get("device_name")
    
    if not device_name:
        raise HTTPException(status_code=400, detail="device_name is required")
    
    # Find device and verify it belongs to this parent
    device = db.query(Device).filter(
        Device.id == device_id,
        Device.family_id == current_user.id
    ).first()
    
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")
    
    device.device_name = device_name
    db.commit()
    db.refresh(device)
    
    return {
        "id": device.id,
        "device_id": device.device_id,
        "device_name": device.device_name
    }

@router.delete("/launcher/device/{device_id}")
async def delete_device_for_repairing(
    device_id: int,
    current_user: User = Depends(require_parent),
    db: Session = Depends(get_db)
):
    """Delete a device so it can be re-paired"""
    # Find device and verify it belongs to this parent
    device = db.query(Device).filter(
        Device.id == device_id,
        Device.family_id == current_user.id
    ).first()
    
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")
    
    # Delete the device
    db.delete(device)
    db.commit()
    
    return {
        "success": True,
        "message": "Device deleted. It can now be re-paired."
    }

@router.post("/device/episode-report")
async def report_episode_url(
    request: dict,
    device: Device = Depends(get_device_from_headers),
    db: Session = Depends(get_db)
):
    """
    Device reports an episode URL during playback.
    This builds a crowdsourced database of episode-specific deep links.
    """
    url = request.get("url")
    provider = request.get("provider")
    
    if not url or not provider:
        raise HTTPException(status_code=400, detail="url and provider are required")
    
    # Normalize provider name for internal lookups
    provider_map = {
        "com.disney.disneyplus": "disney_plus",
        "com.netflix.mediaclient": "netflix",
        "com.hulu.plus": "hulu",
        "com.amazon.avod.thirdpartyclient": "prime_video",
        "com.peacocktv.peacockandroid": "peacock",
        "com.google.android.youtube.tv": "youtube"
    }
    normalized_provider = provider_map.get(provider, provider)
    
    # Parse TMDB ID as integer (comes as string from JSON)
    tmdb_title_id = None
    if request.get("tmdb_title_id"):
        try:
            tmdb_title_id = int(request.get("tmdb_title_id"))
        except (ValueError, TypeError):
            pass
    
    # Create episode report (store both raw and normalized)
    report = DeviceEpisodeReport(
        device_id=device.id,
        raw_url=url,
        provider=provider,
        normalized_provider=normalized_provider,
        reported_title=request.get("title"),
        season_hint=request.get("season_number"),
        episode_hint=request.get("episode_number"),
        tmdb_title_id=tmdb_title_id,
        kid_profile_id=device.kid_profile_id,
        playback_position=request.get("playback_position")
    )
    
    db.add(report)
    db.commit()
    db.refresh(report)
    
    # Try immediate matching if TMDB info provided
    if report.tmdb_title_id and report.season_hint is not None and report.episode_hint is not None:
        # First, find the Title record using TMDB ID
        title = db.query(Title).filter(Title.tmdb_id == report.tmdb_title_id).first()
        
        if not title:
            return {
                "report_id": report.id,
                "status": "pending",
                "message": "Title not found in database - will process later"
            }
        
        # Now find the episode using the internal title ID
        episode = db.query(Episode).filter(
            Episode.title_id == title.id,
            Episode.season_number == report.season_hint,
            Episode.episode_number == report.episode_hint
        ).first()
        
        if episode:
            # Check if this URL already exists (check all provider combinations for backward compatibility)
            existing_link = db.query(EpisodeLink).filter(
                EpisodeLink.episode_id == episode.id,
                EpisodeLink.deep_link_url == url
            ).filter(
                (EpisodeLink.raw_provider == provider) | 
                (EpisodeLink.raw_provider == normalized_provider) |
                (EpisodeLink.provider == provider) |
                (EpisodeLink.provider == normalized_provider)
            ).first()
            
            if existing_link:
                # Update confirmation count
                existing_link.confirmed_count += 1
                existing_link.last_confirmed_at = datetime.utcnow()
                report.processing_status = "matched_existing"
                
                # Try to enrich with Movie of the Night API
                try:
                    enrichment = movie_api_client.enrich_episode_link(
                        url=url,
                        tmdb_id=report.tmdb_title_id,
                        season=report.season_hint,
                        episode=report.episode_hint
                    )
                    if enrichment and enrichment.get("data"):
                        existing_link.enrichment_data = json.dumps(enrichment["data"])
                        existing_link.last_enriched_at = datetime.utcnow()
                        # Only mark as verified if API actually confirmed it
                        if enrichment.get("verified") is True:
                            existing_link.motn_verified = True
                except Exception as e:
                    print(f"Enrichment failed: {e}")
                
                db.commit()
            else:
                # Create new episode link (store both raw and normalized)
                episode_link = EpisodeLink(
                    episode_id=episode.id,
                    raw_provider=provider,
                    provider=normalized_provider,
                    deep_link_url=url,
                    source="device_report",
                    confidence_score=1.0
                )
                
                # Try to enrich with Movie of the Night API
                try:
                    enrichment = movie_api_client.enrich_episode_link(
                        url=url,
                        tmdb_id=report.tmdb_title_id,
                        season=report.season_hint,
                        episode=report.episode_hint
                    )
                    if enrichment and enrichment.get("data"):
                        episode_link.enrichment_data = json.dumps(enrichment["data"])
                        episode_link.last_enriched_at = datetime.utcnow()
                        # Only mark as verified if API actually confirmed it
                        if enrichment.get("verified") is True:
                            episode_link.motn_verified = True
                except Exception as e:
                    print(f"Enrichment failed: {e}")
                
                db.add(episode_link)
                report.processing_status = "matched_new"
                db.commit()
            
            report.matched_episode_id = episode.id
            report.confidence_score = 1.0
            report.processed_at = datetime.utcnow()
            db.commit()
    
    return {
        "report_id": report.id,
        "status": report.processing_status,
        "message": "Episode URL reported successfully"
    }

@router.get("/launcher/admin/episode-reports")
def get_all_episode_reports(
    skip: int = 0,
    limit: int = 100,
    status: Optional[str] = None,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Get all device episode reports for admin review"""
    query = db.query(DeviceEpisodeReport).order_by(DeviceEpisodeReport.reported_at.desc())
    
    if status:
        query = query.filter(DeviceEpisodeReport.processing_status == status)
    
    reports = query.offset(skip).limit(limit).all()
    
    result = []
    for report in reports:
        device = db.query(Device).filter(Device.id == report.device_id).first()
        kid = db.query(KidProfile).filter(KidProfile.id == report.kid_profile_id).first()
        
        result.append({
            "id": report.id,
            "device_name": device.device_name if device else None,
            "kid_name": kid.name if kid else None,
            "reported_title": report.reported_title,
            "provider": report.normalized_provider,
            "season": report.season_hint,
            "episode": report.episode_hint,
            "raw_url": report.raw_url,
            "tmdb_title_id": report.tmdb_title_id,
            "processing_status": report.processing_status,
            "confidence_score": report.confidence_score,
            "reported_at": report.reported_at,
            "processed_at": report.processed_at
        })
    
    return result

@router.get("/launcher/admin/episode-links")
def get_all_episode_links(
    skip: int = 0,
    limit: int = 100,
    provider: Optional[str] = None,
    verified_only: bool = False,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Get all episode deep links for admin review"""
    query = db.query(EpisodeLink).filter(EpisodeLink.is_active == True)
    
    if provider:
        query = query.filter(EpisodeLink.provider == provider)
    
    if verified_only:
        query = query.filter(EpisodeLink.motn_verified == True)
    
    query = query.order_by(EpisodeLink.last_confirmed_at.desc())
    links = query.offset(skip).limit(limit).all()
    
    result = []
    for link in links:
        episode = db.query(Episode).filter(Episode.id == link.episode_id).first()
        title = None
        if episode:
            title = db.query(Title).filter(Title.id == episode.title_id).first()
        
        result.append({
            "id": link.id,
            "title_name": str(title.title) if title and title.title else None,
            "season": episode.season_number if episode else None,
            "episode": episode.episode_number if episode else None,
            "episode_title": str(episode.title) if episode and episode.title else None,
            "provider": str(link.provider) if link.provider else None,
            "deep_link_url": str(link.deep_link_url) if link.deep_link_url else None,
            "source": str(link.source) if link.source else None,
            "confidence_score": link.confidence_score,
            "confirmed_count": link.confirmed_count,
            "motn_verified": link.motn_verified,
            "motn_quality_score": link.motn_quality_score,
            "custom_tags": link.custom_tags,
            "first_seen_at": link.first_seen_at,
            "last_confirmed_at": link.last_confirmed_at,
            "last_enriched_at": link.last_enriched_at
        })
    
    return result
