"""
Location Management Endpoints
Endpoints for managing monitoring locations and user preferences
"""

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime
import aiohttp
import asyncio

from app.core.logging import get_logger

router = APIRouter()
logger = get_logger(__name__)


class Location(BaseModel):
    """Location model"""
    id: str
    name: str
    latitude: float
    longitude: float
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = None
    is_monitoring_station: bool = False


class LocationCreate(BaseModel):
    """Location creation model"""
    name: str
    latitude: float
    longitude: float
    address: Optional[str] = None


class GeocodingService:
    """Service for geocoding and location search"""
    
    def __init__(self):
        # Using OpenStreetMap Nominatim API (free, no API key required)
        self.base_url = "https://nominatim.openstreetmap.org"
        self.session = None
        
    async def _get_session(self) -> aiohttp.ClientSession:
        """Get or create HTTP session"""
        if self.session is None or self.session.closed:
            timeout = aiohttp.ClientTimeout(total=30)
            headers = {
                'User-Agent': 'AirWatch-Pro/1.0 (NASA-Space-Apps-Challenge)',
                'Accept': 'application/json'
            }
            self.session = aiohttp.ClientSession(timeout=timeout, headers=headers)
        return self.session
    
    async def search_locations(self, query: str, limit: int = 10) -> List[Dict[str, Any]]:
        """Search for locations using Nominatim geocoding API"""
        try:
            session = await self._get_session()
            
            params = {
                'q': query,
                'format': 'json',
                'limit': limit,
                'addressdetails': 1,
                'extratags': 1,
                'namedetails': 1
            }
            
            url = f"{self.base_url}/search"
            
            async with session.get(url, params=params) as response:
                if response.status == 200:
                    data = await response.json()
                    
                    # Convert Nominatim format to our format
                    locations = []
                    for item in data:
                        display_name = item.get('display_name', '')
                        
                        # Extract city, state, country from display_name
                        parts = display_name.split(', ')
                        name = parts[0] if parts else display_name
                        country = parts[-1] if len(parts) > 1 else 'Unknown'
                        region = parts[-2] if len(parts) > 2 else ''
                        
                        # Try to create a better formatted name
                        address = item.get('address', {})
                        if address:
                            city = address.get('city') or address.get('town') or address.get('village')
                            state = address.get('state')
                            country_code = address.get('country_code', '').upper()
                            country_name = address.get('country', country)
                            
                            if city and state and country_code:
                                name = f"{city}, {state}, {country_code}"
                            elif city and country_name:
                                name = f"{city}, {country_name}"
                            else:
                                # Use the first part of display_name, cleaned up
                                name_parts = display_name.split(', ')[:3]
                                name = ', '.join(name_parts)
                        
                        location = {
                            'id': item.get('place_id', str(len(locations))),
                            'name': name,
                            'coordinates': {
                                'lat': float(item.get('lat', 0)),
                                'lng': float(item.get('lon', 0))
                            },
                            'country': country,
                            'region': region,
                            'type': item.get('type', 'location'),
                            'importance': item.get('importance', 0.5),
                            'boundingbox': item.get('boundingbox', []),
                            'display_name': display_name
                        }
                        locations.append(location)
                    
                    # Sort by importance (higher is better)
                    locations.sort(key=lambda x: x['importance'], reverse=True)
                    return locations
                    
                else:
                    logger.error(f"Nominatim API error: {response.status}")
                    return []
                    
        except Exception as e:
            logger.error(f"Error searching locations: {str(e)}")
            return []


# Global service instance
geocoding_service = GeocodingService()


@router.get("/", response_model=List[Location])
async def get_locations(
    latitude: Optional[float] = Query(None, description="Center latitude for search"),
    longitude: Optional[float] = Query(None, description="Center longitude for search"),
    radius: Optional[int] = Query(100, description="Search radius in kilometers"),
    limit: Optional[int] = Query(50, description="Maximum number of results")
):
    """Get monitoring locations near specified coordinates"""
    logger.info(f"Locations requested for lat={latitude}, lon={longitude}, radius={radius}")
    
    # TODO: Implement actual location service
    mock_locations = [
        Location(
            id="loc-1",
            name="Central Park Monitoring Station",
            latitude=40.7829,
            longitude=-73.9654,
            address="Central Park, New York, NY",
            city="New York",
            state="NY",
            country="USA",
            is_monitoring_station=True
        ),
        Location(
            id="loc-2",
            name="Brooklyn Bridge Station",
            latitude=40.7061,
            longitude=-73.9969,
            address="Brooklyn Bridge, New York, NY",
            city="New York",
            state="NY",
            country="USA",
            is_monitoring_station=True
        )
    ]
    
    return mock_locations


@router.post("/", response_model=Location)
async def create_location(location_data: LocationCreate):
    """Create a new monitoring location"""
    logger.info(f"Creating location: {location_data.name}")
    
    # TODO: Implement actual location creation
    new_location = Location(
        id=f"loc-{hash(location_data.name)}",
        name=location_data.name,
        latitude=location_data.latitude,
        longitude=location_data.longitude,
        address=location_data.address,
        is_monitoring_station=False
    )
    
    return new_location


@router.get("/search")
async def search_locations(
    q: str = Query(..., description="Search query for locations"),
    limit: int = Query(10, description="Maximum number of results")
):
    """Search for locations by name using real geocoding"""
    logger.info(f"Location search requested for query: {q}")
    
    try:
        # Get real geocoding results
        locations = await geocoding_service.search_locations(q, limit)
        
        if locations:
            logger.info(f"Found {len(locations)} locations for query: {q}")
            return {
                "success": True,
                "data": locations,
                "count": len(locations)
            }
        else:
            # Fallback to common locations if no results
            logger.warning(f"No locations found for query: {q}, providing fallback")
            fallback_locations = _get_fallback_locations(q, limit)
            return {
                "success": True,
                "data": fallback_locations,
                "count": len(fallback_locations),
                "fallback": True
            }
            
    except Exception as e:
        logger.error(f"Error searching locations: {str(e)}")
        # Return fallback locations on error
        fallback_locations = _get_fallback_locations(q, limit)
        return {
            "success": True,
            "data": fallback_locations,
            "count": len(fallback_locations),
            "fallback": True
        }


def _get_fallback_locations(query: str, limit: int) -> List[Dict[str, Any]]:
    """Get fallback locations for common cities"""
    common_locations = [
        {
            'id': 'nyc',
            'name': 'New York, NY, USA',
            'coordinates': {'lat': 40.7128, 'lng': -74.0060},
            'country': 'United States',
            'region': 'New York',
            'type': 'city',
            'importance': 0.9
        },
        {
            'id': 'la',
            'name': 'Los Angeles, CA, USA',
            'coordinates': {'lat': 34.0522, 'lng': -118.2437},
            'country': 'United States',
            'region': 'California',
            'type': 'city',
            'importance': 0.9
        },
        {
            'id': 'chicago',
            'name': 'Chicago, IL, USA',
            'coordinates': {'lat': 41.8781, 'lng': -87.6298},
            'country': 'United States',
            'region': 'Illinois',
            'type': 'city',
            'importance': 0.8
        },
        {
            'id': 'houston',
            'name': 'Houston, TX, USA',
            'coordinates': {'lat': 29.7604, 'lng': -95.3698},
            'country': 'United States',
            'region': 'Texas',
            'type': 'city',
            'importance': 0.8
        },
        {
            'id': 'phoenix',
            'name': 'Phoenix, AZ, USA',
            'coordinates': {'lat': 33.4484, 'lng': -112.0740},
            'country': 'United States',
            'region': 'Arizona',
            'type': 'city',
            'importance': 0.7
        },
        {
            'id': 'london',
            'name': 'London, United Kingdom',
            'coordinates': {'lat': 51.5074, 'lng': -0.1278},
            'country': 'United Kingdom',
            'region': 'England',
            'type': 'city',
            'importance': 0.9
        },
        {
            'id': 'paris',
            'name': 'Paris, France',
            'coordinates': {'lat': 48.8566, 'lng': 2.3522},
            'country': 'France',
            'region': 'Île-de-France',
            'type': 'city',
            'importance': 0.9
        },
        {
            'id': 'tokyo',
            'name': 'Tokyo, Japan',
            'coordinates': {'lat': 35.6762, 'lng': 139.6503},
            'country': 'Japan',
            'region': 'Kantō',
            'type': 'city',
            'importance': 0.9
        }
    ]
    
    # Filter locations based on query
    query_lower = query.lower()
    filtered_locations = [
        loc for loc in common_locations
        if query_lower in loc['name'].lower() or 
           query_lower in loc['country'].lower() or
           query_lower in loc['region'].lower()
    ]
    
    # If no matches, return all cities up to limit
    if not filtered_locations:
        filtered_locations = common_locations
    
    return filtered_locations[:limit]


@router.get("/stations")
async def get_monitoring_stations(
    latitude: Optional[float] = Query(None, description="Center latitude"),
    longitude: Optional[float] = Query(None, description="Center longitude"),
    radius_km: int = Query(50, description="Search radius in kilometers"),
    country: Optional[str] = Query(None, description="Country filter"),
    limit: int = Query(100, description="Maximum number of results")
):
    """Get monitoring stations near specified coordinates"""
    logger.info(f"Monitoring stations requested for lat={latitude}, lon={longitude}, radius={radius_km}")
    
    # TODO: Implement actual monitoring station retrieval
    mock_stations = [
        {
            "id": "EPA_001",
            "name": "Central Park Monitoring Station",
            "coordinates": {"lat": 40.7829, "lng": -73.9654},
            "agency": "EPA",
            "station_type": "urban_background",
            "pollutants": ["pm25", "pm10", "o3", "no2", "so2", "co"],
            "last_updated": datetime.now().isoformat(),
            "data_source": "EPA AirNow",
            "distance_km": 2.5
        },
        {
            "id": "EPA_002",
            "name": "Brooklyn Bridge Station",
            "coordinates": {"lat": 40.7061, "lng": -73.9969},
            "agency": "EPA",
            "station_type": "traffic",
            "pollutants": ["pm25", "pm10", "no2", "co"],
            "last_updated": datetime.now().isoformat(),
            "data_source": "EPA AirNow",
            "distance_km": 5.2
        }
    ]
    
    return {
        "success": True,
        "stations": mock_stations,
        "total_count": len(mock_stations)
    }


@router.delete("/{location_id}")
async def delete_location(location_id: str):
    """Delete a location"""
    logger.info(f"Deleting location: {location_id}")
    
    # TODO: Implement actual location deletion
    return {"message": f"Location {location_id} deleted successfully"}