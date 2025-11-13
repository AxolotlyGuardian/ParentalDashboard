# Axolotly

## Overview
Axolotly is a full-stack parental control application designed to manage and enforce media content policies for children. It enables parents to curate accessible movies, TV shows, and applications through a user-friendly interface. Key capabilities include content discovery via the TMDB API, creation of personalized kid profiles, and granular allow/deny policy management. The system integrates with a kid-friendly Android launcher to enforce these policies directly on children's devices, offering a safe and controlled digital environment. The project aims to provide peace of mind for parents while offering an engaging experience for kids, with ambitions for broad market adoption.

## User Preferences
I want iterative development. Ask before making major changes.

## System Architecture

### UI/UX Decisions
The application features a parent dashboard and a kid's launcher. The parent dashboard UI uses a coral-pink (`#F77B8A`) color scheme with rounded corners and card layouts, matching the launcher's aesthetic. Content is displayed with poster-only cards. The kid's launcher provides a grid view of allowed content.

### Technical Implementations
-   **Authentication**: JWT-based for parents (email/password) and PIN-based for kids. All passwords and PINs are hashed using bcrypt. Role-based access control is enforced across all endpoints.
-   **Content Management**: Integrates with TMDB for real-time search and metadata. A nightly script syncs popular titles. Content policies are enforced, and deep links are generated for streaming platforms (e.g., Netflix, Disney+, Amazon Prime Video, Hulu, Peacock, YouTube) with fallback URLs. Content is categorized and grouped by streaming service for easy navigation.
-   **Device Management**: Implements a 3-step pairing flow for Android launcher devices using 6-digit codes. Devices can be renamed and their activity tracked from the parent dashboard.
-   **Deep Linking**: Supports crowdsourced episode-level deep linking where devices report streaming URLs, which are then processed, matched to TMDB episodes, and stored.

### Feature Specifications
-   **Parent Dashboard**: Create and manage kid profiles, search and view TMDB content, create and manage allow/deny policies, view and rename paired devices, track device pairing dates and last active timestamps.
-   **Kids Launcher**: PIN-based login, grid view of allowed content, tap-to-launch, blocked content screen, deep link support for major streaming platforms.
-   **Launcher Device API**: Provides endpoints for device pairing, retrieving approved content organized by streaming service, screen time limits, and app usage logging.

### System Design Choices
-   **Backend**: FastAPI with PostgreSQL database, SQLAlchemy ORM, JWT for authentication, and APScheduler for scheduled tasks.
-   **Frontend**: Next.js 15 (React), TypeScript, and Tailwind CSS.
-   **Security**: JWT for session management, bcrypt for hashing, role-based access control, and CORS enabled.

## External Dependencies

-   **Database**: PostgreSQL, Redis (for API caching)
-   **API**:
    -   TMDB API (The Movie Database) for movie/TV show metadata
    -   Movie of the Night / Streaming Availability API (via RapidAPI) for episode-level deep links and URL enrichment
-   **Authentication**:
    -   JWT (JSON Web Tokens)
    -   bcrypt (for password/PIN hashing)
-   **Scheduled Tasks**: APScheduler
-   **Streaming Platforms**:
    -   Netflix
    -   Disney+
    -   Amazon Prime Video
    -   Hulu
    -   Peacock
    -   YouTube

## Episode Deep Linking with Movie of the Night

The system enriches device-reported episode URLs using the Movie of the Night API (Streaming Availability API via RapidAPI):

### Features
- **Automatic Enrichment**: When devices report episode URLs, the system attempts to enrich them with Movie of the Night metadata
- **Redis Caching**: API responses are cached for 24 hours to reduce API calls and improve performance
- **Metadata Storage**: Enrichment data stored in `enrichment_data` JSON field on `EpisodeLink` records
- **Verification Tracking**: `motn_verified` flag indicates URLs validated by Movie of the Night API
- **Quality Scoring**: `motn_quality_score` field for future ranking and recommendation systems
- **Custom Tags**: `custom_tags` field for manual categorization and filtering

### Database Schema
- **EpisodeLink** enrichment fields:
  - `motn_verified`: Boolean flag for API-verified URLs
  - `motn_quality_score`: Float for quality/popularity metrics
  - `custom_tags`: String for manual tags (comma-separated)
  - `enrichment_data`: JSON text field for full API response
  - `last_enriched_at`: Timestamp of last enrichment attempt

### API Integration
- **Client**: `backend/services/movie_api.py` - MovieAPIClient class
- **Caching**: Redis with 24-hour TTL for episode data, 7-day TTL for URL enrichment
- **Authentication**: RapidAPI key via `MOVIE_OF_THE_NIGHT_API_KEY` environment variable
- **Endpoints Used**:
  - `/shows/series/{tmdb_id}` - Get show details and streaming availability
  - Episode-specific deep link extraction from streaming options
  
### Workflow
1. Device reports episode URL to `/api/launcher/device/episode-report`
2. System matches URL to Episode record
3. Calls `movie_api_client.enrich_deep_link(url)` for metadata
4. Stores enrichment data in EpisodeLink record
5. Sets `motn_verified=True` if API returns data
6. Future requests use cached data (24hr TTL)