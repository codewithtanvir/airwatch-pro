"""
OpenAQ Service
Integration with OpenAQ API for global air quality data
"""

from typing import Dict, Any, List
from datetime import datetime, timedelta

from app.services.base_service import BaseService
from app.core.config import settings


class OpenAQService(BaseService):
    """OpenAQ API service for global air quality data"""
    
    def __init__(self):
        super().__init__(base_url=settings.OPENAQ_BASE_URL)
    
    async def get_current_data(self, latitude: float, longitude: float, radius: int = 25) -> Dict[str, Any]:
        """Get current air quality data from OpenAQ"""
        params = {
            "coordinates": f"{latitude},{longitude}",
            "radius": radius * 1000,  # Convert km to meters
            "limit": 100,
            "order_by": "lastUpdated",
            "sort": "desc"
        }
        
        try:
            # Get latest measurements
            data = await self._make_request(
                method="GET",
                endpoint="/latest",
                params=params
            )
            
            return {
                "source": "OpenAQ",
                "data": data,
                "timestamp": datetime.now().isoformat()
            }
            
        except Exception as e:
            self.logger.error(f"OpenAQ API error: {e}")
            return {
                "source": "OpenAQ",
                "error": str(e),
                "data": {"results": []}
            }
    
    async def get_historical_data(
        self,
        latitude: float,
        longitude: float,
        start_date: datetime,
        end_date: datetime
    ) -> Dict[str, Any]:
        """Get historical measurements from OpenAQ"""
        params = {
            "coordinates": f"{latitude},{longitude}",
            "radius": 25000,  # 25km radius in meters
            "date_from": start_date.strftime("%Y-%m-%d"),
            "date_to": end_date.strftime("%Y-%m-%d"),
            "limit": 1000
        }
        
        try:
            data = await self._make_request(
                method="GET",
                endpoint="/measurements",
                params=params
            )
            
            return {
                "source": "OpenAQ",
                "data": data,
                "location": f"{latitude}, {longitude}",
                "date_range": f"{start_date.date()} to {end_date.date()}"
            }
            
        except Exception as e:
            self.logger.error(f"OpenAQ historical data error: {e}")
            return {
                "source": "OpenAQ",
                "error": str(e),
                "data": {"results": []}
            }
    
    async def get_locations_near(self, latitude: float, longitude: float, radius: int = 50) -> Dict[str, Any]:
        """Get monitoring locations near coordinates"""
        params = {
            "coordinates": f"{latitude},{longitude}",
            "radius": radius * 1000,  # Convert km to meters
            "limit": 100
        }
        
        try:
            data = await self._make_request(
                method="GET",
                endpoint="/locations",
                params=params
            )
            
            return {
                "source": "OpenAQ",
                "locations": data,
                "timestamp": datetime.now().isoformat()
            }
            
        except Exception as e:
            self.logger.error(f"OpenAQ locations error: {e}")
            return {
                "source": "OpenAQ",
                "error": str(e),
                "locations": {"results": []}
            }
    
    async def get_countries(self) -> Dict[str, Any]:
        """Get list of countries with monitoring data"""
        try:
            data = await self._make_request(
                method="GET",
                endpoint="/countries",
                params={"limit": 300}
            )
            
            return {
                "source": "OpenAQ",
                "countries": data,
                "timestamp": datetime.now().isoformat()
            }
            
        except Exception as e:
            self.logger.error(f"OpenAQ countries error: {e}")
            return {
                "source": "OpenAQ",
                "error": str(e),
                "countries": {"results": []}
            }
    
    async def health_check(self) -> bool:
        """Check OpenAQ API availability"""
        try:
            # Simple request to check API status
            await self._make_request(
                method="GET",
                endpoint="/latest",
                params={"limit": 1}
            )
            
            return True
            
        except Exception as e:
            self.logger.error(f"OpenAQ health check failed: {e}")
            return False