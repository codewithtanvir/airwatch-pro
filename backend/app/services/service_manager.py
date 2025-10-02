"""
Service Manager
Centralized management of all external API services
"""

from typing import Dict, Any, List, Optional
from datetime import datetime
import asyncio

from app.services.epa_service import EPAAirNowService
from app.services.openaq_service import OpenAQService
from app.core.logging import LoggerMixin


class ServiceManager(LoggerMixin):
    """Central manager for all external API services"""
    
    def __init__(self):
        self.services = {
            "epa": EPAAirNowService(),
            "openaq": OpenAQService()
        }
    
    async def get_aggregated_current_data(
        self,
        latitude: float,
        longitude: float
    ) -> Dict[str, Any]:
        """Get current air quality data from all available services"""
        self.logger.info(f"Aggregating current data for {latitude}, {longitude}")
        
        results = {}
        
        # Gather data from all services concurrently
        tasks = []
        for service_name, service in self.services.items():
            async with service:
                task = asyncio.create_task(
                    service.get_current_data(latitude, longitude),
                    name=service_name
                )
                tasks.append(task)
        
        # Wait for all tasks to complete
        service_results = await asyncio.gather(*tasks, return_exceptions=True)
        
        # Process results
        for i, (service_name, result) in enumerate(zip(self.services.keys(), service_results)):
            if isinstance(result, Exception):
                self.logger.error(f"Service {service_name} failed: {result}")
                results[service_name] = {
                    "error": str(result),
                    "available": False
                }
            else:
                results[service_name] = result
                results[service_name]["available"] = True
        
        return {
            "aggregated_data": results,
            "timestamp": datetime.now().isoformat(),
            "location": {"latitude": latitude, "longitude": longitude}
        }
    
    async def get_historical_data_aggregated(
        self,
        latitude: float,
        longitude: float,
        start_date: datetime,
        end_date: datetime
    ) -> Dict[str, Any]:
        """Get historical data from all available services"""
        self.logger.info(f"Aggregating historical data for {latitude}, {longitude}")
        
        results = {}
        
        # Gather historical data from all services
        tasks = []
        for service_name, service in self.services.items():
            async with service:
                task = asyncio.create_task(
                    service.get_historical_data(latitude, longitude, start_date, end_date),
                    name=f"{service_name}_historical"
                )
                tasks.append(task)
        
        service_results = await asyncio.gather(*tasks, return_exceptions=True)
        
        for i, (service_name, result) in enumerate(zip(self.services.keys(), service_results)):
            if isinstance(result, Exception):
                self.logger.error(f"Historical data from {service_name} failed: {result}")
                results[service_name] = {
                    "error": str(result),
                    "available": False
                }
            else:
                results[service_name] = result
                results[service_name]["available"] = True
        
        return {
            "historical_data": results,
            "location": {"latitude": latitude, "longitude": longitude},
            "date_range": f"{start_date.date()} to {end_date.date()}",
            "timestamp": datetime.now().isoformat()
        }
    
    async def health_check_all(self) -> Dict[str, Any]:
        """Check health of all services"""
        self.logger.info("Performing health check on all services")
        
        results = {}
        
        # Check all services concurrently
        tasks = []
        for service_name, service in self.services.items():
            async with service:
                task = asyncio.create_task(
                    service.health_check(),
                    name=f"{service_name}_health"
                )
                tasks.append(task)
        
        health_results = await asyncio.gather(*tasks, return_exceptions=True)
        
        for service_name, result in zip(self.services.keys(), health_results):
            if isinstance(result, Exception):
                results[service_name] = {
                    "status": "error",
                    "error": str(result),
                    "healthy": False
                }
            else:
                results[service_name] = {
                    "status": "healthy" if result else "unhealthy",
                    "healthy": result
                }
        
        all_healthy = all(
            service["healthy"] for service in results.values()
        )
        
        return {
            "overall_status": "healthy" if all_healthy else "degraded",
            "services": results,
            "timestamp": datetime.now().isoformat()
        }
    
    async def get_available_services(self) -> List[str]:
        """Get list of available service names"""
        return list(self.services.keys())


# Global service manager instance
service_manager = ServiceManager()