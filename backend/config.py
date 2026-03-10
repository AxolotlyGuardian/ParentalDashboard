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
    REDIS_HOST: str = os.getenv("REDIS_HOST", "localhost")
    REDIS_PORT: int = int(os.getenv("REDIS_PORT", "6379"))
    STRIPE_SECRET_KEY: str = os.getenv("STRIPE_SECRET_KEY", "")
    STRIPE_PUBLISHABLE_KEY: str = os.getenv("STRIPE_PUBLISHABLE_KEY", "")
    STRIPE_WEBHOOK_SECRET: str = os.getenv("STRIPE_WEBHOOK_SECRET", "")
    STRIPE_PRICE_MONTHLY: str = os.getenv("STRIPE_PRICE_MONTHLY", "")
    STRIPE_PRICE_ANNUAL: str = os.getenv("STRIPE_PRICE_ANNUAL", "")
    STRIPE_PRICE_DEVICE: str = os.getenv("STRIPE_PRICE_DEVICE", "")
    ALLOWED_ORIGINS: str = os.getenv("ALLOWED_ORIGINS", "")
    SENDGRID_API_KEY: str = os.getenv("SENDGRID_API_KEY", "")
    EMAIL_FROM: str = os.getenv("EMAIL_FROM", "noreply@axolotly.app")
    FIREBASE_SERVER_KEY: str = os.getenv("FIREBASE_SERVER_KEY", "")

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
    # Stripe price IDs — single Axolotly plan, monthly and annual
    # Create these in the Stripe dashboard:
    #   Monthly: $14.99/month recurring
    #   Annual:  $149.90/year recurring (2 months free)
    STRIPE_PRICE_AXOLOTLY: str = os.getenv("STRIPE_PRICE_AXOLOTLY", "")
    STRIPE_PRICE_AXOLOTLY_ANNUAL: str = os.getenv("STRIPE_PRICE_AXOLOTLY_ANNUAL", "")

    # CORS
    ALLOWED_ORIGINS: str = os.getenv("ALLOWED_ORIGINS", "")

    class Config:
        env_file = ".env"


settings = Settings()
