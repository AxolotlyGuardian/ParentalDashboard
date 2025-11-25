# API Integration

Axolotly integrates with multiple external APIs to provide content metadata, streaming availability, and deep linking capabilities.

## External APIs

### 1. TMDB API (The Movie Database)

**Purpose:** Content metadata and search

**Provider:** [The Movie Database](https://www.themoviedb.org/)

**API Documentation:** https://developers.themoviedb.org/3

**Key Features Used:**
- Movie/TV show search
- Detailed title metadata
- Season/episode information
- Poster and backdrop images
- Genre classifications
- Content ratings

**Rate Limits:**
- 40 requests per 10 seconds
- Higher limits available with paid plans

**Caching Strategy:**
- All TMDB data cached in PostgreSQL
- 24-hour cache expiration
- Redis caching for high-frequency queries (optional)

### 2. Movie of the Night API (Streaming Availability)

**Purpose:** Deep link discovery and streaming availability

**Provider:** [Streaming Availability API](https://rapidapi.com/movie-of-the-night-movie-of-the-night-default/api/streaming-availability) (via RapidAPI)

**Key Features Used:**
- Season 1 Episode 1 deep links
- Streaming service availability
- Platform-specific URLs
- Geographic availability data

**Rate Limits:**
- 100 requests/day (free tier)
- 1000 requests/day (basic tier)
- Custom limits for paid plans

**Usage Pattern:**
- One-time backfill for all TV shows
- Periodic updates for new content
- On-demand for specific requests

### 3. Fandom Wiki API (MediaWiki)

**Purpose:** Episode-level content tagging

**Provider:** [Fandom](https://www.fandom.com/) wikis via MediaWiki API

**Key Features Used:**
- Episode list scraping
- Content warning extraction
- Episode-specific metadata
- Structured infobox data

**No Rate Limits (Respectful Usage):**
- Throttle requests to 1/second
- Cache all results permanently
- Minimal re-scraping

## API Integration Details

### TMDB Integration

**Authentication:**
```python
import httpx

TMDB_API_KEY = os.getenv("TMDB_API_KEY")
headers = {"Authorization": f"Bearer {TMDB_API_KEY}"}
```

**Search Endpoint:**
```python
async def search_tmdb(query: str) -> dict:
    url = "https://api.themoviedb.org/3/search/multi"
    params = {
        "api_key": TMDB_API_KEY,
        "query": query,
        "language": "en-US",
        "page": 1
    }
    
    async with httpx.AsyncClient() as client:
        response = await client.get(url, params=params)
        return response.json()
```

**Metadata Endpoint:**
```python
async def get_title_metadata(tmdb_id: int, media_type: str) -> dict:
    url = f"https://api.themoviedb.org/3/{media_type}/{tmdb_id}"
    params = {
        "api_key": TMDB_API_KEY,
        "language": "en-US",
        "append_to_response": "credits,keywords,watch/providers"
    }
    
    async with httpx.AsyncClient() as client:
        response = await client.get(url, params=params)
        return response.json()
```

**Episode Loading:**
```python
async def load_episodes(tmdb_id: int, season_number: int) -> list:
    url = f"https://api.themoviedb.org/3/tv/{tmdb_id}/season/{season_number}"
    params = {
        "api_key": TMDB_API_KEY,
        "language": "en-US"
    }
    
    async with httpx.AsyncClient() as client:
        response = await client.get(url, params=params)
        data = response.json()
        return data.get("episodes", [])
```

### Movie of the Night Integration

**Authentication:**
```python
MOTN_API_KEY = os.getenv("MOVIE_OF_THE_NIGHT_API_KEY")
headers = {
    "X-RapidAPI-Key": MOTN_API_KEY,
    "X-RapidAPI-Host": "streaming-availability.p.rapidapi.com"
}
```

**Deep Link Retrieval:**
```python
async def get_episode_1_deep_link(tmdb_id: int) -> dict:
    url = f"https://streaming-availability.p.rapidapi.com/get"
    params = {
        "tmdb_id": f"tv/{tmdb_id}",
        "output_language": "en",
        "country": "us"
    }
    
    async with httpx.AsyncClient() as client:
        response = await client.get(url, params=params, headers=headers)
        data = response.json()
        
        # Extract S1E1 deep link from response
        for platform in data.get("streamingInfo", {}).values():
            if platform.get("link"):
                return {
                    "platform": platform["service"],
                    "url": platform["link"]
                }
        return None
```

**Bulk Backfill:**
```python
async def backfill_all_episode_1_links():
    titles = db.query(Title).filter(Title.media_type == "tv").all()
    
    for title in titles:
        deep_link = await get_episode_1_deep_link(title.tmdb_id)
        if deep_link:
            # Store in episode_links table
            link = EpisodeLink(
                episode_id=get_episode_1_id(title.id),
                platform=deep_link["platform"],
                url=deep_link["url"],
                verified=True,
                reported_count=1
            )
            db.add(link)
    
    db.commit()
```

### Fandom Wiki Integration

**MediaWiki API:**
```python
async def scrape_fandom_episodes(wiki_url: str, tmdb_id: int) -> list:
    # Extract wiki base URL
    base_url = f"{wiki_url}/api.php"
    
    # Fetch episode list page
    params = {
        "action": "parse",
        "page": "List_of_episodes",
        "format": "json"
    }
    
    async with httpx.AsyncClient() as client:
        response = await client.get(base_url, params=params)
        data = response.json()
        html = data["parse"]["text"]["*"]
    
    # Parse HTML for episode data
    episodes = parse_episode_table(html)
    
    # Match to TMDB episodes
    matched = match_fandom_to_tmdb(episodes, tmdb_id)
    
    # Apply tags
    for episode in matched:
        apply_episode_tags(episode["tmdb_episode_id"], episode["tags"])
    
    return matched
```

**Tag Extraction:**
```python
def extract_content_warnings(episode_page_html: str) -> list:
    # Parse HTML for content warning section
    soup = BeautifulSoup(episode_page_html, 'html.parser')
    
    warnings = []
    warning_section = soup.find(class_="content-warnings")
    if warning_section:
        for warning in warning_section.find_all("li"):
            warnings.append(normalize_tag(warning.text))
    
    return warnings
```

## Data Normalization

### Genre to Tag Mapping

**TMDB Genres → Axolotly Tags:**
```python
GENRE_TAG_MAP = {
    28: "action",           # Action
    12: "adventure",        # Adventure
    16: "animation",        # Animation
    35: "comedy",           # Comedy
    80: "crime",            # Crime
    99: "documentary",      # Documentary
    18: "drama",            # Drama
    10751: "family",        # Family
    14: "fantasy",          # Fantasy
    27: "horror",           # Horror
    10402: "musical",       # Music
    9648: "mystery",        # Mystery
    10749: "romance",       # Romance
    878: "science-fiction", # Science Fiction
    10770: "tv-movie",      # TV Movie
    53: "thriller",         # Thriller
    10752: "war",           # War
    37: "western"           # Western
}

def genre_ids_to_tags(genre_ids: list) -> list:
    return [GENRE_TAG_MAP.get(gid, f"genre-{gid}") for gid in genre_ids]
```

### Rating to Intensity Mapping

**MPAA/TV Ratings → Intensity Tags:**
```python
RATING_TAG_MAP = {
    "G": "very-mild",
    "PG": "mild",
    "PG-13": "moderate",
    "R": "strong",
    "TV-Y": "preschool",
    "TV-Y7": "young-kids",
    "TV-G": "very-mild",
    "TV-PG": "mild",
    "TV-14": "moderate",
    "TV-MA": "strong"
}
```

### Streaming Platform Normalization

**TMDB/MOTN Provider Names → Axolotly Names:**
```python
PLATFORM_NAME_MAP = {
    "netflix": "Netflix",
    "disney": "Disney+",
    "disneyplus": "Disney+",
    "hulu": "Hulu",
    "amazon": "Prime Video",
    "prime": "Prime Video",
    "hbo": "Max",
    "hbomax": "Max",
    "max": "Max",
    "peacock": "Peacock",
    "youtube": "YouTube"
}
```

## Error Handling

### API Request Failures

**Retry Logic:**
```python
from tenacity import retry, stop_after_attempt, wait_exponential

@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=4, max=10)
)
async def fetch_with_retry(url: str, params: dict):
    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.get(url, params=params)
        response.raise_for_status()
        return response.json()
```

### Rate Limit Handling

**TMDB Rate Limits:**
```python
import asyncio
from datetime import datetime, timedelta

request_count = 0
request_window_start = datetime.utcnow()

async def rate_limited_request(url: str, params: dict):
    global request_count, request_window_start
    
    # Reset window after 10 seconds
    if datetime.utcnow() - request_window_start > timedelta(seconds=10):
        request_count = 0
        request_window_start = datetime.utcnow()
    
    # Wait if at limit
    if request_count >= 40:
        await asyncio.sleep(10)
        request_count = 0
        request_window_start = datetime.utcnow()
    
    # Make request
    request_count += 1
    return await fetch_with_retry(url, params)
```

### Fallback Strategies

**Missing Data Handling:**
```python
# If TMDB doesn't have episode data
if not tmdb_episodes:
    # Fall back to Fandom wiki
    episodes = await scrape_fandom_episodes(wiki_url, tmdb_id)

# If no deep link from MOTN
if not motn_deep_link:
    # Use community-reported links
    deep_link = get_community_deep_link(tmdb_id, platform)

# If no poster image
if not poster_path:
    # Use placeholder image
    poster_path = "/images/placeholder-poster.png"
```

## API Cost Optimization

### Caching Strategy

**Three-Tier Caching:**
1. **Application Memory:** Recently accessed data
2. **Redis:** Medium-term caching (hours)
3. **PostgreSQL:** Long-term caching (permanent)

### Batch Operations

**Batch Episode Loading:**
```python
# Instead of 1 request per episode
for episode in episodes:
    load_episode(episode_id)  # ❌ Inefficient

# Load entire season in 1 request
season_data = load_season(season_number)  # ✅ Efficient
```

### Minimal API Calls

**Smart Fetching:**
- Only fetch missing data
- Cache indefinitely for static data (titles, episodes)
- Refresh only when needed (streaming availability)

## Integration Testing

**Mock API Responses:**
```python
import pytest
from unittest.mock import patch

@pytest.mark.asyncio
@patch('httpx.AsyncClient.get')
async def test_tmdb_search(mock_get):
    mock_get.return_value.json.return_value = {
        "results": [{"id": 123, "title": "Test Movie"}]
    }
    
    results = await search_tmdb("test")
    assert len(results["results"]) == 1
    assert results["results"][0]["title"] == "Test Movie"
```

---

Axolotly's API integrations are carefully designed to maximize data quality while minimizing costs and API usage through aggressive caching and smart data normalization.
