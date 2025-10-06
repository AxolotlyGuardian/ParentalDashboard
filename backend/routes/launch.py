from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from db import get_db
from models import Policy, Title, KidProfile
from auth_utils import require_kid

router = APIRouter(prefix="/launch", tags=["launch"])

DEEP_LINK_TEMPLATES = {
    "netflix": "https://www.netflix.com/title/{tmdb_id}",
    "disney": "https://www.disneyplus.com/",
    "prime": "https://www.amazon.com/gp/video/detail/{tmdb_id}",
    "hulu": "https://www.hulu.com/",
    "peacock": "https://www.peacocktv.com/",
    "youtube": "https://www.youtube.com/results?search_query={title}"
}

FALLBACK_URLS = {
    "netflix": "https://www.netflix.com/",
    "disney": "https://www.disneyplus.com/",
    "prime": "https://www.amazon.com/Prime-Video/",
    "hulu": "https://www.hulu.com/",
    "peacock": "https://www.peacocktv.com/",
    "youtube": "https://www.youtube.com/"
}

class LaunchRequest(BaseModel):
    kid_profile_id: int
    title_id: int
    provider: str

class LaunchResponse(BaseModel):
    allowed: bool
    deep_link: str = None
    fallback_url: str = None
    message: str = None

@router.post("/check", response_model=LaunchResponse)
def check_launch_permission(
    request: LaunchRequest,
    db: Session = Depends(get_db),
    current_profile: KidProfile = Depends(require_kid)
):
    if current_profile.id != request.kid_profile_id:
        raise HTTPException(status_code=403, detail="Can only launch content for yourself")
    
    profile = db.query(KidProfile).filter(KidProfile.id == request.kid_profile_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    title = db.query(Title).filter(Title.id == request.title_id).first()
    if not title:
        raise HTTPException(status_code=404, detail="Title not found")
    
    policy = db.query(Policy).filter(
        Policy.kid_profile_id == request.kid_profile_id,
        Policy.title_id == request.title_id
    ).first()
    
    if not policy:
        return LaunchResponse(
            allowed=False,
            message=f"'{title.title}' is not in your allowed list. Ask a parent to add it!"
        )
    
    if not policy.is_allowed:
        return LaunchResponse(
            allowed=False,
            message=f"Sorry, '{title.title}' is blocked. Talk to your parent if you think this is a mistake."
        )
    
    # Try to get the deep link from stored TMDB data first
    deep_link = None
    if title.deep_links and isinstance(title.deep_links, dict):
        deep_link = title.deep_links.get(request.provider)
    
    # If no stored deep link, use fallback search URLs
    provider_lower = request.provider.lower()
    if not deep_link:
        fallback_search_urls = {
            "netflix": f"https://www.netflix.com/search?q={title.title.replace(' ', '+')}",
            "disney": f"https://www.disneyplus.com/search?q={title.title.replace(' ', '+')}",
            "prime": f"https://www.amazon.com/s?k={title.title.replace(' ', '+')}&i=instant-video",
            "hulu": f"https://www.hulu.com/search?q={title.title.replace(' ', '+')}",
            "peacock": f"https://www.peacocktv.com/search?q={title.title.replace(' ', '+')}",
            "youtube": f"https://www.youtube.com/results?search_query={title.title.replace(' ', '+')}"
        }
        deep_link = fallback_search_urls.get(provider_lower, f"https://www.google.com/search?q={title.title}+watch+online")
    
    fallback_url = FALLBACK_URLS.get(provider_lower, "https://google.com")
    
    return LaunchResponse(
        allowed=True,
        deep_link=deep_link,
        fallback_url=fallback_url,
        message=f"Enjoy watching '{title.title}'!"
    )

@router.get("/title/{title_id}/profile/{kid_profile_id}")
def get_title_status(
    title_id: int,
    kid_profile_id: int,
    db: Session = Depends(get_db),
    current_profile: KidProfile = Depends(require_kid)
):
    if current_profile.id != kid_profile_id:
        raise HTTPException(status_code=403, detail="Can only check status for yourself")
    
    policy = db.query(Policy).filter(
        Policy.kid_profile_id == kid_profile_id,
        Policy.title_id == title_id
    ).first()
    
    title = db.query(Title).filter(Title.id == title_id).first()
    if not title:
        raise HTTPException(status_code=404, detail="Title not found")
    
    return {
        "title_id": title_id,
        "kid_profile_id": kid_profile_id,
        "is_allowed": policy.is_allowed if policy else False,
        "has_policy": policy is not None
    }
