from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional
import httpx
import logging
from db import get_db
from models import Title, User, Episode, EpisodeTag, ContentTag, EpisodePolicy, Policy
from config import settings
from datetime import datetime
from auth_utils import require_parent

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/catalog", tags=["catalog"])

PROVIDER_MAP = {
    "netflix": 8,
    "disney_plus": 337,
    "prime_video": 9,
    "hulu": 15,
    "peacock": 387,
    "youtube": 192
}

# TMDB Genre ID to Name mapping
GENRE_MAP = {
    12: "Adventure",
    14: "Fantasy",
    16: "Animation",
    18: "Drama",
    27: "Horror",
    28: "Action",
    35: "Comedy",
    36: "History",
    37: "Western",
    53: "Thriller",
    80: "Crime",
    99: "Documentary",
    878: "Science Fiction",
    9648: "Mystery",
    10402: "Music",
    10749: "Romance",
    10751: "Family",
    10752: "War",
    10759: "Action & Adventure",
    10762: "Kids",
    10763: "News",
    10764: "Reality",
    10765: "Sci-Fi & Fantasy",
    10766: "Soap",
    10767: "Talk",
    10768: "War & Politics",
    10770: "TV Movie",
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
        logger.warning("No TMDB API key configured")
        return

    if not title.tmdb_id:
        logger.warning("Title %d has no TMDB ID", title.id)
        return
    
    media_type = "movie" if title.media_type == "movie" else "tv"
    url = f"{settings.TMDB_API_BASE_URL}/{media_type}/{title.tmdb_id}/watch/providers"
    params = {"api_key": settings.TMDB_API_KEY}
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(url, params=params)
            if response.status_code != 200:
                logger.warning("TMDB API returned %d for title %d", response.status_code, title.id)
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
            logger.info("Updated title %d (%s) with providers: %s", title.id, title.title, available_providers)
    except Exception as e:
        logger.error("Error fetching providers for title %d: %s", title.id, e)

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

async def check_streaming_availability(tmdb_id: int, media_type: str, client: httpx.AsyncClient) -> list:
    """Check if content has streaming providers in our supported list"""
    url = f"{settings.TMDB_API_BASE_URL}/{media_type}/{tmdb_id}/watch/providers"
    params = {"api_key": settings.TMDB_API_KEY}
    
    try:
        response = await client.get(url, params=params)
        if response.status_code != 200:
            return []
        
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
        
        return available_providers
    except:
        return []

@router.get("/search")
async def search_titles(
    query: str,
    media_type: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_parent)
):
    if not settings.TMDB_API_KEY:
        raise HTTPException(status_code=500, detail="TMDB API key not configured")
    
    from models import StreamingServiceSelection
    
    service_selection = db.query(StreamingServiceSelection).filter(
        StreamingServiceSelection.family_id == current_user.id
    ).first()
    
    selected_services = service_selection.selected_services if service_selection else []
    
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
            raise HTTPException(status_code=502, detail="Failed to fetch results from content provider")
        
        data = response.json()
        results = []
        
        for item in data.get("results", []):
            if item.get("media_type") not in ["movie", "tv"]:
                continue
            
            if media_type and item.get("media_type") != media_type:
                continue
            
            tmdb_id = item.get("id")
            item_media_type = item.get("media_type")
            
            providers = await check_streaming_availability(tmdb_id, item_media_type, client)
            
            if not providers:
                continue
            
            if selected_services:
                has_matching_service = any(
                    provider in selected_services for provider in providers
                )
                if not has_matching_service:
                    continue
            
            existing_title = db.query(Title).filter(Title.tmdb_id == tmdb_id).first()
            
            if not existing_title:
                new_title = Title(
                    tmdb_id=tmdb_id,
                    title=item.get("title") or item.get("name", ""),
                    media_type=item_media_type,
                    overview=item.get("overview"),
                    poster_path=item.get("poster_path"),
                    backdrop_path=item.get("backdrop_path"),
                    release_date=item.get("release_date") or item.get("first_air_date"),
                    rating=str(item.get("vote_average", 0)),
                    genres=item.get("genre_ids", []),
                    providers=providers,
                    last_synced=datetime.utcnow()
                )
                db.add(new_title)
                db.commit()
                db.refresh(new_title)
                existing_title = new_title
            else:
                existing_title.providers = providers
                db.commit()
            
            results.append({
                "id": existing_title.id,
                "tmdb_id": existing_title.tmdb_id,
                "title": existing_title.title,
                "media_type": existing_title.media_type,
                "overview": existing_title.overview,
                "poster_path": f"https://image.tmdb.org/t/p/w500{existing_title.poster_path}" if existing_title.poster_path else None,
                "release_date": existing_title.release_date,
                "rating": existing_title.rating,
                "providers": existing_title.providers
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
    
    genre_names = []
    if title.genres:
        if isinstance(title.genres, list):
            for g in title.genres:
                if isinstance(g, dict):
                    # Already has name (from detailed TMDB fetch)
                    genre_names.append(g.get("name", str(g)))
                elif isinstance(g, int):
                    # Convert genre ID to name
                    genre_names.append(GENRE_MAP.get(g, f"Genre {g}"))
                else:
                    genre_names.append(str(g))
        else:
            genre_names = title.genres
    
    return {
        "id": title.id,
        "tmdb_id": title.tmdb_id,
        "title": title.title,
        "media_type": title.media_type,
        "overview": title.overview,
        "poster_path": f"https://image.tmdb.org/t/p/w500{title.poster_path}" if title.poster_path else None,
        "backdrop_path": f"https://image.tmdb.org/t/p/original{title.backdrop_path}" if title.backdrop_path else None,
        "release_date": title.release_date,
        "content_rating": title.rating,
        "vote_average": title.vote_average,
        "genres": genre_names,
        "number_of_seasons": title.number_of_seasons,
        "number_of_episodes": title.number_of_episodes,
        "fandom_scraped": title.fandom_scraped
    }

@router.get("/titles/{title_id}/episodes")
def get_title_episodes(
    title_id: int,
    policy_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_parent)
):
    title = db.query(Title).filter(Title.id == title_id).first()
    if not title:
        raise HTTPException(status_code=404, detail="Title not found")
    
    episodes = db.query(Episode).filter(Episode.title_id == title_id).order_by(
        Episode.season_number, Episode.episode_number
    ).all()
    
    episode_policies_map = {}
    if policy_id:
        episode_policies = db.query(EpisodePolicy).filter(
            EpisodePolicy.policy_id == policy_id
        ).all()
        episode_policies_map = {ep.episode_id: ep.is_allowed for ep in episode_policies}
    
    episode_ids = [ep.id for ep in episodes]
    episode_tags_raw = db.query(EpisodeTag.episode_id, ContentTag).join(
        ContentTag, EpisodeTag.tag_id == ContentTag.id
    ).filter(EpisodeTag.episode_id.in_(episode_ids)).all() if episode_ids else []
    
    episode_tags_map = {}
    for episode_id, tag in episode_tags_raw:
        if episode_id not in episode_tags_map:
            episode_tags_map[episode_id] = []
        episode_tags_map[episode_id].append(tag)
    
    seasons = {}
    for episode in episodes:
        tags = episode_tags_map.get(episode.id, [])
        
        episode_data = {
            "id": episode.id,
            "season_number": episode.season_number,
            "episode_number": episode.episode_number,
            "episode_name": episode.episode_name,
            "overview": episode.overview,
            "thumbnail_path": f"https://image.tmdb.org/t/p/w300{episode.thumbnail_path}" if episode.thumbnail_path else None,
            "air_date": episode.air_date,
            "is_blocked": not episode_policies_map.get(episode.id, True),
            "tags": [{
                "id": tag.id,
                "category": tag.category,
                "slug": tag.slug,
                "display_name": tag.display_name,
                "description": tag.description
            } for tag in tags]
        }
        
        season_key = episode.season_number
        if season_key not in seasons:
            seasons[season_key] = []
        seasons[season_key].append(episode_data)
    
    return {
        "title_id": title_id,
        "seasons": seasons
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
                logger.error("Error fetching JustWatch links: %s", e)
        
        # Fallback to TMDB link if JustWatch extraction failed
        for provider in available_providers:
            if provider not in deep_links:
                deep_links[provider] = tmdb_watch_url
        
        # Save to database
        title.providers = available_providers
        title.deep_links = deep_links
        db.commit()
        
        return {"providers": available_providers, "deep_links": deep_links}
