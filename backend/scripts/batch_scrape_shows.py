"""
Batch scrape all unscraped TV shows in the database.
This script triggers enhanced Fandom scraping for all TV shows
that have episodes loaded but haven't been scraped yet.
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(__file__)))

from db import SessionLocal
from models import Title, Episode
from services.enhanced_fandom_scraper import EnhancedFandomScraper
from datetime import datetime

def batch_scrape_unscraped_shows(min_episodes: int = 5):
    """
    Scrape all TV shows that:
    1. Haven't been scraped yet (fandom_scraped = False)
    2. Have at least min_episodes loaded from TMDB
    
    Args:
        min_episodes: Minimum number of episodes required to attempt scraping
    """
    db = SessionLocal()
    try:
        # Find all unscraped TV shows with episodes
        shows = db.query(Title).filter(
            Title.media_type == 'tv',
            (Title.fandom_scraped == False) | (Title.fandom_scraped == None)
        ).all()
        
        # Filter shows that have enough episodes
        shows_to_scrape = []
        for show in shows:
            episode_count = db.query(Episode).filter(Episode.title_id == show.id).count()
            if episode_count >= min_episodes:
                shows_to_scrape.append((show, episode_count))
        
        print(f"\n{'='*80}")
        print(f"BATCH FANDOM SCRAPING - {len(shows_to_scrape)} shows to process")
        print(f"{'='*80}\n")
        
        total_episodes_tagged = 0
        total_tags_added = 0
        successful_scrapes = 0
        failed_scrapes = 0
        
        for i, (show, episode_count) in enumerate(shows_to_scrape, 1):
            print(f"\n[{i}/{len(shows_to_scrape)}] Processing: {show.title} ({episode_count} episodes)")
            print(f"{'-'*80}")
            
            try:
                # Use enhanced scraper with 1-second rate limit
                scraper = EnhancedFandomScraper(db, rate_limit_delay=1.0)
                result = scraper.scrape_show_episodes(
                    title_id=show.id,
                    tag_filter=None  # Search for all content tags
                )
                
                if result.get('success'):
                    episodes_tagged = result.get('episodes_tagged', 0)
                    tags_added = result.get('tags_added', 0)
                    
                    print(f"✅ Success!")
                    print(f"   - Episodes tagged: {episodes_tagged}")
                    print(f"   - Unique tags added: {tags_added}")
                    
                    # Mark as scraped
                    show.fandom_scraped = True
                    show.fandom_scrape_date = datetime.utcnow()
                    if result.get('wiki_slug'):
                        show.wiki_slug = result['wiki_slug']
                    db.commit()
                    
                    total_episodes_tagged += episodes_tagged
                    total_tags_added += tags_added
                    successful_scrapes += 1
                else:
                    error = result.get('error', 'Unknown error')
                    print(f"❌ Failed: {error}")
                    failed_scrapes += 1
                    
            except Exception as e:
                print(f"❌ Error: {str(e)}")
                failed_scrapes += 1
                continue
        
        print(f"\n{'='*80}")
        print(f"BATCH SCRAPING COMPLETE")
        print(f"{'='*80}")
        print(f"✅ Successful: {successful_scrapes}/{len(shows_to_scrape)}")
        print(f"❌ Failed: {failed_scrapes}/{len(shows_to_scrape)}")
        print(f"📊 Total episodes tagged: {total_episodes_tagged}")
        print(f"🏷️  Total tags added: {total_tags_added}")
        print(f"{'='*80}\n")
        
    except Exception as e:
        print(f"\n❌ Critical error in batch scraping: {str(e)}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    print("Starting batch scraping of unscraped TV shows...")
    print("This may take several hours for shows with many episodes.\n")
    
    # Only scrape shows with at least 5 episodes
    batch_scrape_unscraped_shows(min_episodes=5)
