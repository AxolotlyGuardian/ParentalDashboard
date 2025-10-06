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
