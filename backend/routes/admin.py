from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
import logging
from db import get_db, SessionLocal
from models import Device, KidProfile, User, ContentReport, ContentTag, Title, Episode, EpisodeTag, FandomScrapeJob, FandomScrapeRun, FandomEpisodeLink, EpisodeLink, Policy, TitleTag
from auth_utils import require_admin
from services.fandom_scraper import FandomScraper
from services.fandom_coordinator import FandomScrapeCoordinator
from services.enhanced_fandom_scraper import EnhancedFandomScraper
import asyncio

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/admin", tags=["admin"])

class DeviceResponse(BaseModel):
    id: int
    device_id: str
    device_name: str
    kid_profile_id: Optional[int]
    kid_name: Optional[str]
    kid_age: Optional[int]
    parent_email: Optional[str]
    parent_id: Optional[int]
    created_at: Optional[str]
    last_active: Optional[str]

@router.get("/devices", response_model=List[DeviceResponse])
def get_all_devices(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    devices = db.query(Device).all()
    
    result = []
    for device in devices:
        kid_profile = db.query(KidProfile).filter(KidProfile.id == device.kid_profile_id).first() if device.kid_profile_id else None
        parent = db.query(User).filter(User.id == kid_profile.parent_id).first() if kid_profile else None
        
        result.append(DeviceResponse(
            id=device.id,
            device_id=device.device_id,
            device_name=device.device_name,
            kid_profile_id=device.kid_profile_id,
            kid_name=kid_profile.name if kid_profile else None,
            kid_age=kid_profile.age if kid_profile else None,
            parent_email=parent.email if parent else None,
            parent_id=parent.id if parent else None,
            created_at=device.created_at.isoformat() if device.created_at else None,
            last_active=device.last_active.isoformat() if device.last_active else None
        ))
    
    return result

class FandomScrapeRequest(BaseModel):
    wiki_name: str
    category: str
    confidence: Optional[float] = 0.8

class FandomScrapeResponse(BaseModel):
    success: bool
    error: Optional[str] = None
    tag: Optional[str] = None
    category: Optional[str] = None
    total_pages: Optional[int] = None
    episodes_found: Optional[int] = None
    episodes_tagged: Optional[int] = None
    episodes_already_tagged: Optional[int] = None
    episodes_not_in_db: Optional[int] = None
    failed_parses: Optional[int] = None

@router.post("/fandom/scrape", response_model=FandomScrapeResponse)
def scrape_fandom_category(
    request: FandomScrapeRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    scraper = FandomScraper(db)
    results = scraper.scrape_and_tag_episodes(
        wiki_name=request.wiki_name,
        category=request.category,
        confidence=request.confidence
    )
    
    return FandomScrapeResponse(**results)

class EpisodeTagResponse(BaseModel):
    id: int
    episode_id: int
    episode_name: Optional[str]
    season_number: int
    episode_number: int
    show_title: str
    tag_id: int
    tag_name: str
    tag_slug: str
    source: str
    confidence: float
    created_at: str

@router.get("/episode-tags", response_model=List[EpisodeTagResponse])
def get_all_episode_tags(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    episode_tags = db.query(EpisodeTag).offset(skip).limit(limit).all()
    
    result = []
    for et in episode_tags:
        episode = db.query(Episode).filter(Episode.id == et.episode_id).first()
        tag = db.query(ContentTag).filter(ContentTag.id == et.tag_id).first()
        title = db.query(Title).filter(Title.id == episode.title_id).first() if episode else None
        
        if episode and tag and title:
            result.append(EpisodeTagResponse(
                id=et.id,
                episode_id=et.episode_id,
                episode_name=episode.episode_name,
                season_number=episode.season_number,
                episode_number=episode.episode_number,
                show_title=str(title.title) if title and hasattr(title, 'title') else "Unknown",
                tag_id=et.tag_id,
                tag_name=tag.display_name,
                tag_slug=tag.slug,
                source=et.source,
                confidence=et.confidence,
                created_at=et.created_at.isoformat()
            ))
    
    return result

class CreateScrapeJobRequest(BaseModel):
    title_ids: Optional[List[int]] = None
    tag_ids: Optional[List[int]] = None
    force_rescrape: bool = False

class ScrapeJobResponse(BaseModel):
    id: int
    status: str
    total_titles: int
    total_tags: int
    processed_count: int
    success_count: int
    failed_count: int
    episodes_tagged: int
    error_message: Optional[str] = None
    started_at: Optional[str] = None
    completed_at: Optional[str] = None
    created_at: str

async def run_scrape_job_async(job_id: int):
    from db import SessionLocal
    db = SessionLocal()
    try:
        coordinator = FandomScrapeCoordinator(db)
        await coordinator.execute_job(job_id)
    finally:
        db.close()

@router.post("/fandom-scrape/jobs", response_model=ScrapeJobResponse)
async def create_scrape_job(
    request: CreateScrapeJobRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    coordinator = FandomScrapeCoordinator(db)
    job = await coordinator.create_scrape_job(
        user_id=current_user.id,
        title_ids=request.title_ids,
        tag_ids=request.tag_ids,
        force_rescrape=request.force_rescrape
    )
    
    background_tasks.add_task(run_scrape_job_async, job.id)
    
    return ScrapeJobResponse(
        id=job.id,
        status=job.status,
        total_titles=job.total_titles,
        total_tags=job.total_tags,
        processed_count=job.processed_count,
        success_count=job.success_count,
        failed_count=job.failed_count,
        episodes_tagged=job.episodes_tagged,
        error_message=job.error_message,
        started_at=job.started_at.isoformat() if job.started_at else None,
        completed_at=job.completed_at.isoformat() if job.completed_at else None,
        created_at=job.created_at.isoformat()
    )

@router.get("/fandom-scrape/jobs/{job_id}", response_model=ScrapeJobResponse)
def get_scrape_job(
    job_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    job = db.query(FandomScrapeJob).filter(FandomScrapeJob.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    return ScrapeJobResponse(
        id=job.id,
        status=job.status,
        total_titles=job.total_titles,
        total_tags=job.total_tags,
        processed_count=job.processed_count,
        success_count=job.success_count,
        failed_count=job.failed_count,
        episodes_tagged=job.episodes_tagged,
        error_message=job.error_message,
        started_at=job.started_at.isoformat() if job.started_at else None,
        completed_at=job.completed_at.isoformat() if job.completed_at else None,
        created_at=job.created_at.isoformat()
    )

@router.get("/fandom-scrape/jobs", response_model=List[ScrapeJobResponse])
def list_scrape_jobs(
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    jobs = db.query(FandomScrapeJob).order_by(FandomScrapeJob.created_at.desc()).offset(skip).limit(limit).all()
    
    return [ScrapeJobResponse(
        id=job.id,
        status=job.status,
        total_titles=job.total_titles,
        total_tags=job.total_tags,
        processed_count=job.processed_count,
        success_count=job.success_count,
        failed_count=job.failed_count,
        episodes_tagged=job.episodes_tagged,
        error_message=job.error_message,
        started_at=job.started_at.isoformat() if job.started_at else None,
        completed_at=job.completed_at.isoformat() if job.completed_at else None,
        created_at=job.created_at.isoformat()
    ) for job in jobs]

@router.post("/titles/load-all-episodes")
def load_all_episodes(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Load episodes from TMDB for all TV shows that have policies"""
    from config import settings
    import httpx
    
    if not settings.TMDB_API_KEY:
        raise HTTPException(status_code=500, detail="TMDB API key not configured")
    
    # Get all TV titles that have policies
    from sqlalchemy import distinct
    title_ids = db.query(distinct(Policy.title_id)).join(
        Title, Policy.title_id == Title.id
    ).filter(
        Title.media_type == "tv"
    ).all()
    
    title_ids = [tid[0] for tid in title_ids]
    titles_with_policies = db.query(Title).filter(Title.id.in_(title_ids)).all()
    
    results = []
    
    for title in titles_with_policies:
        try:
            # Check if episodes already loaded
            existing_count = db.query(Episode).filter(Episode.title_id == title.id).count()
            if existing_count > 0:
                results.append({
                    "title_id": title.id,
                    "title_name": str(title.title) if title and hasattr(title, 'title') else "Unknown",
                    "status": "skipped",
                    "message": f"Already has {existing_count} episodes"
                })
                continue
            
            # Load episodes
            tv_url = f"{settings.TMDB_API_BASE_URL}/tv/{title.tmdb_id}"
            tv_params = {"api_key": settings.TMDB_API_KEY}
            
            with httpx.Client() as client:
                tv_response = client.get(tv_url, params=tv_params, timeout=10)
                if tv_response.status_code != 200:
                    results.append({
                        "title_id": title.id,
                        "title_name": str(title.title) if title and hasattr(title, 'title') else "Unknown",
                        "status": "error",
                        "message": f"TMDB request failed: {tv_response.status_code}"
                    })
                    continue
                
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
                
                results.append({
                    "title_id": title.id,
                    "title_name": str(title.title) if title and hasattr(title, 'title') else "Unknown",
                    "status": "success",
                    "seasons_loaded": num_seasons,
                    "episodes_loaded": episodes_loaded,
                    "message": f"Loaded {episodes_loaded} episodes across {num_seasons} seasons"
                })
        
        except Exception as e:
            db.rollback()
            results.append({
                "title_id": title.id,
                "title_name": str(title.title) if title and hasattr(title, 'title') else "Unknown",
                "status": "error",
                "message": str(e)
            })
    
    return {
        "success": True,
        "total_shows_processed": len(results),
        "results": results
    }

@router.post("/titles/{title_id}/load-episodes")
def load_title_episodes(
    title_id: int,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Load episodes from TMDB for a TV show"""
    from config import settings
    import httpx
    
    title = db.query(Title).filter(Title.id == title_id).first()
    if not title:
        raise HTTPException(status_code=404, detail="Title not found")
    
    if title.media_type != "tv":
        raise HTTPException(status_code=400, detail="Only TV shows have episodes")
    
    if not title.tmdb_id:
        raise HTTPException(status_code=400, detail="Title has no TMDB ID")
    
    if not settings.TMDB_API_KEY:
        raise HTTPException(status_code=500, detail="TMDB API key not configured")
    
    try:
        # First, get TV show details to get number of seasons
        tv_url = f"{settings.TMDB_API_BASE_URL}/tv/{title.tmdb_id}"
        tv_params = {"api_key": settings.TMDB_API_KEY}
        
        with httpx.Client() as client:
            tv_response = client.get(tv_url, params=tv_params, timeout=10)
            if tv_response.status_code != 200:
                raise HTTPException(status_code=tv_response.status_code, detail="Failed to fetch TV show details from TMDB")
            
            tv_data = tv_response.json()
            num_seasons = tv_data.get("number_of_seasons", 0)
            num_episodes = tv_data.get("number_of_episodes", 0)
            
            # Update title with season/episode counts
            title.number_of_seasons = num_seasons
            title.number_of_episodes = num_episodes
            db.commit()
            
            episodes_loaded = 0
            
            # Load each season's episodes
            for season_num in range(1, num_seasons + 1):
                season_url = f"{settings.TMDB_API_BASE_URL}/tv/{title.tmdb_id}/season/{season_num}"
                season_response = client.get(season_url, params=tv_params, timeout=10)
                
                if season_response.status_code != 200:
                    logger.warning("Failed to fetch season %d for %s", season_num, title.title)
                    continue
                
                season_data = season_response.json()
                
                for episode_data in season_data.get("episodes", []):
                    tmdb_episode_id = episode_data.get("id")
                    
                    # Check if episode already exists
                    existing = db.query(Episode).filter(Episode.tmdb_episode_id == tmdb_episode_id).first()
                    if existing:
                        continue
                    
                    # Create new episode
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
            
            title_name_str = str(title.title) if title and hasattr(title, 'title') else "Unknown"
            return {
                "success": True,
                "title_id": title.id,
                "title_name": title_name_str,
                "seasons_loaded": num_seasons,
                "episodes_loaded": episodes_loaded,
                "total_episodes": num_episodes,
                "message": f"Loaded {episodes_loaded} episodes across {num_seasons} seasons for {title_name_str}"
            }
    
    except httpx.RequestError as e:
        raise HTTPException(status_code=500, detail=f"TMDB API request failed: {str(e)}")
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to load episodes: {str(e)}")

# Enhanced Fandom Scraping Endpoints

class EnhancedScrapeRequest(BaseModel):
    title_id: int
    tag_filter: Optional[List[int]] = None
    rate_limit_delay: Optional[float] = 0.5

class EnhancedScrapeResponse(BaseModel):
    success: bool
    error: Optional[str] = None
    wiki_slug: Optional[str] = None
    episodes_found: Optional[int] = None
    episodes_matched: Optional[int] = None
    episodes_tagged: Optional[int] = None
    tags_added: Optional[int] = None

@router.post("/fandom/enhanced-scrape", response_model=EnhancedScrapeResponse)
def run_enhanced_scrape(
    request: EnhancedScrapeRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """
    Run enhanced Fandom scraping for a specific title
    Uses multiple search strategies to find and tag episodes
    """
    try:
        scraper = EnhancedFandomScraper(db, rate_limit_delay=request.rate_limit_delay)
        result = scraper.scrape_show_episodes(
            title_id=request.title_id,
            tag_filter=request.tag_filter
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Enhanced scraping failed: {str(e)}")

class StreamingEpisodeLinkResponse(BaseModel):
    id: int
    title_name: Optional[str]
    season: Optional[int]
    episode: Optional[int]
    episode_title: Optional[str]
    provider: str
    deep_link_url: str
    source: str
    confidence_score: float
    confirmed_count: int
    motn_verified: bool
    motn_quality_score: Optional[float]
    custom_tags: Optional[str]
    first_seen_at: str
    last_confirmed_at: str
    last_enriched_at: Optional[str]

@router.get("/episode-links", response_model=List[StreamingEpisodeLinkResponse])
def get_streaming_episode_links(
    skip: int = 0,
    limit: int = 50,
    provider: Optional[str] = None,
    verified_only: bool = False,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """
    Get Movie of the Night streaming deep links
    Shows verified episode-level deep links from streaming providers
    """
    query = db.query(EpisodeLink).join(
        Episode, EpisodeLink.episode_id == Episode.id
    ).join(
        Title, Episode.title_id == Title.id
    )
    
    if verified_only:
        query = query.filter(EpisodeLink.motn_verified == True)
    
    if provider:
        query = query.filter(EpisodeLink.provider == provider)
    
    links = query.order_by(EpisodeLink.id.desc()).offset(skip).limit(limit).all()
    
    result = []
    for link in links:
        episode = db.query(Episode).filter(Episode.id == link.episode_id).first()
        title = db.query(Title).filter(Title.id == episode.title_id).first() if episode else None
        
        # Ensure title_name is always a string, never an object
        title_name_str = str(title.title) if title and hasattr(title, 'title') else None
        
        result.append(StreamingEpisodeLinkResponse(
            id=link.id,
            title_name=title_name_str,
            season=episode.season_number if episode else None,
            episode=episode.episode_number if episode else None,
            episode_title=episode.episode_name if episode else None,
            provider=link.provider,
            deep_link_url=link.deep_link_url,
            source=link.source,
            confidence_score=link.confidence_score or 0.0,
            confirmed_count=link.confirmed_count or 0,
            motn_verified=link.motn_verified or False,
            motn_quality_score=link.motn_quality_score,
            custom_tags=link.custom_tags,
            first_seen_at=link.first_seen_at.isoformat() if link.first_seen_at else "",
            last_confirmed_at=link.last_confirmed_at.isoformat() if link.last_confirmed_at else "",
            last_enriched_at=link.last_enriched_at.isoformat() if link.last_enriched_at else None
        ))
    
    return result

class FandomEpisodeLinkResponse(BaseModel):
    id: int
    title_name: str
    season_number: int
    episode_number: int
    episode_name: Optional[str]
    fandom_page_title: str
    fandom_url: Optional[str]
    confidence: float
    matching_method: Optional[str]
    created_at: str

@router.get("/fandom/episode-links/{title_id}", response_model=List[FandomEpisodeLinkResponse])
def get_fandom_episode_links(
    title_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """
    Get all Fandom episode links for a title
    Shows how Fandom episodes were matched to TMDB episodes
    """
    links = db.query(FandomEpisodeLink).filter(
        FandomEpisodeLink.title_id == title_id
    ).all()
    
    result = []
    for link in links:
        title = db.query(Title).filter(Title.id == link.title_id).first()
        episode = db.query(Episode).filter(Episode.id == link.episode_id).first() if link.episode_id else None
        
        result.append(FandomEpisodeLinkResponse(
            id=link.id,
            title_name=str(title.title) if title and hasattr(title, 'title') else "Unknown",
            season_number=link.season_number,
            episode_number=link.episode_number,
            episode_name=episode.episode_name if episode else None,
            fandom_page_title=link.fandom_page_title,
            fandom_url=link.fandom_url,
            confidence=link.confidence,
            matching_method=link.matching_method,
            created_at=link.created_at.isoformat() if link.created_at else ""
        ))
    
    return result

class EpisodeTagWithProvenanceResponse(BaseModel):
    id: int
    episode_id: int
    episode_name: Optional[str]
    season_number: int
    episode_number: int
    tag_name: str
    tag_slug: str
    tag_category: str
    source: str
    confidence: float
    source_url: Optional[str]
    extraction_method: Optional[str]
    created_at: str

@router.get("/fandom/episode-tags/{title_id}", response_model=List[EpisodeTagWithProvenanceResponse])
def get_episode_tags_with_provenance(
    title_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """
    Get all episode tags with provenance information for a title
    Shows which episodes have which tags and where the tags came from
    """
    episode_tags = db.query(EpisodeTag).join(
        Episode, EpisodeTag.episode_id == Episode.id
    ).filter(
        Episode.title_id == title_id
    ).all()
    
    result = []
    for episode_tag in episode_tags:
        episode = db.query(Episode).filter(Episode.id == episode_tag.episode_id).first()
        tag = db.query(ContentTag).filter(ContentTag.id == episode_tag.tag_id).first()
        
        if episode and tag:
            result.append(EpisodeTagWithProvenanceResponse(
                id=episode_tag.id,
                episode_id=episode.id,
                episode_name=episode.episode_name,
                season_number=episode.season_number,
                episode_number=episode.episode_number,
                tag_name=tag.display_name,
                tag_slug=tag.slug,
                tag_category=tag.category,
                source=episode_tag.source,
                confidence=episode_tag.confidence,
                source_url=episode_tag.source_url,
                extraction_method=episode_tag.extraction_method,
                created_at=episode_tag.created_at.isoformat() if episode_tag.created_at else ""
            ))
    
    return result

class ScrapeStatsResponse(BaseModel):
    title_name: str
    total_episodes: int
    matched_episodes: int
    tagged_episodes: int
    total_tags: int
    match_rate: float
    tag_rate: float

@router.get("/fandom/scrape-stats/{title_id}", response_model=ScrapeStatsResponse)
def get_scrape_stats(
    title_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """
    Get scraping statistics for a title
    Shows overall progress and success rates
    """
    title = db.query(Title).filter(Title.id == title_id).first()
    if not title:
        raise HTTPException(status_code=404, detail="Title not found")
    
    total_episodes = db.query(Episode).filter(Episode.title_id == title_id).count()
    
    matched_episodes = db.query(FandomEpisodeLink).filter(
        FandomEpisodeLink.title_id == title_id,
        FandomEpisodeLink.episode_id.isnot(None)
    ).count()
    
    tagged_episode_ids = db.query(EpisodeTag.episode_id).join(
        Episode, EpisodeTag.episode_id == Episode.id
    ).filter(
        Episode.title_id == title_id
    ).distinct().all()
    
    tagged_episodes = len(tagged_episode_ids)
    
    total_tags = db.query(EpisodeTag).join(
        Episode, EpisodeTag.episode_id == Episode.id
    ).filter(
        Episode.title_id == title_id
    ).count()
    
    match_rate = (matched_episodes / total_episodes * 100) if total_episodes > 0 else 0
    tag_rate = (tagged_episodes / total_episodes * 100) if total_episodes > 0 else 0
    
    return ScrapeStatsResponse(
        title_name=str(title.title) if title and hasattr(title, 'title') else "Unknown",
        total_episodes=total_episodes,
        matched_episodes=matched_episodes,
        tagged_episodes=tagged_episodes,
        total_tags=total_tags,
        match_rate=round(match_rate, 2),
        tag_rate=round(tag_rate, 2)
    )

class BackfillResultResponse(BaseModel):
    success: bool
    message: str
    processed: int
    added: int
    skipped: int
    failed: int

@router.post("/backfill-episode-links", response_model=BackfillResultResponse)
def backfill_episode_links(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """
    Admin endpoint to backfill episode 1 deep links for all TV titles
    Fetches deep links from Movie of the Night API
    """
    from services.movie_api import MovieAPIClient
    from sqlalchemy import func
    import time
    
    movie_api = MovieAPIClient()
    
    tv_titles = db.query(Title).filter(Title.media_type == 'tv').all()
    
    processed = 0
    skipped = 0
    added = 0
    failed = 0
    
    for title in tv_titles:
        episode_1 = db.query(Episode).filter(
            Episode.title_id == title.id,
            Episode.season_number == 1,
            Episode.episode_number == 1
        ).first()
        
        if not episode_1:
            skipped += 1
            processed += 1
            continue
        
        existing_links_count = db.query(func.count(EpisodeLink.id)).filter(
            EpisodeLink.episode_id == episode_1.id,
            EpisodeLink.source == 'motn_api'
        ).scalar()
        
        if existing_links_count > 0:
            skipped += 1
            processed += 1
            continue
        
        providers = ['disney', 'netflix', 'hulu', 'prime', 'peacock']
        links_added = 0
        
        for provider in providers:
            try:
                deep_link = movie_api.get_episode_deep_link(
                    title.tmdb_id,
                    season=1,
                    episode=1,
                    provider=provider
                )
                
                if deep_link:
                    episode_link = EpisodeLink(
                        episode_id=episode_1.id,
                        raw_provider=provider,
                        provider=provider,
                        deep_link_url=deep_link,
                        source='motn_api',
                        confidence_score=1.0,
                        motn_verified=True,
                        is_active=True
                    )
                    db.add(episode_link)
                    links_added += 1
                
                time.sleep(0.2)
                
            except Exception as e:
                logger.error("Error fetching %s for %s: %s", provider, title.title, e)
        
        if links_added > 0:
            db.commit()
            added += links_added
        else:
            failed += 1
        
        processed += 1
        time.sleep(0.5)
    
    return BackfillResultResponse(
        success=True,
        message=f"Backfill complete: {added} links added for {processed} titles",
        processed=processed,
        added=added,
        skipped=skipped,
        failed=failed
    )
