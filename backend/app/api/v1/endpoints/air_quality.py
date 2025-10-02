"""
Air Quality Data Endpoints
Endpoints for retrieving and managing air quality data
"""

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime, timedelta
import math

from app.core.logging import get_logger

router = APIRouter()
logger = get_logger(__name__)


class AirQualityReading(BaseModel):
    """Air quality reading response model"""
    id: str
    location: str
    latitude: float
    longitude: float
    aqi: int
    pm25: float
    pm10: float
    ozone: float
    no2: float
    so2: float
    co: float
    timestamp: datetime
    source: str


class AirQualityForecast(BaseModel):
    """Air quality forecast response model"""
    location: str
    date: datetime
    predicted_aqi: int
    confidence: float
    factors: List[str]


@router.get("/current")
async def get_current_air_quality(
    latitude: float = Query(..., description="Latitude for location-based query"),
    longitude: float = Query(..., description="Longitude for location-based query"),
    include_satellite: bool = Query(False, description="Include satellite data"),
    include_forecast: bool = Query(False, description="Include forecast data"),
    include_alerts: bool = Query(True, description="Include alerts")
):
    """Get current air quality data for specified location"""
    logger.info(f"Current air quality requested for lat={latitude}, lon={longitude}")
    
    # TODO: Implement actual service calls
    # For now, return mock data in frontend-expected format
    mock_reading = {
        "location": f"Location at {latitude}, {longitude}",
        "coordinates": {"lat": latitude, "lng": longitude},
        "timestamp": datetime.now().isoformat(),
        "aqi": 85,
        "dominant_pollutant": "PM2.5",
        "pollutants": {
            "pm25": 23.5,
            "pm10": 45.2,
            "o3": 0.08,
            "no2": 25.3,
            "so2": 5.1,
            "co": 1.2
        },
        "aqi_level": "MODERATE",
        "health_message": "Air quality is acceptable for most people",
        "data_source": "EPA AirNow",
        "last_updated": datetime.now().isoformat()
    }
    
    response = {
        "success": True,
        "data": mock_reading
    }
    
    if include_satellite:
        response["satellite_data"] = {"status": "available", "source": "TEMPO"}
    
    if include_forecast:
        response["forecast"] = [
            {
                "date": datetime.now().isoformat(),
                "predicted_aqi": 78,
                "confidence": 0.85
            }
        ]
    
    if include_alerts:
        response["alerts"] = []
    
    return response


@router.get("/forecast", response_model=List[AirQualityForecast])
async def get_air_quality_forecast(
    latitude: float = Query(..., description="Latitude"),
    longitude: float = Query(..., description="Longitude"),
    days: int = Query(3, description="Number of forecast days")
):
    """Get air quality forecast for specified location"""
    logger.info(f"Forecast requested for lat={latitude}, lon={longitude}, days={days}")
    
    # TODO: Implement actual forecast service
    mock_forecast = [
        AirQualityForecast(
            location=f"Location at {latitude}, {longitude}",
            date=datetime.now(),
            predicted_aqi=78,
            confidence=0.85,
            factors=["weather_patterns", "traffic_data", "industrial_emissions"]
        )
    ]
    
    return mock_forecast


@router.get("/historical")
async def get_historical_air_quality(
    latitude: float = Query(..., description="Latitude"),
    longitude: float = Query(..., description="Longitude"),
    days: int = Query(30, description="Number of days of historical data"),
    pollutants: List[str] = Query(["aqi", "pm25", "pm10", "o3", "no2"], description="Pollutants to include")
):
    """Get historical air quality data for specified location and time range"""
    logger.info(f"Historical data requested for lat={latitude}, lon={longitude}, days={days}")
    
    # Generate historical data in the format expected by the frontend
    historical_data = []
    for i in range(min(days, 90)):  # Support up to 90 days
        date = datetime.now() - timedelta(days=i)
        
        # Generate realistic-looking data with some variation
        base_aqi = 65 + (i % 20) + int(10 * abs(math.sin(i * 0.1)))  # Realistic AQI variation
        
        historical_data.append({
            "date": date.strftime("%Y-%m-%d"),
            "aqi": max(10, min(150, base_aqi)),  # Keep AQI in reasonable range
            "pm25": round(15.0 + (i % 8) + 5 * abs(math.sin(i * 0.15)), 1),
            "o3": round(0.06 + (i % 3) * 0.01 + 0.02 * abs(math.cos(i * 0.1)), 3),
            "temperature": round(20 + 8 * math.sin(i * 0.2) + (i % 5), 1)  # Seasonal temperature variation
        })
    
    # Reverse to get chronological order (oldest first)
    historical_data.reverse()
    
    return historical_data