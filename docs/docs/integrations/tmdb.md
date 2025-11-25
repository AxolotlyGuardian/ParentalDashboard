# TMDB Integration

The Movie Database (TMDB) is Axolotly's primary source for movie and TV show metadata, providing comprehensive content information for search and discovery.

## Overview

**TMDB API** powers all content search, metadata retrieval, and episode loading in Axolotly.

**Key Data:**
- 1M+ movies and TV shows
- High-quality poster/backdrop images
- Season/episode information
- Genre classifications
- Content ratings
- Cast and crew data

## Integration Points

### 1. Content Search
Real-time search as parents type

### 2. Title Metadata
Complete information when content is added

### 3. Episode Loading
Automatic background loading for TV shows

### 4. Genre-Based Tagging
Automated content tag generation

### 5. Nightly Sync
Popular content cached daily

## API Endpoints Used

**Search Multi:**
- `/search/multi` - Search movies and TV shows

**Title Details:**
- `/movie/{id}` - Movie metadata
- `/tv/{id}` - TV show metadata

**Episodes:**
- `/tv/{id}/season/{season}` - Season episodes

**Images:**
- `/t/p/w500/{path}` - Poster images

## Data Caching

**Strategy:**
- All TMDB data cached in PostgreSQL
- 24-hour cache for search results
- Permanent cache for title metadata
- Redis optional for high-traffic caching

## Rate Limits

**Free Tier:**
- 40 requests per 10 seconds
- Sufficient for most usage

**Optimization:**
- Aggressive caching
- Batch operations
- Background processing

---

TMDB integration provides the content intelligence foundation for Axolotly's parental control system.
