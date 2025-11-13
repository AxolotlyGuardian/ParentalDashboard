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

-   **Database**: PostgreSQL
-   **API**:
    -   TMDB API (The Movie Database) for movie/TV show metadata
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