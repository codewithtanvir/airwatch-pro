"""
ML Service Client
Handles communication with the ML prediction service
"""

import asyncio
import logging
from typing import List, Optional, Dict, Any
from datetime import datetime

import httpx
from app.config import settings

logger = logging.getLogger(__name__)


class MLServiceClient:
    """Client for communicating with the ML prediction service"""
    
    def __init__(self, base_url: str = None): # type: ignore
        self.base_url = base_url or settings.ml_service_url
        self.timeout = 30.0  # 30 seconds timeout for ML predictions
        self.client = None
    
    async def __aenter__(self):
        self.client = httpx.AsyncClient(timeout=self.timeout)
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.client:
            await self.client.aclose()
    
    async def health_check(self) -> Dict[str, Any]:
        """Check if ML service is healthy and ready"""
        try:
            if not self.client:
                async with httpx.AsyncClient(timeout=5.0) as client:
                    response = await client.get(f"{self.base_url}/health")
            else:
                response = await self.client.get(f"{self.base_url}/health")
            
            response.raise_for_status()
            return response.json()
            
        except httpx.RequestError as e:
            logger.error(f"ML service connection error: {e}")
            return {"status": "unreachable", "error": str(e)}
        except httpx.HTTPStatusError as e:
            logger.error(f"ML service HTTP error: {e}")
            return {"status": "error", "error": f"HTTP {e.response.status_code}"}
        except Exception as e:
            logger.error(f"ML service health check error: {e}")
            return {"status": "error", "error": str(e)}
    
    async def predict_air_quality(
        self,
        latitude: float,
        longitude: float,
        hours: int = 24
    ) -> Dict[str, Any]:
        """Get air quality predictions from ML service"""
        try:
            if not self.client:
                raise ValueError("Client not initialized. Use as async context manager.")
            
            params = {
                "latitude": latitude,
                "longitude": longitude,
                "hours": hours
            }
            
            logger.info(f"Requesting ML prediction for lat={latitude}, lng={longitude}, hours={hours}")
            
            response = await self.client.get(
                f"{self.base_url}/predict",
                params=params
            )
            
            response.raise_for_status()
            result = response.json()
            
            logger.info(f"ML prediction successful, got {len(result.get('forecast', []))} forecast points")
            return result
            
        except httpx.RequestError as e:
            logger.error(f"ML service connection error: {e}")
            raise Exception(f"ML service unavailable: {e}")
        except httpx.HTTPStatusError as e:
            logger.error(f"ML service HTTP error: {e.response.status_code}: {e.response.text}")
            raise Exception(f"ML service error: HTTP {e.response.status_code}")
        except Exception as e:
            logger.error(f"ML prediction error: {e}")
            raise Exception(f"ML prediction failed: {e}")
    
    async def get_forecast_simple(
        self,
        latitude: float,
        longitude: float,
        hours: int = 24
    ) -> List[Dict[str, Any]]:
        """
        Get simplified forecast data compatible with backend models
        Returns list of AirQualityForecast-compatible dictionaries
        """
        try:
            prediction_result = await self.predict_air_quality(latitude, longitude, hours)
            
            # Transform ML service response to backend format
            forecasts = []
            for item in prediction_result.get('forecast', []):
                # Convert timestamp to date string for backend compatibility
                timestamp = item['timestamp']
                if isinstance(timestamp, str):
                    # Parse ISO timestamp and extract date
                    try:
                        dt = datetime.fromisoformat(timestamp.replace('Z', '+00:00'))
                        date_str = dt.strftime('%Y-%m-%d')
                    except:
                        date_str = timestamp[:10]  # Fallback to first 10 chars
                else:
                    date_str = str(timestamp)[:10]
                
                forecast = {
                    "date": date_str,
                    "aqi": item['aqi'],
                    "category": item['category'],
                    "temperature": item['temperature'],
                    "humidity": item['humidity'],
                    "wind_speed": item['wind_speed'],
                    "confidence": item['confidence']
                }
                forecasts.append(forecast)
            
            return forecasts
            
        except Exception as e:
            logger.error(f"Failed to get simplified forecast: {e}")
            # Return empty list on error instead of raising
            return []


# Global ML service client instance
ml_service_client = MLServiceClient()


async def get_ml_forecast(
    latitude: float,
    longitude: float,
    hours: int = 24
) -> List[Dict[str, Any]]:
    """
    Convenience function to get ML forecasts
    Returns empty list if ML service is unavailable
    """
    try:
        async with MLServiceClient() as client:
            return await client.get_forecast_simple(latitude, longitude, hours)
    except Exception as e:
        logger.warning(f"ML forecast unavailable: {e}")
        return []