"""
Run Fandom scraping for all TV shows that have episodes
"""
import sys
sys.path.insert(0, '/home/runner/workspace/backend')

from db import SessionLocal
from models import Title, Episode, Policy
from services.fandom_scraper import trigger_show_scrape

def scrape_all_shows():
    """Run Fandom scraping for all TV shows"""
    db = SessionLocal()
    try:
        # Get all TV titles that have policies and episodes
        from sqlalchemy import distinct
        title_ids = db.query(distinct(Policy.title_id)).join(
            Title, Policy.title_id == Title.id
        ).filter(
            Title.media_type == "tv"
        ).all()
        
        title_ids = [tid[0] for tid in title_ids]
        titles = db.query(Title).filter(Title.id.in_(title_ids)).all()
        
        print(f"Found {len(titles)} TV shows to scrape\n")
        
        for title in titles:
            episode_count = db.query(Episode).filter(Episode.title_id == title.id).count()
            
            if episode_count == 0:
                print(f"⏭️  {title.title} - No episodes (skipping)")
                continue
            
            if title.fandom_scraped:
                print(f"✓ {title.title} - Already scraped (skipping)")
                continue
            
            print(f"🔍 Scraping {title.title} ({episode_count} episodes)...")
            
            try:
                trigger_show_scrape(title.id, title.title)
            except Exception as e:
                print(f"  ❌ Error: {str(e)}")
        
        print(f"\n✅ Completed Fandom scraping")
    
    finally:
        db.close()

if __name__ == "__main__":
    scrape_all_shows()
