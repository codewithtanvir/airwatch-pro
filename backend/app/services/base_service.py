"""
Base Service Class
Abstract base class for all external service integrations
"""

from abc import ABC, abstractmethod
from typing import Any, Dict, Optional
import httpx
from datetime import datetime

from app.core.logging import LoggerMixin
from app.core.config import settings


class BaseService(ABC, LoggerMixin):
    """Abstract base class for external API services"""
    
    def __init__(self, base_url: str, timeout: int = 30):
        self.base_url = base_url
        self.timeout = timeout
        self.client = None
    
    async def __aenter__(self):
        """Async context manager entry"""
        self.client = httpx.AsyncClient(
            base_url=self.base_url,
            timeout=self.timeout
        )
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Async context manager exit"""
        if self.client:
            await self.client.aclose()
    
    async def _make_request(
        self,
        method: str,
        endpoint: str,
        params: Optional[Dict[str, Any]] = None,
        headers: Optional[Dict[str, str]] = None,
        **kwargs
    ) -> Dict[str, Any]:
        """Make HTTP request with error handling"""
        if not self.client:
            raise RuntimeError("Service client not initialized. Use async context manager.")
        
        try:
            self.logger.debug(f"Making {method} request to {endpoint}")
            response = await self.client.request(
                method=method,
                url=endpoint,
                params=params,
                headers=headers,
                **kwargs
            )
            response.raise_for_status()
            return response.json()
            
        except httpx.HTTPStatusError as e:
            self.logger.error(f"HTTP error {e.response.status_code}: {e.response.text}")
            raise
        except httpx.RequestError as e:
            self.logger.error(f"Request error: {e}")
            raise
        except Exception as e:
            self.logger.error(f"Unexpected error: {e}")
            raise
    
    @abstractmethod
    async def get_current_data(self, latitude: float, longitude: float) -> Dict[str, Any]:
        """Get current air quality data for location"""
        pass
    
    @abstractmethod
    async def get_historical_data(
        self,
        latitude: float,
        longitude: float,
        start_date: datetime,
        end_date: datetime
    ) -> Dict[str, Any]:
        """Get historical air quality data for location and date range"""
        pass
    
    @abstractmethod
    async def health_check(self) -> bool:
        """Check if the service is available"""
        pass