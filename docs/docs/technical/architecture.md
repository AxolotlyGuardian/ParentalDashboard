# System Architecture

Axolotly is built with a modern, scalable architecture using industry-standard technologies. This document provides a high-level overview of the system design.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                          USERS                                  │
├──────────────────┬──────────────────────┬─────────────────────┤
│ Parent Dashboard │   Kids Launcher      │  Admin Dashboard    │
│   (Web Browser)  │  (Android App)       │   (Web Browser)     │
└──────────────────┴──────────────────────┴─────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                      FRONTEND LAYER                             │
├─────────────────────────────────────────────────────────────────┤
│  Next.js 15 (React) - TypeScript - Tailwind CSS                │
│  - Server Components  - Client Components  - API Routes        │
└─────────────────────────────────────────────────────────────────┘
                             │
                             ▼ HTTP/REST
┌─────────────────────────────────────────────────────────────────┐
│                       BACKEND LAYER                             │
├─────────────────────────────────────────────────────────────────┤
│  FastAPI (Python) - High-performance REST API                  │
│  - JWT Authentication - Role-Based Access Control              │
│  - SQLAlchemy ORM - Pydantic Validation                        │
└─────────────────────────────────────────────────────────────────┘
           │               │               │
           ▼               ▼               ▼
┌─────────────┐  ┌─────────────────┐  ┌───────────────┐
│ PostgreSQL  │  │ APScheduler     │  │ Redis (Cache) │
│ Database    │  │ Background Jobs │  │ Optional      │
└─────────────┘  └─────────────────┘  └───────────────┘
                             │
                             ▼ HTTP
┌─────────────────────────────────────────────────────────────────┐
│                   EXTERNAL APIS                                 │
├──────────────────────┬──────────────────────┬───────────────────┤
│ TMDB API             │ Movie of the Night   │ Fandom Wiki       │
│ (Content Metadata)   │ (Deep Links)         │ (Episode Tags)    │
└──────────────────────┴──────────────────────┴───────────────────┘
```

## Technology Stack

### Frontend

| Component | Technology | Purpose |
|-----------|------------|---------|
| **Framework** | Next.js 15 | React-based web framework |
| **Language** | TypeScript | Type-safe JavaScript |
| **Styling** | Tailwind CSS | Utility-first CSS framework |
| **State Management** | React Hooks | Local state management |
| **API Client** | Fetch API | HTTP requests to backend |
| **Build Tool** | Next.js Turbopack | Fast bundling and hot reload |

### Backend

| Component | Technology | Purpose |
|-----------|------------|---------|
| **Framework** | FastAPI | Modern Python web framework |
| **Language** | Python 3.11+ | High-level programming language |
| **ORM** | SQLAlchemy | Database object-relational mapping |
| **Validation** | Pydantic | Data validation and serialization |
| **Authentication** | JWT (JSON Web Tokens) | Stateless authentication |
| **Password Hashing** | bcrypt | Secure password storage |
| **Scheduler** | APScheduler | Background task scheduling |

### Database

| Component | Technology | Purpose |
|-----------|------------|---------|
| **Primary Database** | PostgreSQL | Relational database |
| **Cache** | Redis (optional) | API response caching |
| **Migrations** | SQLAlchemy | Database schema versioning |

### Infrastructure

| Component | Technology | Purpose |
|-----------|------------|---------|
| **Hosting** | Replit | Development and deployment platform |
| **API Gateway** | Built-in | HTTP routing and load balancing |
| **Environment Variables** | Replit Secrets | Secure configuration management |

## System Components

### 1. Parent Dashboard (Frontend)

**Technology:** Next.js 15, React, TypeScript, Tailwind CSS

**Key Features:**
- Server-side rendering for fast page loads
- Client-side interactivity for dynamic content
- Responsive design (mobile, tablet, desktop)
- Real-time content search with TMDB
- JWT-based authentication

**Pages:**
- `/parent` - Dashboard home with tabs (Search, Policies, Profiles, Devices, My Services)
- `/login` - Parent login page
- `/signup` - Parent registration page
- `/` - Public homepage

**Components:**
- `<ServiceSelection>` - Streaming service checkbox interface
- `<ContentActionModal>` - Detailed title information modal
- `<DeviceList>` - Paired device management
- `<ProfileManager>` - Kid profile CRUD

### 2. Kids Launcher (Mobile)

**Technology:** Android (Kotlin/Java)

**Key Features:**
- Home screen replacement
- PIN-based profile authentication
- Visual content grid with posters
- Deep link integration for streaming apps
- Offline content caching (roadmap)

**API Integration:**
- `POST /api/launcher/pair` - Device pairing
- `GET /api/launcher/approved-content` - Fetch allowed content
- `POST /api/launcher/report-deep-link` - Submit discovered URLs

### 3. Backend API (FastAPI)

**Technology:** FastAPI, Python, SQLAlchemy, Pydantic

**Architecture Pattern:** Layered architecture

```
┌─────────────────────────────────────┐
│         API Routes Layer            │
│  (auth.py, catalog.py, etc.)        │
└─────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────┐
│      Business Logic Layer           │
│  (auth_utils.py, services)          │
└─────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────┐
│        Data Access Layer            │
│  (models.py, SQLAlchemy ORM)        │
└─────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────┐
│          PostgreSQL                 │
└─────────────────────────────────────┘
```

**Key Modules:**
- `app.py` - Main application entry point, router registration
- `models.py` - Database models (User, Title, Episode, etc.)
- `auth.py` - Authentication routes (login, signup)
- `auth_utils.py` - JWT utilities, password hashing
- `routes/` - Feature-specific route modules
  - `catalog.py` - Content search and discovery
  - `services.py` - Streaming service selection
  - `launcher.py` - Device API endpoints
  - `admin.py` - Admin dashboard endpoints
- `db.py` - Database connection and session management
- `config.py` - Configuration and environment variables

### 4. Admin Dashboard (Frontend)

**Technology:** Next.js 15, React, TypeScript

**Key Features:**
- Role-based access control (admin only)
- Content moderation interface
- Fandom Wiki scraping tool
- Bulk TMDB operations
- Deep link verification

**Pages:**
- `/admin` - Admin dashboard home
- `/admin/reports` - Content reports queue
- `/admin/tags` - Tag management
- `/admin/titles` - Title database
- `/admin/episodes` - Episode link management
- `/admin/users` - Parent/kid/device oversight

## Data Flow

### Content Search Flow

```
1. Parent enters search query
   ↓
2. Frontend sends GET /api/catalog/search?query=bluey
   ↓
3. Backend validates JWT token
   ↓
4. Backend checks family's selected streaming services
   ↓
5. Backend queries TMDB API
   ↓
6. Backend filters results by selected services
   ↓
7. Backend auto-tags content based on TMDB genres
   ↓
8. Backend caches results in PostgreSQL
   ↓
9. Backend returns filtered, tagged results
   ↓
10. Frontend displays results with poster images
```

### Content Approval Flow

```
1. Parent clicks "Allow Title"
   ↓
2. Frontend sends POST /api/policies with title_id
   ↓
3. Backend creates policy record
   ↓
4. If TV show: Background job loads episodes from TMDB
   ↓
5. Backend applies automated tags
   ↓
6. Backend triggers deep link backfill (S1E1)
   ↓
7. Backend returns success
   ↓
8. Frontend updates UI
   ↓
9. Next launcher sync includes new title (within 5 min)
```

### Launcher Content Sync Flow

```
1. Launcher app starts or refreshes (every 5 min)
   ↓
2. Launcher sends GET /api/launcher/approved-content
   ↓
3. Backend validates device auth token
   ↓
4. Backend queries policies for kid_profile_id
   ↓
5. Backend fetches titles with S1E1 deep links
   ↓
6. Backend returns JSON with titles + deep links
   ↓
7. Launcher caches content locally
   ↓
8. Launcher displays poster grid
```

### Deep Link Launch Flow

```
1. Child taps content card in launcher
   ↓
2. Launcher reads S1E1 deep link from cache
   ↓
3. Launcher constructs platform-specific URL
   ↓
4. Launcher calls Android Intent with URL
   ↓
5. Streaming app launches with deep link
   ↓
6. Episode begins playing immediately
```

## Security Architecture

### Authentication Flow

**Parent Authentication:**
```
1. Parent enters email/password
   ↓
2. Backend hashes password with bcrypt
   ↓
3. Backend compares with stored hash
   ↓
4. If match: Generate JWT token (24h expiry)
   ↓
5. Return token to frontend
   ↓
6. Frontend stores token in memory (not localStorage)
   ↓
7. All subsequent requests include token in Authorization header
```

**Kid Authentication (Launcher):**
```
1. Child enters 4-digit PIN
   ↓
2. Launcher sends PIN to backend
   ↓
3. Backend hashes PIN with bcrypt
   ↓
4. Backend compares with stored hash
   ↓
5. If match: Return success + content list
   ↓
6. Launcher loads profile content
```

**Device Authentication:**
```
1. Device pairs with 6-digit code
   ↓
2. Backend generates long-lived JWT (90 days)
   ↓
3. Launcher stores token securely
   ↓
4. Token includes device_id + kid_profile_id
   ↓
5. All API requests validated against token
```

### Authorization Model

**Role-Based Access Control:**

| Role | Access |
|------|--------|
| **Parent** | Dashboard, own family data, policies, devices |
| **Kid** | Launcher, own profile content only |
| **Admin** | Full system access, moderation tools, analytics |

**Data Isolation:**
- Parents can only access their family data
- Kids can only access their approved content
- Devices tied to specific profiles
- Admins have read-only access to user data (no passwords)

### Data Protection

**At Rest:**
- Passwords: bcrypt hashed (10 rounds)
- PINs: bcrypt hashed (10 rounds)
- Database: Encrypted storage (Replit)
- API keys: Stored in Replit Secrets

**In Transit:**
- All HTTP traffic: HTTPS only
- JWT tokens: Signed with secret key
- CORS: Restricted origins
- API rate limiting: Planned

## Scalability Considerations

### Current Architecture

**Single Instance:**
- One FastAPI server instance
- One PostgreSQL database
- Handles moderate load (100-1000 users)

**Bottlenecks:**
- TMDB API rate limit (40 req/10s)
- Database queries for large content libraries
- Deep link backfill operations

### Scaling Strategy

**Horizontal Scaling:**
1. Stateless API design enables multiple instances
2. Load balancer distributes requests
3. Shared PostgreSQL database
4. Redis for distributed caching

**Vertical Scaling:**
- Increase database instance size
- Optimize queries with indexes
- Connection pooling

**Caching:**
- Redis for TMDB API responses
- Content metadata cached in PostgreSQL
- Launcher content lists cached on device

### Performance Optimizations

**Backend:**
- Database indexing on foreign keys
- Async operations for TMDB API calls
- Background jobs for episode loading
- Query optimization with SQLAlchemy

**Frontend:**
- Server-side rendering for fast first paint
- Image lazy loading
- Code splitting
- CDN for static assets (roadmap)

**Launcher:**
- Local content caching (24h)
- Minimal API calls (5-minute refresh)
- Poster image caching
- Efficient network usage

## Deployment Architecture

**Development Environment:**
- Hosted on Replit
- Auto-restart on code changes
- Environment variables via Replit Secrets
- PostgreSQL database included

**Production Readiness:**
- Docker containerization (roadmap)
- CI/CD pipeline (roadmap)
- Database migrations automated
- Zero-downtime deployments (roadmap)

## Monitoring & Logging

**Current Logging:**
- FastAPI request/response logs
- Error logging with stack traces
- Console output for debugging

**Planned Monitoring:**
- Application performance monitoring (APM)
- Error tracking (Sentry or similar)
- Usage analytics
- Uptime monitoring
- Database query performance

## API Design Principles

### RESTful API

**Endpoint Structure:**
- `/api/auth/*` - Authentication
- `/api/catalog/*` - Content search and discovery
- `/api/services/*` - Streaming service selection
- `/api/launcher/*` - Device API
- `/api/admin/*` - Admin operations

**HTTP Methods:**
- `GET` - Retrieve data
- `POST` - Create resource
- `PUT` - Update resource
- `DELETE` - Remove resource

**Response Format:**
```json
{
  "success": true,
  "data": { ... },
  "error": null
}
```

### Versioning (Roadmap)

**URL Versioning:**
- `/api/v1/*` - Version 1 (current, no prefix)
- `/api/v2/*` - Version 2 (future)

**Backward Compatibility:**
- Maintain old versions for 6 months
- Deprecation warnings in responses
- Migration guides for breaking changes

---

Axolotly's architecture prioritizes developer experience, performance, and scalability while maintaining simplicity and security.
