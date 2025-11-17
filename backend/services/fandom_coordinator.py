import asyncio
import time
from typing import List, Optional, Dict
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import and_
from models import (
    Title, ContentTag, FandomScrapeJob, FandomScrapeRun, 
    TitleTagScrapeState, FandomTagSource, User
)
from services.fandom_scraper import FandomScraper

class FandomScrapeCoordinator:
    
    def __init__(self, db: Session):
        self.db = db
        self.scraper = FandomScraper(db)
        self.rate_limit_delay = 0.5
        self.max_concurrent = 2
    
    async def create_scrape_job(
        self,
        user_id: int,
        title_ids: Optional[List[int]] = None,
        tag_ids: Optional[List[int]] = None,
        force_rescrape: bool = False
    ) -> FandomScrapeJob:
        eligible_titles = self._get_eligible_titles(title_ids)
        eligible_tags = self._get_eligible_tags(tag_ids)
        
        job = FandomScrapeJob(
            created_by=user_id,
            status="pending",
            title_filter=title_ids,
            tag_filter=tag_ids,
            force_rescrape=force_rescrape,
            total_titles=len(eligible_titles),
            total_tags=len(eligible_tags)
        )
        self.db.add(job)
        self.db.commit()
        self.db.refresh(job)
        
        for title in eligible_titles:
            for tag in eligible_tags:
                run = FandomScrapeRun(
                    job_id=job.id,
                    title_id=title.id,
                    tag_id=tag.id,
                    status="pending"
                )
                self.db.add(run)
        
        self.db.commit()
        return job
    
    def _get_eligible_titles(self, title_ids: Optional[List[int]] = None) -> List[Title]:
        query = self.db.query(Title).filter(
            Title.media_type == 'tv',
            Title.number_of_episodes.isnot(None),
            Title.number_of_episodes > 0
        )
        
        if title_ids:
            query = query.filter(Title.id.in_(title_ids))
        
        return query.all()
    
    def _get_eligible_tags(self, tag_ids: Optional[List[int]] = None) -> List[ContentTag]:
        subquery = self.db.query(FandomTagSource.tag_id).filter(
            FandomTagSource.is_active == True
        ).distinct()
        
        query = self.db.query(ContentTag).filter(
            ContentTag.id.in_(subquery)
        )
        
        if tag_ids:
            query = query.filter(ContentTag.id.in_(tag_ids))
        
        return query.all()
    
    async def execute_job(self, job_id: int) -> Dict:
        job = self.db.query(FandomScrapeJob).filter(FandomScrapeJob.id == job_id).first()
        if not job:
            return {"error": "Job not found"}
        
        job.status = "running"
        job.started_at = datetime.utcnow()
        self.db.commit()
        
        try:
            runs = self.db.query(FandomScrapeRun).filter(
                FandomScrapeRun.job_id == job_id,
                FandomScrapeRun.status == "pending"
            ).all()
            
            total_runs = len(runs)
            processed = 0
            success = 0
            failed = 0
            total_episodes_tagged = 0
            
            for run in runs:
                should_skip = await self._should_skip_run(run, job.force_rescrape)
                
                if should_skip:
                    run.status = "skipped"
                    run.completed_at = datetime.utcnow()
                    processed += 1
                    self.db.commit()
                    continue
                
                result = await self._execute_run(run)
                
                if result.get('success'):
                    success += 1
                    total_episodes_tagged += result.get('episodes_tagged', 0)
                else:
                    failed += 1
                
                processed += 1
                
                job.processed_count = processed
                job.success_count = success
                job.failed_count = failed
                job.episodes_tagged = total_episodes_tagged
                self.db.commit()
                
                await asyncio.sleep(self.rate_limit_delay)
            
            job.status = "completed"
            job.completed_at = datetime.utcnow()
            self.db.commit()
            
            return {
                "success": True,
                "job_id": job_id,
                "total_runs": total_runs,
                "processed": processed,
                "success_count": success,
                "failed_count": failed,
                "episodes_tagged": total_episodes_tagged
            }
            
        except Exception as e:
            job.status = "failed"
            job.error_message = str(e)
            job.completed_at = datetime.utcnow()
            self.db.commit()
            
            return {
                "success": False,
                "error": str(e)
            }
    
    async def _should_skip_run(self, run: FandomScrapeRun, force: bool) -> bool:
        if force:
            return False
        
        state = self.db.query(TitleTagScrapeState).filter(
            and_(
                TitleTagScrapeState.title_id == run.title_id,
                TitleTagScrapeState.tag_id == run.tag_id
            )
        ).first()
        
        if not state:
            return False
        
        if state.last_status == "success" and state.episodes_found > 0:
            return True
        
        return False
    
    async def _execute_run(self, run: FandomScrapeRun) -> Dict:
        run.status = "running"
        run.started_at = datetime.utcnow()
        self.db.commit()
        
        try:
            title = self.db.query(Title).filter(Title.id == run.title_id).first()
            tag = self.db.query(ContentTag).filter(ContentTag.id == run.tag_id).first()
            
            if not title or not tag:
                run.status = "failed"
                run.error_message = "Title or tag not found"
                run.completed_at = datetime.utcnow()
                self.db.commit()
                return {"success": False, "error": "Title or tag not found"}
            
            wiki_name = title.wiki_slug or title.title.lower().replace(" ", "").replace("'", "")
            
            tag_sources = self.db.query(FandomTagSource).filter(
                and_(
                    FandomTagSource.tag_id == tag.id,
                    FandomTagSource.is_active == True
                )
            ).order_by(FandomTagSource.priority.desc()).all()
            
            if not tag_sources:
                run.status = "failed"
                run.error_message = "No tag sources configured"
                run.completed_at = datetime.utcnow()
                self.db.commit()
                return {"success": False, "error": "No tag sources"}
            
            total_episodes_found = 0
            total_episodes_tagged = 0
            
            for source in tag_sources:
                result = self.scraper.scrape_and_tag_episodes(
                    wiki_name,
                    source.category_name,
                    confidence=0.7
                )
                
                if result.get('success'):
                    total_episodes_found += result.get('episodes_found', 0)
                    total_episodes_tagged += result.get('episodes_tagged', 0)
            
            run.episodes_found = total_episodes_found
            run.episodes_tagged = total_episodes_tagged
            run.status = "completed"
            run.completed_at = datetime.utcnow()
            
            self._update_scrape_state(run.title_id, run.tag_id, total_episodes_found)
            
            self.db.commit()
            
            return {
                "success": True,
                "episodes_found": total_episodes_found,
                "episodes_tagged": total_episodes_tagged
            }
            
        except Exception as e:
            run.status = "failed"
            run.error_message = str(e)
            run.completed_at = datetime.utcnow()
            self.db.commit()
            
            self._update_scrape_state(run.title_id, run.tag_id, 0, "failed")
            
            return {"success": False, "error": str(e)}
    
    def _update_scrape_state(
        self,
        title_id: int,
        tag_id: int,
        episodes_found: int,
        status: str = "success"
    ):
        state = self.db.query(TitleTagScrapeState).filter(
            and_(
                TitleTagScrapeState.title_id == title_id,
                TitleTagScrapeState.tag_id == tag_id
            )
        ).first()
        
        if state:
            state.last_scraped_at = datetime.utcnow()
            state.last_status = status
            state.episodes_found = episodes_found
            state.updated_at = datetime.utcnow()
        else:
            state = TitleTagScrapeState(
                title_id=title_id,
                tag_id=tag_id,
                last_scraped_at=datetime.utcnow(),
                last_status=status,
                episodes_found=episodes_found
            )
            self.db.add(state)
    
    def get_job_status(self, job_id: int) -> Optional[Dict]:
        job = self.db.query(FandomScrapeJob).filter(FandomScrapeJob.id == job_id).first()
        if not job:
            return None
        
        return {
            "id": job.id,
            "status": job.status,
            "total_titles": job.total_titles,
            "total_tags": job.total_tags,
            "processed_count": job.processed_count,
            "success_count": job.success_count,
            "failed_count": job.failed_count,
            "episodes_tagged": job.episodes_tagged,
            "error_message": job.error_message,
            "started_at": job.started_at.isoformat() if job.started_at else None,
            "completed_at": job.completed_at.isoformat() if job.completed_at else None,
            "created_at": job.created_at.isoformat() if job.created_at else None
        }
