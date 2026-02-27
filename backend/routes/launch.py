from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from db import get_db
from models import Policy, Title, KidProfile, Episode, EpisodeLink
from auth_utils import require_kid

router = APIRouter(prefix="/launch", tags=["launch"])

# Map canonical provider keys (used in Title.providers / Title.deep_links)
# to their short aliases used in EpisodeLink and older references.
CANONICAL_TO_SHORT = {
    "netflix": "netflix",
    "disney_plus": "disney",
    "prime_video": "prime",
    "hulu": "hulu",
    "peacock": "peacock",
    "youtube": "youtube",
    "apple_tv_plus": "apple",
    "paramount_plus": "paramount",
    "max": "max",
    "tubi": "tubi",
    "crunchyroll": "crunchyroll",
    "pbs_kids": "pbs",
    "espn_plus": "espn",
    "curiosity_stream": "curiosity",
    "noggin": "noggin",
    "kidoodle_tv": "kidoodle",
}

SHORT_TO_CANONICAL = {v: k for k, v in CANONICAL_TO_SHORT.items()}

FALLBACK_URLS = {
    "netflix": "https://www.netflix.com/",
    "disney_plus": "https://www.disneyplus.com/",
    "prime_video": "https://www.amazon.com/Prime-Video/",
    "hulu": "https://www.hulu.com/",
    "peacock": "https://www.peacocktv.com/",
    "youtube": "https://www.youtube.com/",
    "apple_tv_plus": "https://tv.apple.com/",
    "paramount_plus": "https://www.paramountplus.com/",
    "max": "https://www.max.com/",
    "tubi": "https://tubitv.com/",
    "crunchyroll": "https://www.crunchyroll.com/",
    "pbs_kids": "https://pbskids.org/",
    "espn_plus": "https://plus.espn.com/",
    "curiosity_stream": "https://curiositystream.com/",
    "noggin": "https://www.noggin.com/",
    "kidoodle_tv": "https://www.kidoodle.tv/",
}

SEARCH_URL_TEMPLATES = {
    "netflix": "https://www.netflix.com/search?q={q}",
    "disney_plus": "https://www.disneyplus.com/search?q={q}",
    "prime_video": "https://www.amazon.com/s?k={q}&i=instant-video",
    "hulu": "https://www.hulu.com/search?q={q}",
    "peacock": "https://www.peacocktv.com/search?q={q}",
    "youtube": "https://www.youtube.com/results?search_query={q}",
    "apple_tv_plus": "https://tv.apple.com/search?term={q}",
    "paramount_plus": "https://www.paramountplus.com/search/?q={q}",
    "max": "https://www.max.com/search?q={q}",
    "tubi": "https://tubitv.com/search/{q}",
    "crunchyroll": "https://www.crunchyroll.com/search?q={q}",
}


def _normalize_provider(provider: str) -> str:
    """Normalize a provider string to its canonical key (e.g. 'disney' -> 'disney_plus')."""
    lower = provider.lower().strip()
    if lower in CANONICAL_TO_SHORT:
        return lower  # already canonical
    if lower in SHORT_TO_CANONICAL:
        return SHORT_TO_CANONICAL[lower]
    return lower


class LaunchRequest(BaseModel):
    kid_profile_id: int
    title_id: int
    provider: str
    season_number: Optional[int] = None
    episode_number: Optional[int] = None

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

    canonical = _normalize_provider(request.provider)
    short = CANONICAL_TO_SHORT.get(canonical, canonical)

    deep_link = None

    # --- For TV shows, try to get an episode-specific deep link first ---
    if title.media_type == "tv":
        season = request.season_number or 1
        episode = request.episode_number or 1

        ep = db.query(Episode).filter(
            Episode.title_id == title.id,
            Episode.season_number == season,
            Episode.episode_number == episode
        ).first()

        if ep:
            # Try both the canonical and short provider names to maximise matches
            ep_link = db.query(EpisodeLink).filter(
                EpisodeLink.episode_id == ep.id,
                EpisodeLink.is_active == True,
                EpisodeLink.provider.in_([canonical, short])
            ).order_by(EpisodeLink.confidence_score.desc()).first()

            if ep_link:
                deep_link = ep_link.deep_link_url

    # --- Fall back to title-level deep links (works for movies and TV) ---
    if not deep_link and title.deep_links and isinstance(title.deep_links, dict):
        # Try canonical key first, then short alias
        deep_link = title.deep_links.get(canonical) or title.deep_links.get(short)

    # --- Fall back to provider search URL ---
    if not deep_link:
        q = title.title.replace(' ', '+')
        template = SEARCH_URL_TEMPLATES.get(canonical)
        if template:
            deep_link = template.format(q=q)
        else:
            deep_link = f"https://www.google.com/search?q={q}+watch+online"

    fallback_url = FALLBACK_URLS.get(canonical, "https://google.com")

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
