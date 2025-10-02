from fastapi import FastAPI, Query, HTTPException
from fastapi.responses import JSONResponse
import os
import httpx
from typing import Optional, Dict, Any
import asyncio

app = FastAPI()

@app.get("/api/air-quality")
async def get_air_quality(
    lat: float = Query(..., description="Latitude"),
    lon: float = Query(..., description="Longitude"), 
    radius: Optional[int] = Query(50, description="Search radius in km")
):
    """Get air quality data for specified coordinates"""
    try:
        # Get API keys from environment
        openaq_key = os.getenv("OPENAQ_API_KEY")
        epa_key = os.getenv("EPA_AIRNOW_API_KEY")
        
        if not openaq_key:
            raise HTTPException(status_code=500, detail="OpenAQ API key not configured")
        
        # OpenAQ API call
        async with httpx.AsyncClient(timeout=30) as client:
            openaq_response = await client.get(
                "https://api.openaq.org/v3/locations",
                headers={"X-API-Key": openaq_key},
                params={
                    "coordinates": f"{lat},{lon}",
                    "radius": radius,
                    "limit": 10
                }
            )
            
            openaq_data = openaq_response.json() if openaq_response.status_code == 200 else {}
            
            # EPA AirNow API call (if available)
            epa_data = {}
            if epa_key:
                try:
                    epa_response = await client.get(
                        "https://www.airnowapi.org/aq/observation/latLong/current/",
                        params={
                            "format": "application/json",
                            "latitude": lat,
                            "longitude": lon,
                            "distance": radius,
                            "API_KEY": epa_key
                        }
                    )
                    epa_data = epa_response.json() if epa_response.status_code == 200 else {}
                except Exception as e:
                    print(f"EPA API error: {e}")
        
        return {
            "coordinates": {"lat": lat, "lon": lon},
            "radius": radius,
            "data": {
                "openaq": openaq_data,
                "epa": epa_data
            },
            "timestamp": "2025-10-03T00:00:00Z"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching air quality data: {str(e)}")

@app.get("/api/weather")
async def get_weather(
    lat: float = Query(..., description="Latitude"),
    lon: float = Query(..., description="Longitude")
):
    """Get weather data for specified coordinates"""
    try:
        weather_key = os.getenv("OPENWEATHER_API_KEY")
        
        if not weather_key:
            raise HTTPException(status_code=500, detail="Weather API key not configured")
        
        async with httpx.AsyncClient(timeout=30) as client:
            response = await client.get(
                "https://api.openweathermap.org/data/2.5/weather",
                params={
                    "lat": lat,
                    "lon": lon,
                    "appid": weather_key,
                    "units": "metric"
                }
            )
            
            if response.status_code == 200:
                return response.json()
            else:
                raise HTTPException(status_code=response.status_code, detail="Weather API error")
                
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching weather data: {str(e)}")

# Vercel serverless function handler
def handler(request):
    return app(request)