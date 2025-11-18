"""
Apply automatic tags to all existing titles
"""
import sys
sys.path.insert(0, '/home/runner/workspace/backend')

from db import SessionLocal
from models import Title, Policy
from services.auto_tagger import AutoTagger
from sqlalchemy import distinct

def apply_tags_to_all_titles():
    """Apply automatic tags to all titles that have policies"""
    db = SessionLocal()
    try:
        # Get all titles that have policies
        title_ids = db.query(distinct(Policy.title_id)).join(
            Title, Policy.title_id == Title.id
        ).all()
        
        title_ids = [tid[0] for tid in title_ids]
        titles = db.query(Title).filter(Title.id.in_(title_ids)).all()
        
        print(f"Found {len(titles)} titles to auto-tag\n")
        
        tagger = AutoTagger(db)
        total_tags_added = 0
        
        for title in titles:
            print(f"🏷️  Processing: {title.title}")
            tags_added = tagger.apply_tags_to_title(title.id)
            
            if tags_added > 0:
                print(f"   ✅ Added {tags_added} tags")
                total_tags_added += tags_added
            else:
                print(f"   ⏭️  No new tags to add")
        
        print(f"\n✅ Completed! Added {total_tags_added} tags total across {len(titles)} titles")
    
    finally:
        db.close()

if __name__ == "__main__":
    apply_tags_to_all_titles()
