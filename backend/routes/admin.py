from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from db import get_db
from models import Device, KidProfile, User, ContentReport, ContentTag, Title, Episode, EpisodeTag
from auth_utils import require_admin
from services.fandom_scraper import FandomScraper

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
