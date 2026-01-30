import time
import logging
from collections import defaultdict
from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from db import engine, Base
from routes import auth, catalog, policy, launch, launcher, content_tags, admin, services, subscriptions
from config import settings

logging.basicConfig(level=logging.INFO)
audit_logger = logging.getLogger("audit")

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Guardian Launcher API")

# --- Security Headers Middleware ---
class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        return response

# --- Rate Limiting Middleware ---
class RateLimitMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, requests_per_minute: int = 60):
        super().__init__(app)
        self.requests_per_minute = requests_per_minute
        self.requests: dict[str, list[float]] = defaultdict(list)

    async def dispatch(self, request: Request, call_next):
        client_ip = request.client.host if request.client else "unknown"
        now = time.time()
        window = now - 60

        # Clean old entries
        self.requests[client_ip] = [
            t for t in self.requests[client_ip] if t > window
        ]

        if len(self.requests[client_ip]) >= self.requests_per_minute:
            return Response(
                content='{"detail":"Rate limit exceeded. Try again later."}',
                status_code=429,
                media_type="application/json",
                headers={"Retry-After": "60"},
            )

        self.requests[client_ip].append(now)
        return await call_next(request)

# --- Audit Logging Middleware ---
AUDIT_PATHS = {
    "/api/auth/parent/signup", "/api/auth/parent/login",
    "/api/auth/kid/login", "/api/auth/kid/profile",
    "/api/pairing/initiate", "/api/pairing/confirm",
    "/api/device/pair", "/api/pair",
    "/api/subscriptions/create-checkout",
    "/api/subscriptions/webhook",
}

class AuditLoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        path = request.url.path
        if path in AUDIT_PATHS or path.startswith("/api/admin"):
            client_ip = request.client.host if request.client else "unknown"
            audit_logger.info(
                "AUDIT | %s %s | status=%s | ip=%s | user-agent=%s",
                request.method,
                path,
                response.status_code,
                client_ip,
                request.headers.get("user-agent", ""),
            )
        return response

# Apply middleware (order matters: last added = first executed)
app.add_middleware(AuditLoggingMiddleware)
app.add_middleware(RateLimitMiddleware, requests_per_minute=60)
app.add_middleware(SecurityHeadersMiddleware)

# CORS - restrict to known origins
allowed_origins = ["http://localhost:3000", "http://localhost:8000"]
if settings.ALLOWED_ORIGINS:
    allowed_origins.extend(
        origin.strip() for origin in settings.ALLOWED_ORIGINS.split(",") if origin.strip()
    )

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["Authorization", "Content-Type", "X-Device-ID", "X-API-Key"],
)

app.include_router(auth.router, prefix="/api")
app.include_router(catalog.router, prefix="/api")
app.include_router(policy.router, prefix="/api")
app.include_router(launch.router, prefix="/api")
app.include_router(launcher.router, prefix="/api")
app.include_router(content_tags.router, prefix="/api")
app.include_router(admin.router, prefix="/api")
app.include_router(services.router, prefix="/api")
app.include_router(subscriptions.router, prefix="/api")

@app.get("/")
def root():
    return {"message": "Guardian Launcher API is running"}

@app.get("/health")
def health_check():
    return {"status": "healthy"}
