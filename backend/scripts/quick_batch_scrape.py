"""
Quick batch scrape - processes shows one at a time with progress output
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(__file__)))

from db import SessionLocal
from models import Title, Episode
from services.fandom_scraper import trigger_show_scrape

def quick_batch_scrape():
    """Trigger background scraping for all unscraped shows with episodes"""
    db = SessionLocal()
    try:
        # Get shows that need scraping
        shows = db.query(Title).filter(
            Title.media_type == 'tv',
            (Title.fandom_scraped == False) | (Title.fandom_scraped == None)
        ).all()
        
        shows_to_scrape = []
        for show in shows:
            episode_count = db.query(Episode).filter(Episode.title_id == show.id).count()
            if episode_count >= 10:  # Only shows with 10+ episodes
                shows_to_scrape.append((show, episode_count))
        
        print(f"Found {len(shows_to_scrape)} shows to scrape:")
        for show, count in shows_to_scrape:
            print(f"  - {show.title} ({count} episodes)")
        
        print(f"\nTriggering background scraping jobs...")
        for show, count in shows_to_scrape:
            print(f"  ✓ Queued: {show.title}")
            # This will run in background via the existing trigger function
            trigger_show_scrape(show.id, show.title)
        
        print(f"\n✅ All {len(shows_to_scrape)} shows queued for scraping!")
        print("Check backend logs to monitor progress.")
        
    finally:
        db.close()

if __name__ == "__main__":
    quick_batch_scrape()
