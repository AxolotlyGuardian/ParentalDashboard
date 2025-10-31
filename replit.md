# Axolotly (formerly Guardian Launcher)

A parental control application for managing kids' access to media content with policy enforcement and a kid-friendly launcher.

## Overview

Axolotly is a full-stack application that allows parents to control which movies, TV shows, and apps their children can access. Parents can search for content using the TMDB API, create kid profiles, and manage allow/deny policies for each child. The system also supports device pairing for kid-friendly launcher apps that enforce parental controls on Android devices.

## Project Structure

```
/backend          - FastAPI backend with PostgreSQL
  /routes         - API route handlers
    auth.py       - Parent/kid authentication
    catalog.py    - TMDB content search
    policy.py     - Allow/deny list management
    launch.py     - Content launch validation
    launcher.py   - Device pairing & launcher API
  /scripts        - Utility scripts
    sync_catalog.py - Nightly TMDB metadata sync
  app.py          - Main FastAPI application
  models.py       - SQLAlchemy database models
  db.py           - Database configuration
  config.py       - Application settings
  auth_utils.py   - JWT authentication utilities

/frontend         - Next.js React application
  /app            - App router pages
    /parent       - Parent dashboard
    /kids         - Kids launcher
    /mode-select  - Mode selection page
  /lib            - Utilities
    api.ts        - API client functions
    auth.ts       - Token management
```

## Technology Stack

### Backend
- FastAPI (Python web framework)
- PostgreSQL (database)
- SQLAlchemy (ORM)
- JWT (JSON Web Tokens for authentication)
- bcrypt (password/PIN hashing)
- TMDB API (movie/TV metadata)
- httpx (async HTTP client)
- APScheduler (scheduled tasks)

### Frontend
- Next.js 15 (React framework)
- TypeScript
- Tailwind CSS
- Axios (HTTP client)
- jwt-decode (token parsing)

## Features

### Authentication
- **Parent Login**: JWT-based authentication with email/password
- **Kid Login**: PIN-based authentication for child profiles
- Secure password/PIN hashing with bcrypt
- Role-based access control (parent vs kid permissions)

### Parent Dashboard
- Create and manage multiple kid profiles
- Search TMDB for movies and TV shows
- View content metadata (posters, ratings, descriptions)
- Create allow/deny policies per kid profile
- Manage existing policies with visual feedback

### Kids Launcher
- PIN-based login for kids
- Grid view of allowed content with posters
- Tap-to-launch functionality
- Block screen for denied content with friendly messages
- Deep link support for streaming platforms:
  - Netflix
  - Disney+
  - Amazon Prime Video
  - Hulu
  - Peacock
  - YouTube

### Content Management
- TMDB API integration for real-time content search
- Nightly sync script for popular movies and TV shows
- Policy enforcement system
- Deep link generation with fallback URLs

## Database Models

### Streaming Content System
- **User**: Parent accounts with email/password
- **KidProfile**: Child profiles with name, age, PIN
- **Title**: Media content from TMDB (movies/TV shows)
- **Policy**: Allow/deny rules linking profiles to titles

### Launcher Device System
- **Device**: Paired launcher devices with secure authentication
- **PairingCode**: 6-digit codes for device pairing (24hr expiration)
- **App**: Available apps with metadata (name, package, icons, age rating)
- **FamilyApp**: App permissions per family (enabled/disabled)
- **TimeLimit**: Screen time restrictions per family
- **UsageLog**: App usage tracking for analytics

## Security

- All passwords and PINs are hashed with bcrypt
- JWT tokens for session management
- Role-based access control on all endpoints
- Parent endpoints require parent JWT authentication
- Kid endpoints require kid JWT authentication with profile ownership validation
- CORS enabled for frontend integration

## Environment Variables

Required environment variables:
- `DATABASE_URL` - PostgreSQL connection string (auto-configured)
- `TMDB_API_KEY` - The Movie Database API key
- `JWT_SECRET` - Secret key for JWT signing (change in production)

## API Endpoints

### Authentication
- `POST /auth/parent/signup` - Register new parent account
- `POST /auth/parent/login` - Parent login with JWT
- `POST /auth/kid/login` - Kid login with PIN
- `POST /auth/kid/profile` - Create kid profile (parent only)
- `GET /auth/kid/profiles/{parent_id}` - Get kid profiles (parent only)

### Catalog
- `GET /catalog/search` - Search TMDB titles (parent only)
- `GET /catalog/titles/{title_id}` - Get title details (parent only)
- `GET /catalog/titles` - List all cached titles (parent only)

### Policy Management
- `POST /policy/` - Create/update policy (parent only)
- `GET /policy/profile/{kid_profile_id}` - Get profile policies (parent only)
- `PUT /policy/{policy_id}` - Update policy (parent only)
- `DELETE /policy/{policy_id}` - Delete policy (parent only)
- `GET /policy/allowed/{kid_profile_id}` - Get allowed titles (public)

### Launch Control
- `POST /launch/check` - Validate launch permission (kid only)
- `GET /launch/title/{title_id}/profile/{kid_profile_id}` - Check title status (kid only)

### Launcher Device API
- `POST /api/pair` - Pair device with 6-digit code (returns device credentials)
- `POST /api/pairing-code/generate` - Generate pairing code (parent auth required)
- `GET /api/apps` - Get approved apps for device's family (device auth required)
- `GET /api/time-limits` - Get screen time restrictions (device auth required)
- `GET /api/stats` - Get dashboard statistics (device auth required)
- `POST /api/usage-logs` - Log app usage for analytics (device auth required)

## Running the Application

Both workflows are configured and running:
- **Backend API**: Port 8000 (FastAPI with uvicorn)
- **Frontend**: Port 5000 (Next.js development server)

The application is fully functional with:
1. Parent dashboard for content management
2. Kids launcher for safe content access
3. TMDB integration for content metadata
4. Secure authentication and authorization
5. Deep linking to streaming platforms

## Recent Changes

- 2025-10-06: Initial implementation with complete parent/kid workflows
- 2025-10-06: Added JWT authentication middleware and role-based access control
- 2025-10-06: Secured all endpoints with proper authentication dependencies
- 2025-10-06: Fixed kid profile creation to accept JSON body
- 2025-10-06: Implemented ownership validation across all endpoints
- 2025-10-06: Removed PIN authentication - kids now login by tapping profile
- 2025-10-06: Integrated TMDB watch provider API for platform filtering
- 2025-10-06: Added provider data storage (providers, deep_links) to Title model
- 2025-10-06: Implemented smart platform filtering - shows only available streaming services
- 2025-10-06: Added TMDB JustWatch deep linking with fallback to platform search URLs
- 2025-10-06: Fixed back button visibility with text-gray-800 styling
- 2025-10-08: Rebranded to "Axolotly" with complete brand identity and marketing pages
- 2025-10-08: Added pricing page with subscription tiers and bundle discounts
- 2025-10-08: Built launcher device API for kid-friendly Android launcher integration
- 2025-10-08: Implemented device pairing system with 6-digit codes and secure authentication
- 2025-10-08: Added app management, time limits, usage tracking, and dashboard stats
- 2025-10-08: Secured pairing code generation with parent authentication requirement
- 2025-10-08: Fixed usage logging to handle invalid app IDs gracefully
- 2025-10-09: Modified launcher API to return approved streaming content instead of Android apps
- 2025-10-09: Launcher now displays parent-approved movies/TV shows from policy system
- 2025-10-09: API accessible on port 8000 with full TMDB poster/backdrop images
- 2025-10-09: Rethemed parent dashboard with coral-pink (#F77B8A) to match launcher
- 2025-10-09: Updated all parent dashboard UI with rounded corners, card layouts, and coral-pink accents
- 2025-10-09: Fixed pairing endpoint to return HTTP 401 (instead of 404) for invalid/expired codes
- 2025-10-22: Implemented device-first pairing model with pre-generated 6-digit codes
- 2025-10-22: Parent signup now requires device code from physical device sticker
- 2025-10-22: Updated PairingCode model with pre_generated flag and nullable expiration
- 2025-10-22: Device automatically pairs to family during account signup
- 2025-10-22: Replaced emoji logos with official Axolotly logo across all pages
- 2025-10-31: Reworked device pairing to link devices directly to kid profiles
- 2025-10-31: Added "Add Device" UI in parent dashboard with device ID input
- 2025-10-31: Parents now enter launcher-generated device ID and select kid profile
- 2025-10-31: Added kid_profile_id column to devices table with FK relationship
- 2025-10-31: Implemented security validation to prevent cross-family device hijacking
- 2025-10-31: Updated parent dashboard design to match launcher aesthetic (coral-pink, poster-only cards)
