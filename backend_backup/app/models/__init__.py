"""
AirWatch Backend Models
Pydantic models for data validation and serialization
"""

from pydantic import BaseModel, Field, validator
from typing import List, Optional, Dict, Any, Union
from datetime import datetime
from enum import Enum


# === ENUMS ===

class AQICategory(str, Enum):
    GOOD = "Good"
    MODERATE = "Moderate"
    UNHEALTHY_SENSITIVE = "Unhealthy for Sensitive Groups"
    UNHEALTHY = "Unhealthy"
    VERY_UNHEALTHY = "Very Unhealthy"
    HAZARDOUS = "Hazardous"


class AlertType(str, Enum):
    HEALTH = "health"
    POLLUTION = "pollution"
    WEATHER = "weather"
    EMERGENCY = "emergency"


class AlertSeverity(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class DataSource(str, Enum):
    NASA_TEMPO = "NASA TEMPO"
    OPENAQ = "OpenAQ"
    EPA_AIRNOW = "EPA AirNow"
    WEATHER_API = "Weather API"
    SATELLITE = "Satellite"
    GROUND_STATION = "Ground Station"


# === COORDINATE MODELS ===

class Coordinates(BaseModel):
    lat: float = Field(..., ge=-90, le=90, description="Latitude in decimal degrees")
    lng: float = Field(..., ge=-180, le=180, description="Longitude in decimal degrees")
    
    @validator('lat')
    def validate_latitude(cls, v):
        if not -90 <= v <= 90:
            raise ValueError('Latitude must be between -90 and 90 degrees')
        return v
    
    @validator('lng')
    def validate_longitude(cls, v):
        if not -180 <= v <= 180:
            raise ValueError('Longitude must be between -180 and 180 degrees')
        return v


# === POLLUTANT MODELS ===

class Pollutants(BaseModel):
    pm25: float = Field(default=0.0, ge=0, description="PM2.5 concentration (µg/m³)")
    pm10: float = Field(default=0.0, ge=0, description="PM10 concentration (µg/m³)")
    o3: float = Field(default=0.0, ge=0, description="Ozone concentration (µg/m³ or ppm)")
    no2: float = Field(default=0.0, ge=0, description="NO2 concentration (µg/m³)")
    so2: float = Field(default=0.0, ge=0, description="SO2 concentration (µg/m³)")
    co: float = Field(default=0.0, ge=0, description="CO concentration (mg/m³)")


# === WEATHER MODELS ===

class WeatherData(BaseModel):
    temperature: float = Field(..., description="Temperature in Celsius")
    humidity: float = Field(..., ge=0, le=100, description="Relative humidity (%)")
    wind_speed: float = Field(..., ge=0, description="Wind speed (m/s)")
    wind_direction: Optional[float] = Field(None, ge=0, le=360, description="Wind direction (degrees)")
    pressure: Optional[float] = Field(None, ge=0, description="Atmospheric pressure (hPa)")
    visibility: Optional[float] = Field(None, ge=0, description="Visibility (km)")
    uv_index: Optional[float] = Field(None, ge=0, le=11, description="UV Index")


# === AIR QUALITY MODELS ===

class AirQualityReading(BaseModel):
    id: Optional[str] = None
    location: str = Field(..., description="Location name or description")
    coordinates: Coordinates
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    aqi: int = Field(..., ge=0, le=500, description="Air Quality Index")
    category: AQICategory = Field(..., description="AQI category")
    pollutants: Pollutants
    primary_pollutant: Optional[str] = Field(None, description="Primary pollutant driving AQI")
    data_source: DataSource = Field(..., description="Source of the data")
    quality_score: float = Field(default=0.8, ge=0, le=1, description="Data quality score")
    weather_data: Optional[WeatherData] = None
    health_recommendations: List[str] = Field(default_factory=list)
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }


class AirQualityForecast(BaseModel):
    date: str = Field(..., description="Forecast date (YYYY-MM-DD)")
    aqi: int = Field(..., ge=0, le=500, description="Predicted AQI")
    category: AQICategory = Field(..., description="Predicted AQI category")
    temperature: float = Field(..., description="Predicted temperature")
    humidity: float = Field(..., description="Predicted humidity")
    wind_speed: float = Field(..., description="Predicted wind speed")
    confidence: float = Field(default=0.7, ge=0, le=1, description="Forecast confidence")


# === ALERT MODELS ===

class Alert(BaseModel):
    id: Optional[str] = None
    type: AlertType = Field(..., description="Type of alert")
    severity: AlertSeverity = Field(..., description="Alert severity level")
    title: str = Field(..., max_length=200, description="Alert title")
    message: str = Field(..., max_length=1000, description="Alert message")
    location: str = Field(..., description="Location affected")
    coordinates: Optional[Coordinates] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    expires_at: Optional[datetime] = None
    aqi_value: Optional[int] = Field(None, ge=0, le=500)
    pollutant_values: Optional[Dict[str, float]] = None
    active: bool = Field(default=True)
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }


# === HISTORICAL DATA MODELS ===

class HistoricalDataPoint(BaseModel):
    timestamp: datetime
    aqi: int = Field(..., ge=0, le=500)
    pm25: float = Field(..., ge=0)
    pm10: float = Field(..., ge=0)
    o3: float = Field(..., ge=0)
    no2: float = Field(..., ge=0)
    temperature: Optional[float] = None
    humidity: Optional[float] = None
    wind_speed: Optional[float] = None
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }


# === USER MODELS ===

class UserPreferences(BaseModel):
    user_id: str
    notification_enabled: bool = True
    email_alerts: bool = True
    push_notifications: bool = True
    sms_alerts: bool = False
    alert_thresholds: Dict[str, float] = Field(
        default={
            "aqi_threshold": 150,
            "pm25_threshold": 55.5,
            "ozone_threshold": 165
        }
    )
    preferred_units: str = Field(default="metric", pattern="^(metric|imperial)$")
    preferred_language: str = Field(default="en", max_length=5)
    timezone: str = Field(default="UTC")
    quiet_hours: Dict[str, Union[bool, str]] = Field(
        default={
            "enabled": True,
            "start_time": "22:00",
            "end_time": "08:00"
        }
    )
    location_tracking: bool = True
    data_sharing: bool = False


class LocationSubscription(BaseModel):
    id: Optional[str] = None
    user_id: str
    location_name: str = Field(..., max_length=200)
    coordinates: Coordinates
    radius_km: float = Field(default=5.0, ge=0.1, le=100)
    is_primary: bool = False
    alert_enabled: bool = True
    monitoring_frequency: str = Field(default="hourly", pattern="^(realtime|hourly|daily)$")
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


# === API REQUEST/RESPONSE MODELS ===

class AirQualityRequest(BaseModel):
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    include_forecast: bool = False
    include_weather: bool = True
    include_alerts: bool = True


class LocationSearchRequest(BaseModel):
    query: str = Field(..., min_length=3, max_length=200)
    limit: int = Field(default=10, ge=1, le=50)
    country_codes: Optional[List[str]] = None


class HistoricalDataRequest(BaseModel):
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    hours: int = Field(default=24, ge=1, le=168)  # Max 1 week
    pollutants: List[str] = Field(default=["aqi", "pm25", "pm10", "o3", "no2"])


class ForecastRequest(BaseModel):
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    days: int = Field(default=7, ge=1, le=14)


# === API RESPONSE MODELS ===

class AirQualityResponse(BaseModel):
    success: bool = True
    data: AirQualityReading
    forecast: Optional[List[AirQualityForecast]] = None
    alerts: Optional[List[Alert]] = None
    message: Optional[str] = None


class HistoricalDataResponse(BaseModel):
    success: bool = True
    data: List[HistoricalDataPoint]
    location: str
    coordinates: Coordinates
    start_date: datetime
    end_date: datetime
    total_points: int
    message: Optional[str] = None


class LocationSearchResponse(BaseModel):
    success: bool = True
    locations: List[Dict[str, Any]]
    total_results: int
    message: Optional[str] = None


class ServiceStatusResponse(BaseModel):
    service_name: str
    status: str = Field(..., pattern="^(operational|degraded|offline)$")
    response_time_ms: float
    last_check: datetime
    details: Optional[Dict[str, Any]] = None


class HealthCheckResponse(BaseModel):
    status: str = "healthy"
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    version: str
    services: Dict[str, ServiceStatusResponse]
    uptime_seconds: float


# === ERROR MODELS ===

class ErrorResponse(BaseModel):
    success: bool = False
    error: str
    message: str
    details: Optional[Dict[str, Any]] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)


# === SATELLITE DATA MODELS ===

class SatelliteData(BaseModel):
    satellite: str = Field(..., description="Satellite name (e.g., TEMPO)")
    instrument: str = Field(..., description="Instrument name")
    no2_column_density: Optional[float] = None
    o3_column_density: Optional[float] = None
    hcho_column_density: Optional[float] = None
    aerosol_optical_depth: Optional[float] = None
    cloud_fraction: Optional[float] = None
    quality_flag: Optional[int] = None
    observation_time: datetime
    pixel_coordinates: Coordinates
    spatial_resolution_km: float = Field(default=8.0)


# === MONITORING STATION MODELS ===

class MonitoringStation(BaseModel):
    id: str
    name: str
    coordinates: Coordinates
    country: str
    city: Optional[str] = None
    source_name: str
    parameters: List[str] = Field(description="Available pollutant parameters")
    last_updated: Optional[datetime] = None
    is_active: bool = True
    station_type: str = Field(default="ground", pattern="^(ground|mobile|satellite)$")


# === GEOCODING MODELS ===

class GeocodingResult(BaseModel):
    place_id: str
    display_name: str
    coordinates: Coordinates
    address_components: Dict[str, Optional[str]] = Field(
        description="Structured address components"
    )
    place_types: List[str] = Field(description="Types of place (city, state, etc.)")
    importance: float = Field(ge=0, le=1, description="Relevance score")
    bounding_box: Optional[List[float]] = Field(
        None, description="Bounding box [min_lat, max_lat, min_lng, max_lng]"
    )


# === ALERT MODELS ===

class AirQualityAlert(BaseModel):
    id: str
    type: str
    severity: AlertSeverity
    title: str
    message: str
    affected_area: str
    start_time: datetime
    end_time: Optional[datetime] = None
    pollutants: List[str] = Field(default_factory=list)
    source: str
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }


# === FORECAST MODELS ===

class ForecastData(BaseModel):
    timestamp: datetime
    aqi: int = Field(..., ge=0, le=500)
    category: AQICategory
    pollutants: Pollutants
    confidence: float = Field(default=0.8, ge=0, le=1)
    source: str = "ML Prediction"
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }


# === EXPORT ALL MODELS ===

__all__ = [
    "AQICategory", "AlertType", "AlertSeverity", "DataSource",
    "Coordinates", "Pollutants", "WeatherData", "AirQualityReading",
    "AirQualityForecast", "Alert", "HistoricalDataPoint", "UserPreferences",
    "LocationSubscription", "AirQualityRequest", "LocationSearchRequest",
    "HistoricalDataRequest", "ForecastRequest", "AirQualityResponse",
    "HistoricalDataResponse", "LocationSearchResponse", "ServiceStatusResponse",
    "HealthCheckResponse", "ErrorResponse", "SatelliteData", "MonitoringStation",
    "GeocodingResult", "AirQualityAlert", "ForecastData"
]