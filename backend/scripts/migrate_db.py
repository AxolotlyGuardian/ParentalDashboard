"""
Create new database tables for Fandom episode mapping
"""
import sys
sys.path.insert(0, '/home/runner/workspace/backend')

from db import engine, Base
from models import FandomShowConfig, FandomEpisodeLink, EpisodeTag

def migrate_database():
    """Create new tables if they don't exist"""
    print("Creating new database tables...")
    
    # Import all models to ensure they're registered
    import models
    
    # Create all tables (only creates new ones, doesn't modify existing)
    Base.metadata.create_all(bind=engine)
    
    print("✅ Database migration completed successfully!")
    print("\nNew tables created:")
    print("  - fandom_show_configs")
    print("  - fandom_episode_links")
    print("  - episode_tags (enhanced with provenance fields)")

if __name__ == "__main__":
    migrate_database()
