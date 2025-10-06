import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL: str = os.getenv("DATABASE_URL", "")
    JWT_SECRET: str = os.getenv("JWT_SECRET", "guardian-launcher-secret-key-change-in-production")
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24
    TMDB_API_KEY: str = os.getenv("TMDB_API_KEY", "")
    TMDB_API_BASE_URL: str = "https://api.themoviedb.org/3"
    
    class Config:
        env_file = ".env"

settings = Settings()
