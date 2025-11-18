"""
Test the enhanced Fandom scraper on a specific show
"""
import sys
sys.path.insert(0, '/home/runner/workspace/backend')

from db import SessionLocal
from models import Title
from services.enhanced_fandom_scraper import EnhancedFandomScraper

def test_scraper(show_name: str):
    """Test enhanced scraper on a specific show"""
    db = SessionLocal()
    
    try:
        # Find the show
        title = db.query(Title).filter(
            Title.title.ilike(f'%{show_name}%'),
            Title.media_type == 'tv'
        ).first()
        
        if not title:
            print(f"❌ Show not found: {show_name}")
            return
        
        print(f"Found: {title.title} (ID: {title.id})")
        print(f"TMDB ID: {title.tmdb_id}")
        
        # Create scraper
        scraper = EnhancedFandomScraper(db)
        
        # Run scraper
        result = scraper.scrape_show_episodes(title.id)
        
        print(f"\n{'='*60}")
        print(f"RESULTS:")
        print(f"{'='*60}")
        for key, value in result.items():
            print(f"{key}: {value}")
        
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    if len(sys.argv) > 1:
        show_name = ' '.join(sys.argv[1:])
    else:
        show_name = "PAW Patrol"
    
    test_scraper(show_name)
