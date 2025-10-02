"""
Core configuration settings for AirWatch Pro
Handles environment variables and application settings
"""

import os
from functools import lru_cache
from typing import List, Optional

from pydantic import Field
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings loaded from environment variables"""
    
    # Application Info
    PROJECT_NAME: str = "AirWatch Pro API"
    VERSION: str = "2.0.0"
    DESCRIPTION: str = "Advanced Air Quality Monitoring and Prediction System"
    
    # Server Configuration
    HOST: str = Field(default="0.0.0.0", description="Server host")
    PORT: int = Field(default=8000, description="Server port")
    DEBUG: bool = Field(default=False, description="Debug mode")
    
    # API Configuration
    API_V1_STR: str = "/api/v1"
    
    # Security
    SECRET_KEY: str = Field(..., description="Secret key for JWT tokens")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(default=30, description="Token expiration time")
    
    # CORS
    ALLOWED_HOSTS: str = Field(
        default="http://localhost:3000,http://localhost:5173,http://127.0.0.1:3000",
        description="Allowed CORS origins (comma-separated)"
    )
    
    @property
    def allowed_hosts_list(self) -> List[str]:
        """Get ALLOWED_HOSTS as a list"""
        return [host.strip() for host in self.ALLOWED_HOSTS.split(",")]
    
    # Database - Supabase
    SUPABASE_URL: str = Field(..., description="Supabase project URL")
    SUPABASE_ANON_KEY: str = Field(..., description="Supabase anonymous key")
    SUPABASE_SERVICE_KEY: str = Field(..., description="Supabase service role key")
    
    # Supabase MCP Configuration
    SUPABASE_PROJECT_REF: Optional[str] = Field(default=None, description="Supabase project reference")
    SUPABASE_ACCESS_TOKEN: Optional[str] = Field(default=None, description="Supabase access token for MCP")
    
    # External APIs
    EPA_API_EMAIL: str = Field(..., description="Email for EPA AirNow API")
    
    # NASA TEMPO API (if available)
    NASA_API_KEY: Optional[str] = Field(default=None, description="NASA API key")
    
    # OpenAQ API (public, no key needed)
    OPENAQ_BASE_URL: str = Field(default="https://api.openaq.org/v2", description="OpenAQ API base URL")
    
    # Logging
    LOG_LEVEL: str = Field(default="INFO", description="Logging level")
    LOG_FORMAT: str = Field(
        default="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
        description="Log format"
    )
    
    # Cache Configuration
    CACHE_TTL: int = Field(default=300, description="Cache TTL in seconds (5 minutes)")
    
    # Rate Limiting
    RATE_LIMIT_PER_MINUTE: int = Field(default=60, description="API rate limit per minute")
    
    class Config:
        env_file = ".env"  # Read from backend directory .env file
        case_sensitive = True
        extra = "ignore"  # Ignore unknown variables (like VITE_ prefixed ones)


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance"""
    return Settings()


# Global settings instance
settings = get_settings()