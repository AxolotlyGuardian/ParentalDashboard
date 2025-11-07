from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional
import httpx
from db import get_db
from models import Title, User
from config import settings
from datetime import datetime
from auth_utils import require_parent

router = APIRouter(prefix="/catalog", tags=["catalog"])

PROVIDER_MAP = {
    "netflix": 8,
    "disney_plus": 337,
    "prime_video": 9,
    "hulu": 15,
    "peacock": 387,
    "youtube": 192
}

# Legacy mapping for backwards compatibility
LEGACY_PROVIDER_MAP = {
    "Netflix": "netflix",
    "Disney": "disney_plus",
    "Disney+": "disney_plus",
    "Prime": "prime_video",
    "Prime Video": "prime_video",
    "Hulu": "hulu",
    "Peacock": "peacock",
    "YouTube": "youtube"
}

def normalize_providers(providers: list) -> list:
    """Normalize provider names to canonical format"""
    if not providers:
        return []
    
    normalized = []
    for provider in providers:
        # Check if it's already in canonical format
        if provider in PROVIDER_MAP:
            normalized.append(provider)
        # Check if it's a legacy name
        elif provider in LEGACY_PROVIDER_MAP:
            canonical = LEGACY_PROVIDER_MAP[provider]
            if canonical not in normalized:
                normalized.append(canonical)
        else:
            # Unknown provider, keep as-is
            if provider not in normalized:
                normalized.append(provider)
    
    return normalized

async def fetch_and_update_providers(title: Title, db: Session):
    """Fetch provider information from TMDB and update the title"""
    if not settings.TMDB_API_KEY:
        print(f"No TMDB API key configured")
        return
    
    if not title.tmdb_id:
        print(f"Title {title.id} has no TMDB ID")
        return
    
    media_type = "movie" if title.media_type == "movie" else "tv"
    url = f"{settings.TMDB_API_BASE_URL}/{media_type}/{title.tmdb_id}/watch/providers"
    params = {"api_key": settings.TMDB_API_KEY}
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(url, params=params)
            if response.status_code != 200:
                print(f"TMDB API returned {response.status_code} for title {title.id}")
                return
            
            data = response.json()
            us_providers = data.get("results", {}).get("US", {})
            
            all_providers = []
            for category in ["flatrate", "ads", "free"]:
                all_providers.extend(us_providers.get(category, []))
            
            id_to_name = {v: k for k, v in PROVIDER_MAP.items()}
            
            available_providers = []
            for provider in all_providers:
                provider_id = provider.get("provider_id")
                if provider_id in id_to_name:
                    our_name = id_to_name[provider_id]
                    if our_name not in available_providers:
                        available_providers.append(our_name)
            
            title.providers = available_providers
            db.commit()
            print(f"Updated title {title.id} ({title.title}) with providers: {available_providers}")
    except Exception as e:
        print(f"Error fetching providers for title {title.id}: {e}")

@router.post("/update-all-providers")
async def update_all_providers(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_parent)
):
    """Batch update provider information for all titles missing it"""
    titles = db.query(Title).filter(Title.tmdb_id.isnot(None)).all()
    updated = 0
    skipped = 0
    
    for title in titles:
        if not title.providers or len(title.providers) == 0:
            await fetch_and_update_providers(title, db)
            updated += 1
        else:
            skipped += 1
    
    return {
        "message": f"Provider update complete",
        "updated": updated,
        "skipped": skipped,
        "total": len(titles)
    }

@router.get("/search")
async def search_titles(
    query: str,
    media_type: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_parent)
):
    if not settings.TMDB_API_KEY:
        raise HTTPException(status_code=500, detail="TMDB API key not configured")
    
    url = f"{settings.TMDB_API_BASE_URL}/search/multi"
    params = {
        "api_key": settings.TMDB_API_KEY,
        "query": query,
        "language": "en-US",
        "page": 1
    }
    
    async with httpx.AsyncClient() as client:
        response = await client.get(url, params=params)
        if response.status_code != 200:
            raise HTTPException(status_code=response.status_code, detail="TMDB API error")
        
        data = response.json()
        results = []
        
        for item in data.get("results", []):
            if item.get("media_type") not in ["movie", "tv"]:
                continue
            
            if media_type and item.get("media_type") != media_type:
                continue
            
            tmdb_id = item.get("id")
            existing_title = db.query(Title).filter(Title.tmdb_id == tmdb_id).first()
            
            if not existing_title:
                new_title = Title(
                    tmdb_id=tmdb_id,
                    title=item.get("title") or item.get("name", ""),
                    media_type=item.get("media_type"),
                    overview=item.get("overview"),
                    poster_path=item.get("poster_path"),
                    backdrop_path=item.get("backdrop_path"),
                    release_date=item.get("release_date") or item.get("first_air_date"),
                    rating=str(item.get("vote_average", 0)),
                    genres=item.get("genre_ids", []),
                    last_synced=datetime.utcnow()
                )
                db.add(new_title)
                db.commit()
                db.refresh(new_title)
                existing_title = new_title
            
            results.append({
                "id": existing_title.id,
                "tmdb_id": existing_title.tmdb_id,
                "title": existing_title.title,
                "media_type": existing_title.media_type,
                "overview": existing_title.overview,
                "poster_path": f"https://image.tmdb.org/t/p/w500{existing_title.poster_path}" if existing_title.poster_path else None,
                "release_date": existing_title.release_date,
                "rating": existing_title.rating
            })
        
        return {"results": results}

@router.get("/titles/{title_id}")
def get_title_details(
    title_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_parent)
):
    title = db.query(Title).filter(Title.id == title_id).first()
    if not title:
        raise HTTPException(status_code=404, detail="Title not found")
    
    return {
        "id": title.id,
        "tmdb_id": title.tmdb_id,
        "title": title.title,
        "media_type": title.media_type,
        "overview": title.overview,
        "poster_path": f"https://image.tmdb.org/t/p/w500{title.poster_path}" if title.poster_path else None,
        "backdrop_path": f"https://image.tmdb.org/t/p/original{title.backdrop_path}" if title.backdrop_path else None,
        "release_date": title.release_date,
        "rating": title.rating,
        "genres": title.genres
    }

@router.get("/titles")
def get_all_titles(
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_parent)
):
    titles = db.query(Title).offset(skip).limit(limit).all()
    return [{
        "id": t.id,
        "tmdb_id": t.tmdb_id,
        "title": t.title,
        "media_type": t.media_type,
        "poster_path": f"https://image.tmdb.org/t/p/w500{t.poster_path}" if t.poster_path else None,
        "rating": t.rating
    } for t in titles]

@router.get("/titles/{title_id}/providers")
async def get_title_providers(
    title_id: int,
    db: Session = Depends(get_db)
):
    title = db.query(Title).filter(Title.id == title_id).first()
    if not title:
        raise HTTPException(status_code=404, detail="Title not found")
    
    if not settings.TMDB_API_KEY:
        return {"providers": [], "deep_links": {}}
    
    media_type = "movie" if title.media_type == "movie" else "tv"
    url = f"{settings.TMDB_API_BASE_URL}/{media_type}/{title.tmdb_id}/watch/providers"
    params = {"api_key": settings.TMDB_API_KEY}
    
    async with httpx.AsyncClient() as client:
        response = await client.get(url, params=params)
        if response.status_code != 200:
            return {"providers": [], "deep_links": {}}
        
        data = response.json()
        us_providers = data.get("results", {}).get("US", {})
        
        # Get all provider categories (flatrate, ads, free, etc.)
        all_providers = []
        for category in ["flatrate", "ads", "free"]:
            all_providers.extend(us_providers.get(category, []))
        
        # Reverse map: provider_id -> our name
        id_to_name = {v: k for k, v in PROVIDER_MAP.items()}
        
        available_providers = []
        for provider in all_providers:
            provider_id = provider.get("provider_id")
            if provider_id in id_to_name:
                our_name = id_to_name[provider_id]
                if our_name not in available_providers:
                    available_providers.append(our_name)
        
        # Fetch JustWatch click URLs from TMDB watch page
        deep_links = {}
        tmdb_watch_url = us_providers.get("link", "")
        if tmdb_watch_url and available_providers:
            try:
                watch_response = await client.get(tmdb_watch_url)
                if watch_response.status_code == 200:
                    html = watch_response.text
                    
                    # Extract JustWatch click URLs and map to providers
                    import re
                    import urllib.parse
                    import base64
                    import json as json_module
                    
                    justwatch_urls = re.findall(r'https://click\.justwatch\.com/a\?[^"]+', html)
                    
                    # Try to match JustWatch URLs to providers by decoding the cx parameter
                    for jw_url in justwatch_urls:
                        try:
                            # Extract and URL-decode cx parameter
                            cx_match = re.search(r'cx=([^&]+)', jw_url)
                            if cx_match:
                                cx_encoded = urllib.parse.unquote(cx_match.group(1))
                                # Add padding if needed for base64
                                padding = len(cx_encoded) % 4
                                if padding:
                                    cx_encoded += '=' * (4 - padding)
                                cx_data = base64.b64decode(cx_encoded).decode('utf-8')
                                cx_json = json_module.loads(cx_data)
                                
                                # Get provider ID from the decoded data
                                provider_id = cx_json.get('data', [{}])[0].get('data', {}).get('providerId')
                                
                                # Match provider ID to our names
                                if provider_id in id_to_name:
                                    our_name = id_to_name[provider_id]
                                    if our_name in available_providers and our_name not in deep_links:
                                        deep_links[our_name] = jw_url
                        except Exception as e:
                            # If decoding fails, continue to next URL
                            continue
            except Exception as e:
                print(f"Error fetching JustWatch links: {e}")
        
        # Fallback to TMDB link if JustWatch extraction failed
        for provider in available_providers:
            if provider not in deep_links:
                deep_links[provider] = tmdb_watch_url
        
        # Save to database
        title.providers = available_providers
        title.deep_links = deep_links
        db.commit()
        
        return {"providers": available_providers, "deep_links": deep_links}
