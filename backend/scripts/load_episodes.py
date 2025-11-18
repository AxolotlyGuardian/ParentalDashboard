"""
Load episodes from TMDB for all TV shows that have policies
"""
import sys
sys.path.insert(0, '/home/runner/workspace/backend')

from db import SessionLocal
from models import Title, Episode, Policy
from config import settings
import httpx

def load_episodes_for_all_shows():
    """Load episodes from TMDB for all TV shows that have policies"""
    
    if not settings.TMDB_API_KEY:
        print("ERROR: TMDB_API_KEY not configured")
        return
    
    db = SessionLocal()
    try:
        # Get all TV titles that have policies
        from sqlalchemy import distinct
        title_ids = db.query(distinct(Policy.title_id)).join(
            Title, Policy.title_id == Title.id
        ).filter(
            Title.media_type == "tv"
        ).all()
        
        title_ids = [tid[0] for tid in title_ids]
        titles_with_policies = db.query(Title).filter(Title.id.in_(title_ids)).all()
        
        print(f"Found {len(titles_with_policies)} TV shows with policies")
        
        for title in titles_with_policies:
            try:
                # Check if episodes already loaded
                existing_count = db.query(Episode).filter(Episode.title_id == title.id).count()
                if existing_count > 0:
                    print(f"✓ {title.title} - Already has {existing_count} episodes (skipping)")
                    continue
                
                print(f"\n📺 Loading episodes for: {title.title} (TMDB ID: {title.tmdb_id})")
                
                # Load episodes
                tv_url = f"{settings.TMDB_API_BASE_URL}/tv/{title.tmdb_id}"
                tv_params = {"api_key": settings.TMDB_API_KEY}
                
                with httpx.Client() as client:
                    tv_response = client.get(tv_url, params=tv_params, timeout=10)
                    if tv_response.status_code != 200:
                        print(f"  ❌ TMDB request failed: {tv_response.status_code}")
                        continue
                    
                    tv_data = tv_response.json()
                    num_seasons = tv_data.get("number_of_seasons", 0)
                    num_episodes = tv_data.get("number_of_episodes", 0)
                    
                    # Update title
                    title.number_of_seasons = num_seasons
                    title.number_of_episodes = num_episodes
                    db.commit()
                    
                    print(f"  📊 Show has {num_seasons} seasons, {num_episodes} total episodes")
                    
                    episodes_loaded = 0
                    
                    # Load each season
                    for season_num in range(1, num_seasons + 1):
                        season_url = f"{settings.TMDB_API_BASE_URL}/tv/{title.tmdb_id}/season/{season_num}"
                        season_response = client.get(season_url, params=tv_params, timeout=10)
                        
                        if season_response.status_code != 200:
                            print(f"  ⚠️  Failed to fetch season {season_num}")
                            continue
                        
                        season_data = season_response.json()
                        season_episode_count = 0
                        
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
                            season_episode_count += 1
                        
                        print(f"    Season {season_num}: {season_episode_count} episodes")
                    
                    db.commit()
                    
                    print(f"  ✅ Successfully loaded {episodes_loaded} episodes for {title.title}")
            
            except Exception as e:
                db.rollback()
                print(f"  ❌ Error loading {title.title}: {str(e)}")
        
        print(f"\n✅ Completed loading episodes for all shows")
    
    finally:
        db.close()

if __name__ == "__main__":
    load_episodes_for_all_shows()
