"""
AirWatch Backend Configuration
FastAPI application configuration and settings management
"""

from pydantic_settings import BaseSettings
from typing import List, Optional
import os
from functools import lru_cache


class Settings(BaseSettings):
    """Application settings with environment variable support"""
    
    # === APPLICATION ===
    app_name: str = "AirWatch Backend API"
    app_version: str = "1.0.0"
    app_description: str = "Real-time air quality monitoring backend"
    environment: str = "production"
    debug: bool = False
    secret_key: str = "your-secret-key-change-in-production"
    
    # === SERVER ===
    host: str = "0.0.0.0"
    port: int = 8000
    workers: int = 4
    reload: bool = False
    
    # === SUPABASE ===
    supabase_url: Optional[str] = None
    supabase_key: Optional[str] = None
    supabase_anon_key: Optional[str] = None
    
    # === NASA EARTHDATA ===
    nasa_username: Optional[str] = None
    nasa_password: Optional[str] = None
    nasa_client_id: Optional[str] = None
    nasa_redirect_uri: Optional[str] = None
    nasa_edl_base_url: str = "https://urs.earthdata.nasa.gov"
    nasa_cmr_base_url: str = "https://cmr.earthdata.nasa.gov"
    nasa_harmony_base_url: str = "https://harmony.earthdata.nasa.gov"
    nasa_tempo_collection_id: str = "C2915230001-LARC_CLOUD"
    # EDL Compliance
    nasa_edl_compliant: bool = True
    nasa_accept_eula: bool = False  # Must be explicitly set to true after reviewing EULAs
    
    # === OPENAQ ===
    openaq_api_key: Optional[str] = None
    openaq_base_url: str = "https://api.openaq.org/v3"
    openaq_rate_limit: int = 10000
    
    # === EPA AIRNOW ===
    epa_airnow_api_key: Optional[str] = None
    epa_airnow_base_url: str = "https://www.airnowapi.org"
    epa_airnow_rate_limit: int = 500
    
    # === WEATHER APIs ===
    openweather_api_key: Optional[str] = None
    visual_crossing_api_key: Optional[str] = None
    noaa_base_url: str = "https://api.weather.gov"
    noaa_user_agent: str = "AirWatch-Backend/1.0"
    
    # === GEOCODING ===
    nominatim_base_url: str = "https://nominatim.openstreetmap.org"
    nominatim_user_agent: str = "AirWatch-Backend/1.0"
    nominatim_email: str = "contact@airwatch.example.com"
    
    # === DATABASE ===
    database_url: Optional[str] = None
    redis_url: str = "redis://localhost:6379/0"
    
    # === CORS ===
    allowed_origins: List[str] = ["http://localhost:3000", "https://airwatch.example.com"]
    allowed_methods: List[str] = ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
    allowed_headers: List[str] = ["*"]
    
    # === CACHING ===
    cache_ttl: int = 600
    max_cache_size: int = 1000
    enable_cache: bool = True
    
    # === RATE LIMITING ===
    rate_limit_requests: int = 100
    rate_limit_window: int = 3600
    
    # === LOGGING ===
    log_level: str = "INFO"
    log_format: str = "json"
    log_file: str = "logs/airwatch.log"
    
    # === MONITORING ===
    sentry_dsn: Optional[str] = None
    prometheus_port: int = 9090
    
    # === PUSH NOTIFICATIONS ===
    vapid_private_key: str = ""
    vapid_public_key: str = ""
    vapid_subject: str = "mailto:contact@airwatch.example.com"
    
    # === EMAIL ===
    smtp_host: str = "smtp.gmail.com"
    smtp_port: int = 587
    smtp_username: str = ""
    smtp_password: str = ""
    email_from: str = "noreply@airwatch.example.com"
    
    # === SECURITY ===
    jwt_secret_key: str = "your-jwt-secret-change-in-production"
    jwt_algorithm: str = "HS256"
    jwt_expiration_hours: int = 24
    bcrypt_rounds: int = 12
    
    # === API TIMEOUTS ===
    request_timeout: int = 30
    connection_timeout: int = 10
    read_timeout: int = 30
    
    # === FEATURE FLAGS ===
    enable_nasa_tempo: bool = True
    enable_openaq: bool = True
    enable_epa_airnow: bool = True
    enable_weather_apis: bool = True
    enable_geocoding: bool = True
    enable_ml_service: bool = True
    enable_supabase: bool = True
    mock_external_apis: bool = False
    enable_swagger: bool = True
    enable_redoc: bool = True
    
    # === ML SERVICE ===
    ml_service_url: str = "http://127.0.0.1:8001"
    ml_service_timeout: int = 30

    class Config:
        env_file = ".env"
        case_sensitive = False
        
    @property
    def database_dsn(self) -> str:
        """Get database DSN for SQLAlchemy"""
        if self.database_url:
            return self.database_url
        return f"postgresql://user:password@localhost/airwatch"
    
    @property
    def is_development(self) -> bool:
        """Check if running in development mode"""
        return self.environment.lower() in ["development", "dev", "local"]
    
    @property
    def is_production(self) -> bool:
        """Check if running in production mode"""
        return self.environment.lower() in ["production", "prod"]
    
    @property
    def cors_origins(self) -> List[str]:
        """Get CORS origins as list"""
        if isinstance(self.allowed_origins, str):
            return [origin.strip() for origin in self.allowed_origins.split(",")]
        return self.allowed_origins


@lru_cache()
def get_settings() -> Settings:
    """Get cached application settings"""
    return Settings()


# Global settings instance
settings = get_settings()