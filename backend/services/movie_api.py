"""
Movie of the Night (Streaming Availability API) Client
Provides episode-level deep links and metadata enrichment
"""
import os
import hashlib
import requests
import redis
from typing import Optional, Dict, Any
from datetime import datetime


class MovieAPIClient:
    """Client for Movie of the Night / Streaming Availability API via RapidAPI"""
    
    def __init__(self):
        self.api_key = os.getenv("MOVIE_OF_THE_NIGHT_API_KEY")
        self.base_url = "https://streaming-availability.p.rapidapi.com"
        self.redis_client = None
        
        # Try to connect to Redis for caching
        try:
            self.redis_client = redis.Redis(host='localhost', port=6379, db=0, decode_responses=True)
            self.redis_client.ping()
        except (redis.ConnectionError, redis.TimeoutError):
            print("Warning: Redis not available, caching disabled")
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
            print(f"Cache read error: {e}")
        
        return None
    
    def _set_cache(self, cache_key: str, data: Optional[Dict], ttl: int = 86400):
        """Cache response for specified TTL (default 24 hours)"""
        if not self.redis_client or data is None:
            return
        
        try:
            import json
            self.redis_client.setex(cache_key, ttl, json.dumps(data))
        except Exception as e:
            print(f"Cache write error: {e}")
    
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
            print(f"Movie API request failed: {e}")
            return None
    
    def get_show_details(self, tmdb_id: int, show_type: str = "series") -> Optional[Dict]:
        """
        Get show details by TMDB ID
        
        Args:
            tmdb_id: TMDB ID of the show
            show_type: "series" or "movie"
        
        Returns:
            Show metadata including streaming availability
        """
        cache_key = self._get_cache_key("shows", {"tmdb_id": tmdb_id, "type": show_type})
        
        # Check cache first
        cached = self._get_from_cache(cache_key)
        if cached:
            return cached
        
        # Make API request
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
        show_data = self.get_show_details(tmdb_id, "series")
        
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
    
    def enrich_deep_link(self, url: str) -> Optional[Dict[str, Any]]:
        """
        Enrich a deep link with metadata from Movie of the Night
        
        Args:
            url: Deep link URL to enrich
        
        Returns:
            Enriched metadata or None if not found
        """
        # Cache key based on URL hash
        cache_key = f"motn:enrich:{hashlib.sha256(url.encode()).hexdigest()}"
        
        # Check cache
        cached = self._get_from_cache(cache_key)
        if cached:
            return {"source": "cache", "data": cached, "cached_at": cached.get("cached_at")}
        
        # Note: Movie of the Night API doesn't have a reverse lookup endpoint
        # This would need to be implemented if they add such functionality
        # For now, we'll return basic URL analysis
        
        result = {
            "url": url,
            "analyzed_at": datetime.utcnow().isoformat(),
            "provider": self._detect_provider(url),
            "cached_at": datetime.utcnow().isoformat()
        }
        
        self._set_cache(cache_key, result, ttl=604800)  # Cache for 7 days
        
        return {"source": "analysis", "data": result}
    
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
