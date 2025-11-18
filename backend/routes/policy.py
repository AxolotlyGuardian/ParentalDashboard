from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List
from db import get_db
from models import Policy, Title, KidProfile, User, Episode, EpisodePolicy
from auth_utils import require_parent, require_admin
from services.fandom_scraper import trigger_show_scrape
from services.auto_tagger import AutoTagger
from datetime import datetime
import sys
import os
sys.path.append(os.path.dirname(__file__))
from catalog import fetch_and_update_providers, normalize_providers

router = APIRouter(prefix="/policy", tags=["policy"])

def load_episodes_for_title(title_id: int, db: Session):
    """Background task to load episodes from TMDB for a TV show"""
    from config import settings
    import httpx
    
    # Create new session for background task
    from db import SessionLocal
    db = SessionLocal()
    
    try:
        title = db.query(Title).filter(Title.id == title_id).first()
        if not title or title.media_type != "tv" or not title.tmdb_id:
            return
        
        if not settings.TMDB_API_KEY:
            print(f"No TMDB API key configured")
            return
        
        # Get TV show details
        tv_url = f"{settings.TMDB_API_BASE_URL}/tv/{title.tmdb_id}"
        tv_params = {"api_key": settings.TMDB_API_KEY}
        
        with httpx.Client() as client:
            tv_response = client.get(tv_url, params=tv_params, timeout=10)
            if tv_response.status_code != 200:
                print(f"Failed to fetch TV show details for {title.title}")
                return
            
            tv_data = tv_response.json()
            num_seasons = tv_data.get("number_of_seasons", 0)
            num_episodes = tv_data.get("number_of_episodes", 0)
            
            # Update title
            title.number_of_seasons = num_seasons
            title.number_of_episodes = num_episodes
            db.commit()
            
            episodes_loaded = 0
            
            # Load each season
            for season_num in range(1, num_seasons + 1):
                season_url = f"{settings.TMDB_API_BASE_URL}/tv/{title.tmdb_id}/season/{season_num}"
                season_response = client.get(season_url, params=tv_params, timeout=10)
                
                if season_response.status_code != 200:
                    continue
                
                season_data = season_response.json()
                
                for episode_data in season_data.get("episodes", []):
                    tmdb_episode_id = episode_data.get("id")
                    
                    existing = db.query(Episode).filter(Episode.tmdb_episode_id == tmdb_episode_id).first()
                    if existing:
                        continue
                    
                    episode = Episode(
                        title_id=title.id,
                        tmdb_episode_id=tmdb_episode_id,
                        season_number=episode_data.get("season_number", season_num),
                        episode_number=episode_data.get("episode_number"),
                        episode_name=episode_data.get("name"),
                        overview=episode_data.get("overview"),
                        runtime=episode_data.get("runtime"),
                        thumbnail_path=episode_data.get("still_path"),
                        air_date=episode_data.get("air_date")
                    )
                    db.add(episode)
                    episodes_loaded += 1
            
            db.commit()
            print(f"Auto-loaded {episodes_loaded} episodes for {title.title}")
    
    except Exception as e:
        print(f"Error loading episodes for title {title_id}: {str(e)}")
        db.rollback()
    finally:
        db.close()

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
    background_tasks: BackgroundTasks,
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
        title = new_title
    
    # Auto-tag the title with appropriate content tags
    tagger = AutoTagger(db)
    tags_added = tagger.apply_tags_to_title(title.id)
    
    # Auto-load episodes for TV shows if not already loaded
    if title and title.media_type == "tv":
        episode_count = db.query(Episode).filter(Episode.title_id == title.id).count()
        if episode_count == 0:
            # Load episodes from TMDB in background
            background_tasks.add_task(load_episodes_for_title, title.id, db)
            
            # Also try Fandom scraping if not already done
            if not title.fandom_scraped:
                background_tasks.add_task(trigger_show_scrape, title.id, title.title)
    
    existing_policy = db.query(Policy).filter(
        Policy.kid_profile_id == request.kid_profile_id,
        Policy.title_id == request.title_id
    ).first()
    
    if existing_policy:
        existing_policy.is_allowed = request.is_allowed
        db.commit()
        db.refresh(existing_policy)
        return {"id": existing_policy.id, "message": "Policy updated", "tags_added": tags_added}
    
    new_policy = Policy(
        kid_profile_id=request.kid_profile_id,
        title_id=request.title_id,
        is_allowed=request.is_allowed
    )
    db.add(new_policy)
    db.commit()
    db.refresh(new_policy)
    return {"id": new_policy.id, "message": "Policy created", "tags_added": tags_added}

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
    
    policies_with_titles = db.query(Policy, Title).join(
        Title, Policy.title_id == Title.id
    ).filter(
        Policy.kid_profile_id == kid_profile_id
    ).all()
    
    result = [
        {
            "policy_id": policy.id,
            "title_id": title.id,
            "title": title.title,
            "media_type": title.media_type,
            "poster_path": f"https://image.tmdb.org/t/p/w500{title.poster_path}" if title.poster_path else None,
            "is_allowed": policy.is_allowed,
            "providers": title.providers or [],
            "deep_links": title.deep_links or {}
        }
        for policy, title in policies_with_titles
    ]
    
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

@router.get("/admin/all-policies")
def get_all_policies_admin(
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Admin endpoint to view all policies across all families"""
    policies = db.query(Policy).offset(skip).limit(limit).all()
    
    result = []
    for policy in policies:
        title = db.query(Title).filter(Title.id == policy.title_id).first()
        kid = db.query(KidProfile).filter(KidProfile.id == policy.kid_profile_id).first()
        parent = db.query(User).filter(User.id == kid.parent_id).first() if kid else None
        
        result.append({
            "policy_id": policy.id,
            "title_id": policy.title_id,
            "title_name": title.title if title else None,
            "media_type": title.media_type if title else None,
            "kid_profile_id": policy.kid_profile_id,
            "kid_name": kid.name if kid else None,
            "parent_email": parent.email if parent else None,
            "is_allowed": policy.is_allowed,
            "created_at": policy.created_at
        })
    
    return result

@router.post("/{policy_id}/episodes/{episode_id}/toggle")
def toggle_episode_policy(
    policy_id: int,
    episode_id: int,
    is_blocked: bool,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_parent)
):
    policy = db.query(Policy).filter(Policy.id == policy_id).first()
    if not policy:
        raise HTTPException(status_code=404, detail="Policy not found")
    
    profile = db.query(KidProfile).filter(KidProfile.id == policy.kid_profile_id).first()
    if not profile or profile.parent_id != current_user.id:
        raise HTTPException(status_code=403, detail="Can only manage your own kid's policies")
    
    existing_ep_policy = db.query(EpisodePolicy).filter(
        EpisodePolicy.policy_id == policy_id,
        EpisodePolicy.episode_id == episode_id
    ).first()
    
    if is_blocked:
        if not existing_ep_policy:
            new_ep_policy = EpisodePolicy(
                policy_id=policy_id,
                episode_id=episode_id,
                is_allowed=False
            )
            db.add(new_ep_policy)
        else:
            existing_ep_policy.is_allowed = False
    else:
        if existing_ep_policy:
            db.delete(existing_ep_policy)
    
    db.commit()
    return {"message": "Episode policy updated", "is_blocked": is_blocked}

@router.get("/{policy_id}/episodes/by-tag/{tag_id}")
def get_episodes_by_tag(
    policy_id: int,
    tag_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_parent)
):
    from models import EpisodeTag, ContentTag
    
    policy = db.query(Policy).filter(Policy.id == policy_id).first()
    if not policy:
        raise HTTPException(status_code=404, detail="Policy not found")
    
    profile = db.query(KidProfile).filter(KidProfile.id == policy.kid_profile_id).first()
    if not profile or profile.parent_id != current_user.id:
        raise HTTPException(status_code=403, detail="Can only access your own kid's policies")
    
    tag = db.query(ContentTag).filter(ContentTag.id == tag_id).first()
    if not tag:
        raise HTTPException(status_code=404, detail="Tag not found")
    
    episode_tags = db.query(EpisodeTag).join(
        Episode, Episode.id == EpisodeTag.episode_id
    ).filter(
        Episode.title_id == policy.title_id,
        EpisodeTag.tag_id == tag_id
    ).all()
    
    episode_ids = [et.episode_id for et in episode_tags]
    episodes = db.query(Episode).filter(Episode.id.in_(episode_ids)).order_by(
        Episode.season_number, Episode.episode_number
    ).all()
    
    episode_policies_map = {}
    episode_policies = db.query(EpisodePolicy).filter(
        EpisodePolicy.policy_id == policy_id,
        EpisodePolicy.episode_id.in_(episode_ids)
    ).all()
    episode_policies_map = {ep.episode_id: ep.is_allowed for ep in episode_policies}
    
    result = []
    for episode in episodes:
        result.append({
            "id": episode.id,
            "season_number": episode.season_number,
            "episode_number": episode.episode_number,
            "episode_name": episode.episode_name,
            "is_blocked": not episode_policies_map.get(episode.id, True)
        })
    
    return {
        "tag_id": tag_id,
        "tag_name": tag.display_name,
        "episodes": result,
        "total_episodes": len(result)
    }

@router.post("/{policy_id}/episodes/block-by-tag/{tag_id}")
def block_episodes_by_tag(
    policy_id: int,
    tag_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_parent)
):
    from models import EpisodeTag, ContentTag
    
    policy = db.query(Policy).filter(Policy.id == policy_id).first()
    if not policy:
        raise HTTPException(status_code=404, detail="Policy not found")
    
    profile = db.query(KidProfile).filter(KidProfile.id == policy.kid_profile_id).first()
    if not profile or profile.parent_id != current_user.id:
        raise HTTPException(status_code=403, detail="Can only manage your own kid's policies")
    
    tag = db.query(ContentTag).filter(ContentTag.id == tag_id).first()
    if not tag:
        raise HTTPException(status_code=404, detail="Tag not found")
    
    episode_tags = db.query(EpisodeTag).join(
        Episode, Episode.id == EpisodeTag.episode_id
    ).filter(
        Episode.title_id == policy.title_id,
        EpisodeTag.tag_id == tag_id
    ).all()
    
    episode_ids = [et.episode_id for et in episode_tags]
    
    if not episode_ids:
        return {"message": "No episodes found with this tag", "episodes_blocked": 0}
    
    episodes_blocked = 0
    for episode_id in episode_ids:
        existing_ep_policy = db.query(EpisodePolicy).filter(
            EpisodePolicy.policy_id == policy_id,
            EpisodePolicy.episode_id == episode_id
        ).first()
        
        if not existing_ep_policy:
            new_ep_policy = EpisodePolicy(
                policy_id=policy_id,
                episode_id=episode_id,
                is_allowed=False
            )
            db.add(new_ep_policy)
            episodes_blocked += 1
        elif existing_ep_policy.is_allowed:
            existing_ep_policy.is_allowed = False
            episodes_blocked += 1
    
    db.commit()
    
    return {
        "message": f"Blocked {episodes_blocked} episodes with tag '{tag.display_name}'",
        "episodes_blocked": episodes_blocked,
        "tag_name": tag.display_name
    }
