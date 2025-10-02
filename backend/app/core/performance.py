"""
Performance Optimization Middleware for AirWatch Pro
Smart caching and nearby data lookup to reduce API calls and improve response times
"""

from typing import Dict, Any, Optional, List, Tuple
from datetime import datetime, timedelta
import math
import json
from fastapi import Request, Response
import hashlib

from app.core.logging import LoggerMixin
from app.db.essential_service import essential_db_service


class PerformanceOptimizer(LoggerMixin):
    """Smart caching and performance optimization for air quality data"""
    
    def __init__(self):
        super().__init__()
        self._cache = {}  # In-memory cache for very recent data
        self._cache_ttl = timedelta(minutes=10)  # 10 minute TTL for memory cache
        
    def _calculate_distance(self, lat1: float, lng1: float, lat2: float, lng2: float) -> float:
        """Calculate distance between two points in kilometers using Haversine formula"""
        R = 6371  # Earth's radius in kilometers
        
        lat1_rad = math.radians(lat1)
        lat2_rad = math.radians(lat2)
        delta_lat = math.radians(lat2 - lat1)
        delta_lng = math.radians(lng2 - lng1)
        
        a = (math.sin(delta_lat / 2) ** 2 + 
             math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(delta_lng / 2) ** 2)
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
        
        return R * c
    
    def _generate_cache_key(self, latitude: float, longitude: float, precision: int = 2) -> str:
        """Generate a cache key for location-based data"""
        # Round coordinates to reduce cache fragmentation
        rounded_lat = round(latitude, precision)
        rounded_lng = round(longitude, precision)
        return f"air_quality_{rounded_lat}_{rounded_lng}"
    
    async def check_memory_cache(self, latitude: float, longitude: float) -> Optional[Dict[str, Any]]:
        """Check in-memory cache for very recent data"""
        cache_key = self._generate_cache_key(latitude, longitude)
        
        if cache_key in self._cache:
            cached_item = self._cache[cache_key]
            
            # Check if cache is still valid
            if datetime.now() - cached_item["timestamp"] < self._cache_ttl:
                self.logger.info(f"Memory cache hit for {latitude:.3f}, {longitude:.3f}")
                return cached_item["data"]
            else:
                # Remove expired cache entry
                del self._cache[cache_key]
        
        return None
    
    async def update_memory_cache(self, latitude: float, longitude: float, data: Dict[str, Any]):
        """Update in-memory cache with fresh data"""
        cache_key = self._generate_cache_key(latitude, longitude)
        
        self._cache[cache_key] = {
            "data": data,
            "timestamp": datetime.now()
        }
        
        # Cleanup old cache entries (simple LRU-like behavior)
        if len(self._cache) > 100:  # Keep max 100 entries
            oldest_key = min(self._cache.keys(), 
                           key=lambda k: self._cache[k]["timestamp"])
            del self._cache[oldest_key]
    
    async def find_nearby_cached_data(
        self, 
        latitude: float, 
        longitude: float, 
        max_distance_km: float = 5.0,
        max_age_hours: int = 2
    ) -> Optional[Dict[str, Any]]:
        """Find nearby cached data within acceptable distance and age"""
        try:
            # First check memory cache
            memory_data = await self.check_memory_cache(latitude, longitude)
            if memory_data:
                return memory_data
            
            # Then check database for nearby data
            cached_data = await essential_db_service.get_nearby_cached_data(
                latitude=latitude,
                longitude=longitude,
                radius_km=max_distance_km,
                hours=max_age_hours
            )
            
            if cached_data and len(cached_data) > 0:
                # Return the most recent nearby data
                most_recent = max(cached_data, key=lambda x: x.get("timestamp", ""))
                
                self.logger.info(
                    f"Found nearby cached data for {latitude:.3f}, {longitude:.3f} "
                    f"(distance: ~{max_distance_km}km)"
                )
                
                return most_recent
            
            return None
            
        except Exception as e:
            self.logger.error(f"Error finding nearby cached data: {e}")
            return None
    
    async def should_use_cached_data(
        self, 
        request: Request,
        latitude: float, 
        longitude: float
    ) -> Tuple[bool, Optional[Dict[str, Any]]]:
        """
        Determine if cached data should be used instead of fresh API call
        Returns (should_use_cache, cached_data)
        """
        try:
            # Check request headers for cache preferences
            cache_control = request.headers.get("cache-control", "")
            if "no-cache" in cache_control.lower():
                return False, None
            
            # Look for acceptable cached data
            cached_data = await self.find_nearby_cached_data(
                latitude=latitude,
                longitude=longitude,
                max_distance_km=5.0,  # 5km radius
                max_age_hours=2       # 2 hours max age
            )
            
            if cached_data:
                # Add cache metadata
                cached_data["cache_info"] = {
                    "cached": True,
                    "source": "performance_cache",
                    "cached_at": datetime.now().isoformat()
                }
                
                return True, cached_data
            
            return False, None
            
        except Exception as e:
            self.logger.error(f"Error checking cache usage: {e}")
            return False, None
    
    async def cache_fresh_data(
        self, 
        latitude: float, 
        longitude: float, 
        fresh_data: Dict[str, Any]
    ):
        """Cache fresh data for future performance optimization"""
        try:
            # Update memory cache immediately
            await self.update_memory_cache(latitude, longitude, fresh_data)
            
            # Update database cache for persistence
            await essential_db_service.update_location_cache(
                latitude=latitude,
                longitude=longitude,
                fresh_data=fresh_data
            )
            
            self.logger.info(f"Cached fresh data for {latitude:.3f}, {longitude:.3f}")
            
        except Exception as e:
            self.logger.error(f"Error caching fresh data: {e}")
    
    def add_performance_headers(self, response: Response, cached: bool = False):
        """Add performance-related headers to response"""
        if cached:
            response.headers["X-Cache"] = "HIT"
            response.headers["X-Cache-Source"] = "airwatch-optimizer"
        else:
            response.headers["X-Cache"] = "MISS"
        
        response.headers["X-Performance-Optimized"] = "true"
        response.headers["Cache-Control"] = "public, max-age=600"  # 10 minutes
    
    async def get_cache_statistics(self) -> Dict[str, Any]:
        """Get performance cache statistics"""
        try:
            memory_cache_size = len(self._cache)
            
            # Could add database cache statistics here
            
            return {
                "memory_cache": {
                    "entries": memory_cache_size,
                    "max_entries": 100,
                    "ttl_minutes": 10
                },
                "performance": {
                    "enabled": True,
                    "max_distance_km": 5.0,
                    "max_age_hours": 2
                },
                "timestamp": datetime.now().isoformat()
            }
            
        except Exception as e:
            self.logger.error(f"Error getting cache statistics: {e}")
            return {"error": str(e)}
    
    async def clear_cache(self, location_specific: bool = False, latitude: float = None, longitude: float = None):
        """Clear performance cache"""
        try:
            if location_specific and latitude is not None and longitude is not None:
                # Clear specific location cache
                cache_key = self._generate_cache_key(latitude, longitude)
                if cache_key in self._cache:
                    del self._cache[cache_key]
                    self.logger.info(f"Cleared cache for {latitude:.3f}, {longitude:.3f}")
            else:
                # Clear all memory cache
                self._cache.clear()
                self.logger.info("Cleared all memory cache")
            
            return True
            
        except Exception as e:
            self.logger.error(f"Error clearing cache: {e}")
            return False


# Global performance optimizer instance
performance_optimizer = PerformanceOptimizer()


# Middleware function for FastAPI
async def performance_optimization_middleware(request: Request, call_next):
    """
    Middleware to optimize performance for air quality API calls
    Can be added to FastAPI app to automatically optimize requests
    """
    start_time = datetime.now()
    
    # Process request normally
    response = await call_next(request)
    
    # Add performance timing header
    process_time = (datetime.now() - start_time).total_seconds()
    response.headers["X-Process-Time"] = str(process_time)
    
    return response


# Utility functions for integration
async def optimize_air_quality_request(
    request: Request,
    latitude: float, 
    longitude: float,
    fetch_fresh_data_func
) -> Tuple[Dict[str, Any], bool]:
    """
    Optimize air quality data request with smart caching
    
    Args:
        request: FastAPI request object
        latitude: Location latitude  
        longitude: Location longitude
        fetch_fresh_data_func: Async function to fetch fresh data if needed
    
    Returns:
        (data, was_cached) tuple
    """
    try:
        # Check if we should use cached data
        should_cache, cached_data = await performance_optimizer.should_use_cached_data(
            request, latitude, longitude
        )
        
        if should_cache and cached_data:
            return cached_data, True
        
        # Fetch fresh data
        fresh_data = await fetch_fresh_data_func(latitude, longitude)
        
        # Cache the fresh data for future requests
        if fresh_data:
            await performance_optimizer.cache_fresh_data(latitude, longitude, fresh_data)
        
        return fresh_data, False
        
    except Exception as e:
        performance_optimizer.logger.error(f"Error in optimize_air_quality_request: {e}")
        # Fallback to fresh data fetch
        return await fetch_fresh_data_func(latitude, longitude), False