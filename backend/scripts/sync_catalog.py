import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import httpx
from sqlalchemy.orm import Session
from datetime import datetime
from db import SessionLocal
from models import Title
from config import settings

def sync_popular_movies(db: Session):
    if not settings.TMDB_API_KEY:
        print("TMDB API key not configured, skipping sync")
        return
    
    url = f"{settings.TMDB_API_BASE_URL}/movie/popular"
    params = {
        "api_key": settings.TMDB_API_KEY,
        "language": "en-US",
        "page": 1
    }
    
    try:
        with httpx.Client() as client:
            response = client.get(url, params=params)
            if response.status_code != 200:
                print(f"Error fetching movies: {response.status_code}")
                return
            
            data = response.json()
            synced_count = 0
            
            for item in data.get("results", [])[:20]:
                tmdb_id = item.get("id")
                existing_title = db.query(Title).filter(Title.tmdb_id == tmdb_id).first()
                
                if existing_title:
                    existing_title.title = item.get("title", "")
                    existing_title.overview = item.get("overview")
                    existing_title.poster_path = item.get("poster_path")
                    existing_title.backdrop_path = item.get("backdrop_path")
                    existing_title.release_date = item.get("release_date")
                    existing_title.rating = str(item.get("vote_average", 0))
                    existing_title.genres = item.get("genre_ids", [])
                    existing_title.last_synced = datetime.utcnow()
                else:
                    new_title = Title(
                        tmdb_id=tmdb_id,
                        title=item.get("title", ""),
                        media_type="movie",
                        overview=item.get("overview"),
                        poster_path=item.get("poster_path"),
                        backdrop_path=item.get("backdrop_path"),
                        release_date=item.get("release_date"),
                        rating=str(item.get("vote_average", 0)),
                        genres=item.get("genre_ids", []),
                        last_synced=datetime.utcnow()
                    )
                    db.add(new_title)
                
                synced_count += 1
            
            db.commit()
            print(f"Synced {synced_count} movies from TMDB")
    except Exception as e:
        print(f"Error during sync: {e}")
        db.rollback()

def sync_popular_tv_shows(db: Session):
    if not settings.TMDB_API_KEY:
        return
    
    url = f"{settings.TMDB_API_BASE_URL}/tv/popular"
    params = {
        "api_key": settings.TMDB_API_KEY,
        "language": "en-US",
        "page": 1
    }
    
    try:
        with httpx.Client() as client:
            response = client.get(url, params=params)
            if response.status_code != 200:
                print(f"Error fetching TV shows: {response.status_code}")
                return
            
            data = response.json()
            synced_count = 0
            
            for item in data.get("results", [])[:20]:
                tmdb_id = item.get("id")
                existing_title = db.query(Title).filter(Title.tmdb_id == tmdb_id).first()
                
                if existing_title:
                    existing_title.title = item.get("name", "")
                    existing_title.overview = item.get("overview")
                    existing_title.poster_path = item.get("poster_path")
                    existing_title.backdrop_path = item.get("backdrop_path")
                    existing_title.release_date = item.get("first_air_date")
                    existing_title.rating = str(item.get("vote_average", 0))
                    existing_title.genres = item.get("genre_ids", [])
                    existing_title.last_synced = datetime.utcnow()
                else:
                    new_title = Title(
                        tmdb_id=tmdb_id,
                        title=item.get("name", ""),
                        media_type="tv",
                        overview=item.get("overview"),
                        poster_path=item.get("poster_path"),
                        backdrop_path=item.get("backdrop_path"),
                        release_date=item.get("first_air_date"),
                        rating=str(item.get("vote_average", 0)),
                        genres=item.get("genre_ids", []),
                        last_synced=datetime.utcnow()
                    )
                    db.add(new_title)
                
                synced_count += 1
            
            db.commit()
            print(f"Synced {synced_count} TV shows from TMDB")
    except Exception as e:
        print(f"Error during TV sync: {e}")
        db.rollback()

def run_sync():
    print(f"Starting TMDB catalog sync at {datetime.utcnow()}")
    db = SessionLocal()
    try:
        sync_popular_movies(db)
        sync_popular_tv_shows(db)
        print("Sync completed successfully")
    finally:
        db.close()

if __name__ == "__main__":
    run_sync()
