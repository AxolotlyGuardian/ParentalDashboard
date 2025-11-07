import asyncio
import httpx
from sqlalchemy.orm import Session
from db import SessionLocal
from models import Title
from config import settings

PROVIDER_MAP = {
    "netflix": 8,
    "disney_plus": 337,
    "prime_video": 9,
    "hulu": 15,
    "peacock": 387,
    "youtube": 192
}

async def fetch_providers_for_title(title: Title):
    """Fetch provider information from TMDB"""
    if not settings.TMDB_API_KEY:
        print("No TMDB API key configured")
        return None
    
    if not title.tmdb_id:
        return None
    
    media_type = "movie" if title.media_type == "movie" else "tv"
    url = f"{settings.TMDB_API_BASE_URL}/{media_type}/{title.tmdb_id}/watch/providers"
    params = {"api_key": settings.TMDB_API_KEY}
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(url, params=params)
            if response.status_code != 200:
                return None
            
            data = response.json()
            us_providers = data.get("results", {}).get("US", {})
            
            all_providers = []
            for category in ["flatrate", "ads", "free"]:
                all_providers.extend(us_providers.get(category, []))
            
            id_to_name = {v: k for k, v in PROVIDER_MAP.items()}
            
            available_providers = []
            for provider in all_providers:
                provider_id = provider.get("provider_id")
                if provider_id in id_to_name:
                    our_name = id_to_name[provider_id]
                    if our_name not in available_providers:
                        available_providers.append(our_name)
            
            return available_providers
    except Exception as e:
        print(f"Error fetching providers for title {title.id}: {e}")
        return None

async def main():
    db = SessionLocal()
    try:
        titles = db.query(Title).filter(Title.tmdb_id.isnot(None)).all()
        
        updated = 0
        skipped = 0
        errors = 0
        
        for title in titles:
            if not title.providers or len(title.providers) == 0:
                providers = await fetch_providers_for_title(title)
                if providers is not None:
                    title.providers = providers
                    db.commit()
                    print(f"✓ Updated: {title.title} -> {providers}")
                    updated += 1
                else:
                    print(f"✗ No providers found: {title.title}")
                    errors += 1
            else:
                skipped += 1
        
        print(f"\n=== Summary ===")
        print(f"Updated: {updated}")
        print(f"Skipped: {skipped}")
        print(f"Errors: {errors}")
        print(f"Total: {len(titles)}")
    finally:
        db.close()

if __name__ == "__main__":
    asyncio.run(main())
