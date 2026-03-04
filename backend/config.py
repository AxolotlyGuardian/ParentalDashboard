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


def _get_pairing_encryption_key() -> str:
    """Fernet key used to encrypt the one-time API key during device pairing.
    Must be a 32-byte URL-safe base64-encoded value (Fernet.generate_key()).
    Generate with: python -c \"from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())\"
    """
    key = os.getenv("PAIRING_ENCRYPTION_KEY", "")
    if not key:
        raise ValueError(
            "PAIRING_ENCRYPTION_KEY environment variable is required. "
            "Generate one with: python -c \"from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())\""
        )
    return key


class Settings(BaseSettings):
    DATABASE_URL: str = os.getenv("DATABASE_URL", "")

    # JWT — short-lived access tokens + long-lived refresh tokens
    JWT_SECRET: str = _get_jwt_secret()
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30          # 30 minutes (was 24 hours)
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30            # 30-day refresh token

    # Pairing encryption (Fernet symmetric key)
    PAIRING_ENCRYPTION_KEY: str = _get_pairing_encryption_key()

    # External APIs
    TMDB_API_KEY: str = os.getenv("TMDB_API_KEY", "")
    TMDB_API_BASE_URL: str = "https://api.themoviedb.org/3"
    MOVIE_OF_THE_NIGHT_API_KEY: str = os.getenv("MOVIE_OF_THE_NIGHT_API_KEY", "")

    # Email (for verification and password reset)
    SMTP_HOST: str = os.getenv("SMTP_HOST", "")
    SMTP_PORT: int = int(os.getenv("SMTP_PORT", "587"))
    SMTP_USER: str = os.getenv("SMTP_USER", "")
    SMTP_PASSWORD: str = os.getenv("SMTP_PASSWORD", "")
    EMAIL_FROM: str = os.getenv("EMAIL_FROM", "noreply@axolotly.app")
    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "https://axolotly.app")

    # Redis
    REDIS_HOST: str = os.getenv("REDIS_HOST", "localhost")
    REDIS_PORT: int = int(os.getenv("REDIS_PORT", "6379"))

    # Stripe
    STRIPE_SECRET_KEY: str = os.getenv("STRIPE_SECRET_KEY", "")
    STRIPE_PUBLISHABLE_KEY: str = os.getenv("STRIPE_PUBLISHABLE_KEY", "")
    STRIPE_WEBHOOK_SECRET: str = os.getenv("STRIPE_WEBHOOK_SECRET", "")
    # Monthly Stripe price IDs
    STRIPE_PRICE_STARTER: str = os.getenv("STRIPE_PRICE_STARTER", "")
    STRIPE_PRICE_FAMILY: str = os.getenv("STRIPE_PRICE_FAMILY", "")
    STRIPE_PRICE_EDUCATOR: str = os.getenv("STRIPE_PRICE_EDUCATOR", "")
    # Annual Stripe price IDs (create these in Stripe dashboard as annual recurring prices)
    STRIPE_PRICE_STARTER_ANNUAL: str = os.getenv("STRIPE_PRICE_STARTER_ANNUAL", "")
    STRIPE_PRICE_FAMILY_ANNUAL: str = os.getenv("STRIPE_PRICE_FAMILY_ANNUAL", "")
    STRIPE_PRICE_EDUCATOR_ANNUAL: str = os.getenv("STRIPE_PRICE_EDUCATOR_ANNUAL", "")

    # CORS
    ALLOWED_ORIGINS: str = os.getenv("ALLOWED_ORIGINS", "")

    class Config:
        env_file = ".env"


settings = Settings()
