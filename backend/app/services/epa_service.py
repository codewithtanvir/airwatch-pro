"""
EPA AirNow Service
Integration with EPA AirNow API for US air quality data
"""

from typing import Dict, Any, List
from datetime import datetime

from app.services.base_service import BaseService
from app.core.config import settings


class EPAAirNowService(BaseService):
    """EPA AirNow API service for US air quality data"""
    
    def __init__(self):
        super().__init__(base_url="https://www.airnowapi.org")
        self.api_key = settings.EPA_API_EMAIL  # EPA uses email as API key
    
    async def get_current_data(self, latitude: float, longitude: float) -> Dict[str, Any]:
        """Get current air quality data from EPA AirNow"""
        params = {
            "format": "application/json",
            "latitude": latitude,
            "longitude": longitude,
            "distance": 25,  # 25 miles radius
            "API_KEY": self.api_key
        }
        
        try:
            # Current observations
            current_data = await self._make_request(
                method="GET",
                endpoint="/aq/observation/latLong/current/",
                params=params
            )
            
            # Current forecast (AQI)
            forecast_params = {**params, "distance": 50}
            forecast_data = await self._make_request(
                method="GET",
                endpoint="/aq/forecast/latLong/",
                params=forecast_params
            )
            
            return {
                "source": "EPA AirNow",
                "current": current_data,
                "forecast": forecast_data,
                "timestamp": datetime.now().isoformat()
            }
            
        except Exception as e:
            self.logger.error(f"EPA AirNow API error: {e}")
            return {
                "source": "EPA AirNow",
                "error": str(e),
                "current": [],
                "forecast": []
            }
    
    async def get_historical_data(
        self,
        latitude: float,
        longitude: float,
        start_date: datetime,
        end_date: datetime
    ) -> Dict[str, Any]:
        """Get historical data from EPA AirNow (limited availability)"""
        # Note: EPA AirNow has limited historical data access
        self.logger.warning("EPA AirNow historical data access is limited")
        
        return {
            "source": "EPA AirNow",
            "message": "Historical data access limited",
            "location": f"{latitude}, {longitude}",
            "date_range": f"{start_date.date()} to {end_date.date()}"
        }
    
    async def get_air_quality_forecast(self, latitude: float, longitude: float) -> Dict[str, Any]:
        """Get air quality forecast"""
        params = {
            "format": "application/json",
            "latitude": latitude,
            "longitude": longitude,
            "distance": 50,
            "API_KEY": self.api_key
        }
        
        try:
            forecast_data = await self._make_request(
                method="GET",
                endpoint="/aq/forecast/latLong/",
                params=params
            )
            
            return {
                "source": "EPA AirNow",
                "forecast": forecast_data,
                "timestamp": datetime.now().isoformat()
            }
            
        except Exception as e:
            self.logger.error(f"EPA forecast error: {e}")
            return {
                "source": "EPA AirNow",
                "error": str(e),
                "forecast": []
            }
    
    async def health_check(self) -> bool:
        """Check EPA AirNow API availability"""
        try:
            # Use a known location for health check
            test_params = {
                "format": "application/json",
                "latitude": 39.7392,  # Washington DC
                "longitude": -104.9903,
                "distance": 25,
                "API_KEY": self.api_key
            }
            
            await self._make_request(
                method="GET",
                endpoint="/aq/observation/latLong/current/",
                params=test_params
            )
            
            return True
            
        except Exception as e:
            self.logger.error(f"EPA health check failed: {e}")
            return False