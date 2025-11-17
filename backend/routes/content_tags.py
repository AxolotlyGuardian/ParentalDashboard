from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

from db import get_db
from models import ContentTag, TitleTag, ContentReport, Title, User
from auth_utils import get_current_user, require_admin, require_parent

router = APIRouter()

class TagResponse(BaseModel):
    id: int
    category: str
    slug: str
    display_name: str
    description: Optional[str]
    
    class Config:
        from_attributes = True

class TagCreateRequest(BaseModel):
    category: str
    slug: str
    display_name: str
    description: Optional[str] = None

class TagUpdateRequest(BaseModel):
    category: Optional[str] = None
    slug: Optional[str] = None
    display_name: Optional[str] = None
    description: Optional[str] = None

class ContentReportRequest(BaseModel):
    title_id: int
    tag_id: int
    season_number: Optional[int] = None
    episode_number: Optional[int] = None
    notes: Optional[str] = None

class ContentReportResponse(BaseModel):
    id: int
    title_id: int
    title_name: str
    tag_name: str
    tag_category: str
    season_number: Optional[int]
    episode_number: Optional[int]
    notes: Optional[str]
    status: str
    reported_by_email: str
    created_at: datetime
    reviewed_at: Optional[datetime]
    
    class Config:
        from_attributes = True

@router.get("/tags", response_model=List[TagResponse])
def get_tags(
    category: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(ContentTag)
    
    if category:
        query = query.filter(ContentTag.category == category)
    
    tags = query.order_by(ContentTag.category, ContentTag.display_name).all()
    return tags

@router.get("/tags/categories")
def get_tag_categories(db: Session = Depends(get_db)):
    categories = db.query(ContentTag.category).distinct().all()
    return [{"category": cat[0]} for cat in categories]

@router.post("/tags", response_model=TagResponse)
def create_tag(
    tag: TagCreateRequest,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    existing_tag = db.query(ContentTag).filter(ContentTag.slug == tag.slug).first()
    if existing_tag:
        raise HTTPException(status_code=400, detail="Tag with this slug already exists")
    
    new_tag = ContentTag(
        category=tag.category,
        slug=tag.slug,
        display_name=tag.display_name,
        description=tag.description
    )
    
    db.add(new_tag)
    db.commit()
    db.refresh(new_tag)
    
    return new_tag

@router.put("/tags/{tag_id}", response_model=TagResponse)
def update_tag(
    tag_id: int,
    tag: TagUpdateRequest,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    existing_tag = db.query(ContentTag).filter(ContentTag.id == tag_id).first()
    if not existing_tag:
        raise HTTPException(status_code=404, detail="Tag not found")
    
    if tag.category is not None:
        existing_tag.category = tag.category
    if tag.slug is not None:
        slug_check = db.query(ContentTag).filter(
            ContentTag.slug == tag.slug,
            ContentTag.id != tag_id
        ).first()
        if slug_check:
            raise HTTPException(status_code=400, detail="Tag with this slug already exists")
        existing_tag.slug = tag.slug
    if tag.display_name is not None:
        existing_tag.display_name = tag.display_name
    if tag.description is not None:
        existing_tag.description = tag.description
    
    db.commit()
    db.refresh(existing_tag)
    
    return existing_tag

@router.delete("/tags/{tag_id}")
def delete_tag(
    tag_id: int,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    tag = db.query(ContentTag).filter(ContentTag.id == tag_id).first()
    if not tag:
        raise HTTPException(status_code=404, detail="Tag not found")
    
    title_tags_count = db.query(TitleTag).filter(TitleTag.tag_id == tag_id).count()
    if title_tags_count > 0:
        raise HTTPException(
            status_code=400, 
            detail=f"Cannot delete tag. It is currently applied to {title_tags_count} title(s)."
        )
    
    db.delete(tag)
    db.commit()
    
    return {"message": "Tag deleted successfully", "tag_id": tag_id}

@router.post("/content-reports", response_model=ContentReportResponse)
def create_content_report(
    report: ContentReportRequest,
    current_user: User = Depends(require_parent),
    db: Session = Depends(get_db)
):
    title = db.query(Title).filter(Title.id == report.title_id).first()
    if not title:
        raise HTTPException(status_code=404, detail="Title not found")
    
    tag = db.query(ContentTag).filter(ContentTag.id == report.tag_id).first()
    if not tag:
        raise HTTPException(status_code=404, detail="Tag not found")
    
    content_report = ContentReport(
        title_id=report.title_id,
        reported_by=current_user.id,
        tag_id=report.tag_id,
        season_number=report.season_number,
        episode_number=report.episode_number,
        notes=report.notes,
        status="pending"
    )
    
    db.add(content_report)
    db.commit()
    db.refresh(content_report)
    
    return ContentReportResponse(
        id=content_report.id,
        title_id=content_report.title_id,
        title_name=title.title,
        tag_name=tag.display_name,
        tag_category=tag.category,
        season_number=content_report.season_number,
        episode_number=content_report.episode_number,
        notes=content_report.notes,
        status=content_report.status,
        reported_by_email=current_user.email,
        created_at=content_report.created_at,
        reviewed_at=content_report.reviewed_at
    )

@router.get("/content-reports", response_model=List[ContentReportResponse])
def get_content_reports(
    status: Optional[str] = None,
    current_user: User = Depends(require_parent),
    db: Session = Depends(get_db)
):
    query = db.query(ContentReport)
    
    # Non-admin parents can only see their own reports
    if not current_user.is_admin:
        query = query.filter(ContentReport.reported_by == current_user.id)
    
    if status:
        query = query.filter(ContentReport.status == status)
    
    reports = query.order_by(ContentReport.created_at.desc()).all()
    
    result = []
    for report in reports:
        title = db.query(Title).filter(Title.id == report.title_id).first()
        tag = db.query(ContentTag).filter(ContentTag.id == report.tag_id).first()
        reporter = db.query(User).filter(User.id == report.reported_by).first()
        
        result.append(ContentReportResponse(
            id=report.id,
            title_id=report.title_id,
            title_name=title.title if title else "Unknown",
            tag_name=tag.display_name if tag else "Unknown",
            tag_category=tag.category if tag else "Unknown",
            season_number=report.season_number,
            episode_number=report.episode_number,
            notes=report.notes,
            status=report.status,
            reported_by_email=reporter.email if reporter else "Unknown",
            created_at=report.created_at,
            reviewed_at=report.reviewed_at
        ))
    
    return result

@router.get("/content-reports/admin", response_model=List[ContentReportResponse])
def get_content_reports_admin(
    status: Optional[str] = None,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    return get_content_reports(status, current_user, db)

@router.patch("/content-reports/{report_id}/approve")
def approve_content_report(
    report_id: int,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    Admin-only endpoint: Approve content report and apply tag to title.
    """
    report = db.query(ContentReport).filter(ContentReport.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    
    if report.status != "pending":
        raise HTTPException(status_code=400, detail="Report already processed")
    
    if report.reported_by == current_user.id:
        raise HTTPException(
            status_code=403, 
            detail="You cannot approve your own content reports"
        )
    
    existing_tag = db.query(TitleTag).filter(
        TitleTag.title_id == report.title_id,
        TitleTag.tag_id == report.tag_id
    ).first()
    
    if not existing_tag:
        title_tag = TitleTag(
            title_id=report.title_id,
            tag_id=report.tag_id,
            source="user_report",
            confidence=1.0
        )
        db.add(title_tag)
    
    report.status = "approved"
    report.reviewed_by = current_user.id
    report.reviewed_at = datetime.utcnow()
    
    db.commit()
    
    return {"message": "Report approved and tag applied", "report_id": report_id}

@router.patch("/content-reports/{report_id}/reject")
def reject_content_report(
    report_id: int,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    Admin-only endpoint: Reject content report without applying tag.
    """
    report = db.query(ContentReport).filter(ContentReport.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    
    if report.status != "pending":
        raise HTTPException(status_code=400, detail="Report already processed")
    
    if report.reported_by == current_user.id:
        raise HTTPException(
            status_code=403, 
            detail="You cannot reject your own content reports"
        )
    
    report.status = "rejected"
    report.reviewed_by = current_user.id
    report.reviewed_at = datetime.utcnow()
    
    db.commit()
    
    return {"message": "Report rejected", "report_id": report_id}

@router.get("/titles/{title_id}/tags", response_model=List[TagResponse])
def get_title_tags(
    title_id: int,
    db: Session = Depends(get_db)
):
    from models import Episode, EpisodeTag
    
    tag_ids = set()
    tags = []
    
    title_tags = db.query(TitleTag).filter(TitleTag.title_id == title_id).all()
    for title_tag in title_tags:
        tag_ids.add(title_tag.tag_id)
    
    episode_tags = db.query(EpisodeTag).join(
        Episode, Episode.id == EpisodeTag.episode_id
    ).filter(
        Episode.title_id == title_id
    ).distinct(EpisodeTag.tag_id).all()
    
    for episode_tag in episode_tags:
        tag_ids.add(episode_tag.tag_id)
    
    for tag_id in tag_ids:
        tag = db.query(ContentTag).filter(ContentTag.id == tag_id).first()
        if tag:
            tags.append(tag)
    
    return tags
