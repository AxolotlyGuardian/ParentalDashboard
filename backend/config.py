import os
import secrets
from pydantic_settings import BaseSettings


def _get_jwt_secret() -> str:
    secret = os.getenv("JWT_SECRET", "")
    if not secret:
        raise ValueError(
            "JWT_SECRET environment variable is required. "
            "Generate one with: python -c \"import secrets; print(secrets.token_urlsafe(64))\""
        )
    return secret


class Settings(BaseSettings):
    DATABASE_URL: str = os.getenv("DATABASE_URL", "")
    JWT_SECRET: str = _get_jwt_secret()
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24
    TMDB_API_KEY: str = os.getenv("TMDB_API_KEY", "")
    TMDB_API_BASE_URL: str = "https://api.themoviedb.org/3"
    STRIPE_SECRET_KEY: str = os.getenv("STRIPE_SECRET_KEY", "")
    STRIPE_PUBLISHABLE_KEY: str = os.getenv("STRIPE_PUBLISHABLE_KEY", "")
    STRIPE_WEBHOOK_SECRET: str = os.getenv("STRIPE_WEBHOOK_SECRET", "")
    ALLOWED_ORIGINS: str = os.getenv("ALLOWED_ORIGINS", "")

    class Config:
        env_file = ".env"

settings = Settings()
