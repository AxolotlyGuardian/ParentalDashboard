from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from db import get_db
from models import Device, KidProfile, User, ContentReport, ContentTag, Title, Episode, EpisodeTag, FandomScrapeJob, FandomScrapeRun
from auth_utils import require_admin
from services.fandom_scraper import FandomScraper
from services.fandom_coordinator import FandomScrapeCoordinator
import asyncio

router = APIRouter(prefix="/api/admin", tags=["admin"])

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
                show_title=title.title,
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
