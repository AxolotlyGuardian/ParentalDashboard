"""
Backfill script to fetch episode 1 deep links for all existing TV titles
"""
from db import SessionLocal
from models import Title, Episode, EpisodeLink
from services.movie_api import MovieAPIClient
from sqlalchemy import func
import os
import time

def backfill_episode_1_links():
    """
    Fetch episode 1 deep links for all TV titles that don't have them yet
    """
    db = SessionLocal()
    movie_api = MovieAPIClient()
    
    try:
        # Get all TV titles
        tv_titles = db.query(Title).filter(Title.media_type == 'tv').all()
        print(f"Found {len(tv_titles)} TV titles to process")
        
        processed = 0
        skipped = 0
        added = 0
        failed = 0
        
        for title in tv_titles:
            print(f"\n[{processed + 1}/{len(tv_titles)}] Processing: {title.title}")
            
            # Check if episode 1 exists
            episode_1 = db.query(Episode).filter(
                Episode.title_id == title.id,
                Episode.season_number == 1,
                Episode.episode_number == 1
            ).first()
            
            if not episode_1:
                print(f"  ⏭️  Skipping - Episode 1 not loaded yet")
                skipped += 1
                processed += 1
                continue
            
            # Check if deep links already exist
            existing_links_count = db.query(func.count(EpisodeLink.id)).filter(
                EpisodeLink.episode_id == episode_1.id,
                EpisodeLink.source == 'motn_api'
            ).scalar()
            
            if existing_links_count > 0:
                print(f"  ✅ Already has {existing_links_count} deep link(s) - Skipping")
                skipped += 1
                processed += 1
                continue
            
            # Fetch deep links from Movie of the Night API
            print(f"  🔍 Fetching deep links for S1E1: {episode_1.episode_name}")
            
            providers = ['disney', 'netflix', 'hulu', 'prime', 'peacock']
            links_added = 0
            
            for provider in providers:
                try:
                    deep_link = movie_api.get_episode_deep_link(
                        title.tmdb_id,
                        season=1,
                        episode=1,
                        provider=provider
                    )
                    
                    if deep_link:
                        # Store in database
                        episode_link = EpisodeLink(
                            episode_id=episode_1.id,
                            raw_provider=provider,
                            provider=provider,
                            deep_link_url=deep_link,
                            source='motn_api',
                            confidence_score=1.0,
                            motn_verified=True
                        )
                        db.add(episode_link)
                        links_added += 1
                        print(f"    ✅ Added {provider}: {deep_link[:60]}...")
                    
                    # Small delay to avoid rate limiting
                    time.sleep(0.2)
                    
                except Exception as e:
                    print(f"    ⚠️  Error fetching {provider}: {str(e)}")
            
            if links_added > 0:
                db.commit()
                print(f"  ✅ Successfully added {links_added} deep link(s)")
                added += links_added
            else:
                print(f"  ⚠️  No deep links found")
                failed += 1
            
            processed += 1
            
            # Small delay between titles
            time.sleep(0.5)
        
        print(f"\n{'='*60}")
        print(f"Backfill Complete!")
        print(f"  Processed: {processed} titles")
        print(f"  Skipped: {skipped} (already have links or missing episode 1)")
        print(f"  Added: {added} deep links")
        print(f"  Failed: {failed} (no links found)")
        print(f"{'='*60}")
        
    except Exception as e:
        print(f"Error during backfill: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    print("Starting episode 1 deep link backfill...")
    backfill_episode_1_links()
