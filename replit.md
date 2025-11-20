# Axolotly

## Overview
Axolotly is a full-stack parental control application designed to manage and enforce media content policies for children. It allows parents to curate accessible movies, TV shows, and applications through a user-friendly interface. Key capabilities include content discovery, creation of personalized kid profiles, and granular allow/deny policy management. The system integrates with a kid-friendly Android launcher to enforce policies directly on children's devices, aiming to provide a safe and controlled digital environment for kids and peace of mind for parents.

## User Preferences
I want iterative development. Ask before making major changes.

## System Architecture

### UI/UX Decisions
The application features a parent dashboard and a kid's launcher. The parent dashboard uses a coral-pink (`#F77B8A`) color scheme with rounded corners and card layouts, matching the launcher's aesthetic. Public-facing pages have a unified navigation header and mobile-responsive design, with the "How It Works" page using a light blue (`#688ac6`) accent color for a softer feel.

### Technical Implementations
-   **Authentication**: JWT-based for parents (email/password) and PIN-based for kids, with bcrypt hashing. Role-based access control is enforced.
-   **Content Management**: Integrates with TMDB for real-time search and metadata. A nightly script syncs popular titles. Full episode data (1,880+ episodes) is loaded from TMDB for all TV shows. Content policies are enforced, and deep links are generated for streaming platforms. Content is categorized and grouped by streaming service.
-   **Automatic Content Tagging**: When a title is added to the parental dashboard, the system automatically assigns appropriate content tags based on TMDB genres, ratings, and metadata. Tags include content warnings (violence, monsters), intensity levels (mild/moderate peril), age appropriateness, and more.
-   **Automatic Episode Loading**: TV shows automatically load all episode data from TMDB in the background when added to a policy, including season/episode metadata, thumbnails, air dates, and descriptions.
-   **Device Management**: Implements a 3-step pairing flow for Android launcher devices using 6-digit codes. Devices can be renamed and their activity tracked.
-   **Deep Linking**: Supports crowdsourced episode-level deep linking where devices report streaming URLs, which are then processed, matched to TMDB episodes, and stored.
-   **Episode Management**: Admin endpoints to bulk-load episodes from TMDB API for all TV shows. Episodes include metadata (thumbnails, air dates, overviews) and can be individually blocked by parents. The backfill system automatically fetches episode 1 deep links from Movie of the Night API for immediate playback capability on launcher devices.

### Feature Specifications
-   **Parent Dashboard**: Manages kid profiles, TMDB content search, allow/deny policies, paired devices (view/rename/track), and content reporting. A "Content Action Modal" provides play options, detailed title information, episode browsing by season, and clickable content tags with visual indicators showing which tags have blocked episodes.
-   **Kids Launcher**: PIN-based login, grid view of allowed content, tap-to-launch, blocked content screen, and deep link support for major streaming platforms.
-   **Launcher Device API**: Endpoints for device pairing, retrieving approved content, screen time limits, app usage logging, and episode deep link reporting.
-   **Admin Dashboard**: Provides comprehensive backend data management (Content Reports, Content Tags, Titles, Episode Links, Parents, Kid Profiles, Devices, Policies) with role-based access control for admin users. Includes a dynamic menu system, Fandom Wiki scraping interface for automated episode tagging, bulk TMDB episode loading, and a one-click Episode 1 Deep Link Backfill feature that automatically fetches verified streaming URLs from the Movie of the Night API for all TV shows.

### System Design Choices
-   **Backend**: FastAPI with PostgreSQL, SQLAlchemy ORM, JWT, and APScheduler.
-   **Frontend**: Next.js 15 (React), TypeScript, and Tailwind CSS.
-   **Security**: JWT for session management, bcrypt for hashing, role-based access control, and CORS.

## External Dependencies

-   **Database**: PostgreSQL, Redis (for API caching)
-   **API**:
    -   TMDB API (The Movie Database)
    -   Movie of the Night / Streaming Availability API (via RapidAPI)
-   **Authentication**:
    -   JWT (JSON Web Tokens)
    -   bcrypt
-   **Scheduled Tasks**: APScheduler
-   **Streaming Platforms**:
    -   Netflix
    -   Disney+
    -   Amazon Prime Video
    -   Hulu
    -   Peacock
    -   YouTube
-   **Fandom Wiki**: For episode-level content tagging via MediaWiki API