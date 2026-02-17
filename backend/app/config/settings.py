from functools import lru_cache
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings with environment variable support."""
    
    model_config = SettingsConfigDict(
        env_file=".env.local",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )
    
    # Application
    ENVIRONMENT: str = "development"
    APP_NAME: str = "Vora API"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True
    
    # CORS
    ALLOWED_ORIGINS: List[str] = ["http://localhost:3000"]
    
    # Supabase
    SUPABASE_URL: str
    SUPABASE_KEY: str
    # Note: Supabase uses ECC P-256 asymmetric cryptography for JWT
    # JWT verification is handled automatically by Supabase client
    
    # OpenAI
    OPENAI_API_KEY: str
    OPENAI_MODEL: str = "gpt-4o"
    
    # Google APIs
    GOOGLE_PLACES_API_KEY: str
    GOOGLE_MAPS_API_KEY: str = ""
    
    # Rate Limiting
    RATE_LIMIT_PER_MINUTE: int = 60
    
    # Security
    SECRET_KEY: str = "change-me-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()
