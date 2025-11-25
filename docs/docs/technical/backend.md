# Backend (FastAPI)

The Axolotly backend is built with FastAPI, providing a high-performance REST API for all client applications.

## Technology Stack

- **Framework:** FastAPI 0.100+
- **Language:** Python 3.11+
- **ORM:** SQLAlchemy 2.0
- **Validation:** Pydantic V2
- **Authentication:** JWT (python-jose)
- **Password Hashing:** bcrypt
- **Scheduler:** APScheduler
- **HTTP Client:** httpx (async)

## Project Structure

```
backend/
├── app.py                 # Main application entry point
├── models.py             # SQLAlchemy database models
├── db.py                 # Database connection management
├── auth.py               # Authentication routes
├── auth_utils.py         # JWT utilities, password hashing
├── config.py             # Configuration and settings
├── routes/               # Feature-specific route modules
│   ├── catalog.py       # Content search and discovery
│   ├── services.py      # Streaming service selection
│   ├── launcher.py      # Device API endpoints
│   ├── admin.py         # Admin dashboard endpoints
│   └── profiles.py      # Kid profile management
└── requirements.txt      # Python dependencies
```

## Key Features

### 1. FastAPI Application

**app.py:**
```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Axolotly API")

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Router registration
app.include_router(auth.router, prefix="/api")
app.include_router(catalog.router, prefix="/api")
app.include_router(services.router, prefix="/api")
# ... more routers
```

### 2. Database Models

**models.py** defines all SQLAlchemy models:

**Key Models:**
- `User` - Parent accounts with email/password
- `KidProfile` - Child profiles with PINs
- `Title` - Movies and TV shows from TMDB
- `Episode` - TV show episodes with metadata
- `KidProfilesTitle` - Many-to-many policy junction
- `Device` - Paired launcher devices
- `StreamingServiceSelection` - Family service subscriptions
- `ContentTag` - Content warning/theme tags
- `EpisodeLink` - Crowdsourced deep links

### 3. Authentication

**JWT-Based Authentication:**

**Login Flow:**
```python
@router.post("/login")
def login(credentials: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == credentials.email).first()
    if not user or not verify_password(credentials.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_access_token(data={"sub": user.email, "role": user.role})
    return {"access_token": token, "token_type": "bearer"}
```

**Protected Routes:**
```python
def require_parent(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    # Decode JWT, verify role
    # Return User object
    ...
```

### 4. Content API

**TMDB Integration:**

**Search Endpoint:**
```python
@router.get("/catalog/search")
async def search_titles(
    query: str,
    current_user: User = Depends(require_parent),
    db: Session = Depends(get_db)
):
    # Get family's selected services
    # Query TMDB API
    # Filter by services
    # Auto-tag content
    # Cache in database
    # Return results
    ...
```

### 5. Background Jobs

**APScheduler Tasks:**

**Nightly Popular Content Sync:**
```python
scheduler = BackgroundScheduler()

@scheduler.scheduled_job('cron', hour=0, minute=0)
def sync_popular_content():
    # Fetch TMDB popular movies/TV
    # Cache metadata
    # Apply automated tags
    ...
```

## API Endpoints

### Authentication

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/signup` | Create parent account | None |
| POST | `/api/login` | Parent login | None |

### Content Catalog

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/catalog/search` | Search TMDB content | Parent |
| GET | `/api/catalog/titles/{id}` | Get title details | Parent |
| POST | `/api/catalog/policies` | Allow/deny title | Parent |

### Streaming Services

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/services` | Get selected services | Parent |
| POST | `/api/services` | Update service selections | Parent |

### Kid Profiles

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/profiles` | List kid profiles | Parent |
| POST | `/api/profiles` | Create kid profile | Parent |
| PUT | `/api/profiles/{id}` | Update profile | Parent |
| DELETE | `/api/profiles/{id}` | Delete profile | Parent |

### Device Management

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/devices/pair-code` | Generate pairing code | Parent |
| GET | `/api/devices` | List paired devices | Parent |
| DELETE | `/api/devices/{id}` | Unpair device | Parent |

### Launcher API

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/launcher/pair` | Pair device | None (code) |
| GET | `/api/launcher/approved-content` | Get allowed content | Device token |
| POST | `/api/launcher/report-deep-link` | Submit deep link | Device token |

### Admin API

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/admin/reports` | Get content reports | Admin |
| POST | `/api/admin/reports/{id}/resolve` | Resolve report | Admin |
| GET | `/api/admin/tags` | List all tags | Admin |
| POST | `/api/admin/scrape-fandom` | Scrape Fandom wiki | Admin |
| POST | `/api/admin/backfill-episodes` | Load TMDB episodes | Admin |
| POST | `/api/admin/backfill-deep-links` | Fetch S1E1 links | Admin |

## Security Features

**Password Hashing:**
```python
import bcrypt

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt(rounds=10)).decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))
```

**JWT Token Generation:**
```python
from jose import jwt
from datetime import datetime, timedelta

def create_access_token(data: dict, expires_delta: timedelta = timedelta(hours=24)):
    to_encode = data.copy()
    expire = datetime.utcnow() + expires_delta
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm="HS256")
```

**CORS Protection:**
- Restricts origins to trusted domains
- Credentials support enabled
- Preflight request handling

## Performance Optimizations

**Database Connection Pooling:**
```python
engine = create_engine(
    DATABASE_URL,
    pool_size=20,
    max_overflow=10,
    pool_pre_ping=True
)
```

**Async HTTP Requests:**
```python
import httpx

async with httpx.AsyncClient() as client:
    response = await client.get(url, params=params)
```

**Redis Caching (Optional):**
```python
# Cache TMDB API responses
redis.setex(f"tmdb:{tmdb_id}", 3600, json.dumps(data))
```

## Error Handling

**HTTPException:**
```python
from fastapi import HTTPException

raise HTTPException(status_code=404, detail="Title not found")
```

**Global Exception Handler:**
```python
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"}
    )
```

## Testing

**Unit Tests:**
```python
from fastapi.testclient import TestClient

client = TestClient(app)

def test_login():
    response = client.post("/api/login", json={
        "email": "test@example.com",
        "password": "password123"
    })
    assert response.status_code == 200
    assert "access_token" in response.json()
```

## Deployment

**Running the Server:**
```bash
cd backend
uvicorn app:app --host 0.0.0.0 --port 8000
```

**Environment Variables:**
- `DATABASE_URL` - PostgreSQL connection string
- `SECRET_KEY` - JWT signing key
- `TMDB_API_KEY` - TMDB API key
- `MOVIE_OF_THE_NIGHT_API_KEY` - Deep link API key

---

The FastAPI backend provides a robust, performant foundation for all Axolotly client applications while maintaining security and scalability.
