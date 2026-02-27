"""
Movie of the Night (Streaming Availability API) Client
Provides episode-level deep links and metadata enrichment
"""
import os
import hashlib
import logging
import requests
import redis
from typing import Optional, Dict, Any
from datetime import datetime

logger = logging.getLogger(__name__)


class MovieAPIClient:
    """Client for Movie of the Night / Streaming Availability API via RapidAPI"""

    def __init__(self):
        from config import settings
        self.api_key = settings.MOVIE_OF_THE_NIGHT_API_KEY or os.getenv("MOVIE_OF_THE_NIGHT_API_KEY")
        self.base_url = "https://streaming-availability.p.rapidapi.com"
        self.redis_client = None

        # Try to connect to Redis for caching
        try:
            self.redis_client = redis.Redis(
                host=settings.REDIS_HOST,
                port=settings.REDIS_PORT,
                db=0,
                decode_responses=True
            )
            self.redis_client.ping()
        except (redis.ConnectionError, redis.TimeoutError):
            logger.warning("Redis not available, caching disabled")
            self.redis_client = None
    
    def _get_cache_key(self, endpoint: str, params: Dict) -> str:
        """Generate cache key from endpoint and params"""
        param_str = str(sorted(params.items()))
        return f"motn:{endpoint}:{hashlib.sha256(param_str.encode()).hexdigest()}"
    
    def _get_from_cache(self, cache_key: str) -> Optional[Dict]:
        """Get cached response if available"""
        if not self.redis_client:
            return None
        
        try:
            cached = self.redis_client.get(cache_key)
            if cached and isinstance(cached, str):
                import json
                return json.loads(cached)
        except Exception as e:
            logger.warning("Cache read error: %s", e)
        
        return None
    
    def _set_cache(self, cache_key: str, data: Optional[Dict], ttl: int = 86400):
        """Cache response for specified TTL (default 24 hours)"""
        if not self.redis_client or data is None:
            return
        
        try:
            import json
            self.redis_client.setex(cache_key, ttl, json.dumps(data))
        except Exception as e:
            logger.warning("Cache write error: %s", e)
    
    def _make_request(self, endpoint: str, params: Dict = None) -> Optional[Dict]:
        """Make authenticated request to Streaming Availability API"""
        if not self.api_key:
            raise ValueError("MOVIE_OF_THE_NIGHT_API_KEY not configured")
        
        headers = {
            "X-RapidAPI-Key": self.api_key,
            "X-RapidAPI-Host": "streaming-availability.p.rapidapi.com"
        }
        
        try:
            response = requests.get(
                f"{self.base_url}{endpoint}",
                headers=headers,
                params=params or {},
                timeout=10
            )
            response.raise_for_status()
            return response.json()
        except requests.RequestException as e:
            logger.error("Movie API request failed: %s", e)
            return None
    
    def get_show_details(self, tmdb_id: int, show_type: str = "tv") -> Optional[Dict]:
        """
        Get show details by TMDB ID
        
        Args:
            tmdb_id: TMDB ID of the show
            show_type: "tv" for TV series or "movie" for movies
        
        Returns:
            Show metadata including streaming availability
        """
        cache_key = self._get_cache_key("shows", {"tmdb_id": tmdb_id, "type": show_type})
        
        # Check cache first
        cached = self._get_from_cache(cache_key)
        if cached:
            return cached
        
        # Make API request - Updated endpoint format for 2025 API
        endpoint = f"/shows/{show_type}/{tmdb_id}"
        data = self._make_request(endpoint, {"country": "us"})
        
        if data:
            self._set_cache(cache_key, data)
        
        return data
    
    def get_episode_deep_link(
        self,
        tmdb_id: int,
        season: int,
        episode: int,
        provider: str = "disney"
    ) -> Optional[str]:
        """
        Get episode-specific deep link from Movie of the Night API
        
        Args:
            tmdb_id: TMDB ID of the TV show
            season: Season number
            episode: Episode number
            provider: Streaming provider (disney, netflix, hulu, prime, etc.)
        
        Returns:
            Deep link URL or None if not available
        """
        show_data = self.get_show_details(tmdb_id, "tv")
        
        if not show_data:
            return None
        
        # Navigate to streaming options
        streaming_options = show_data.get("streamingOptions", {}).get("us", [])
        
        for option in streaming_options:
            service = option.get("service", {}).get("id", "")
            
            # Match provider
            if provider.lower() in service.lower():
                # Check for episode-level deep link
                episodes = option.get("episodes", [])
                
                for ep in episodes:
                    if ep.get("seasonNumber") == season and ep.get("episodeNumber") == episode:
                        return ep.get("link")
                
                # Fallback to show-level link
                return option.get("link")
        
        return None
    
    def enrich_episode_link(
        self,
        url: str,
        tmdb_id: int,
        season: int,
        episode: int
    ) -> Optional[Dict[str, Any]]:
        """
        Enrich an episode link by validating it against Movie of the Night API
        
        Args:
            url: Deep link URL to validate
            tmdb_id: TMDB ID of the show
            season: Season number
            episode: Episode number
        
        Returns:
            Enriched metadata with verification status
        """
        # Cache key based on URL + metadata hash
        cache_key = f"motn:episode:{tmdb_id}:{season}:{episode}:{hashlib.sha256(url.encode()).hexdigest()}"
        
        # Check cache
        cached = self._get_from_cache(cache_key)
        if cached:
            return {"source": "cache", "verified": True, "data": cached}
        
        # Get show details from Movie of the Night
        show_data = self.get_show_details(tmdb_id, "tv")
        
        if not show_data:
            return {"source": "local", "verified": False, "data": {"provider": self._detect_provider(url)}}
        
        # Check if this episode's deep link is available
        streaming_options = show_data.get("streamingOptions", {}).get("us", [])
        provider = self._detect_provider(url)
        
        for option in streaming_options:
            service = option.get("service", {}).get("id", "")
            
            if provider in service.lower() or service.lower() in provider:
                # Check for episode-level deep link
                episodes = option.get("episodes", [])
                
                for ep in episodes:
                    if ep.get("seasonNumber") == season and ep.get("episodeNumber") == episode:
                        api_link = ep.get("link", "")
                        
                        # Validate URL matches
                        if api_link and (api_link == url or api_link in url or url in api_link):
                            result = {
                                "verified": True,
                                "api_url": api_link,
                                "reported_url": url,
                                "match_type": "exact" if api_link == url else "partial",
                                "provider": provider,
                                "show_data": show_data.get("title", ""),
                                "verified_at": datetime.utcnow().isoformat()
                            }
                            self._set_cache(cache_key, result, ttl=86400)
                            return {"source": "api", "verified": True, "data": result}
        
        # URL not verified by API
        return {
            "source": "local",
            "verified": False,
            "data": {
                "provider": provider,
                "note": "URL not verified by Movie of the Night API"
            }
        }
    
    def _detect_provider(self, url: str) -> str:
        """Detect streaming provider from URL"""
        url_lower = url.lower()
        
        if "disneyplus.com" in url_lower or "disney.com" in url_lower:
            return "disney_plus"
        elif "netflix.com" in url_lower:
            return "netflix"
        elif "hulu.com" in url_lower:
            return "hulu"
        elif "amazon.com" in url_lower or "primevideo.com" in url_lower:
            return "prime_video"
        elif "peacocktv.com" in url_lower:
            return "peacock"
        elif "youtube.com" in url_lower or "youtu.be" in url_lower:
            return "youtube"
        
        return "unknown"


# Global instance
movie_api_client = MovieAPIClient()
