"""
EPA AirNow Service - Official US Government Air Quality Data
Provides real-time and historical air quality data from the US EPA AirNow system
Covers United States, Canada, and Mexico with official government monitoring stations
"""

import asyncio
import json
import logging
from datetime import datetime, timedelta, timezone
from typing import Dict, List, Optional, Tuple, Any
from urllib.parse import urlencode

import httpx
from geopy.distance import geodesic

from ..config import settings
from ..models import (
    AirQualityReading, Coordinates, Pollutants, MonitoringStation,
   AirQualityAlert, AQICategory, DataSource, ForecastData # type: ignore
)

logger = logging.getLogger(__name__)


class EPAAirNowService:
    """
    EPA AirNow service for official US government air quality data
    
    Provides access to:
    - Real-time observations from 2000+ monitoring sites
    - Air Quality Index (AQI) values and forecasts
    - Health alerts and recommendations
    - Historical data and trends
    - Multi-pollutant monitoring (PM2.5, PM10, O3, NO2, SO2, CO)
    """
    
    def __init__(self):
        self.base_url = "https://www.airnowapi.org"
        self.api_key = settings.epa_airnow_api_key
        self.timeout = 30
        self.max_retries = 3
        self.rate_limit_delay = 1.0  # EPA allows 500 requests/hour
        
        # Cache
        self._cache = {}
        self._cache_duration = 300  # 5 minutes
        
        # US/Canada/Mexico coverage bounds
        self.coverage_bounds = {
            'north': 70.0,   # Northern Canada
            'south': 14.0,   # Southern Mexico
            'west': -180.0,  # Alaska
            'east': -50.0    # Eastern Canada
        }
        
        # EPA AQI breakpoints for calculation
        self.aqi_breakpoints = {
            'pm25': [
                (0, 12.0, 0, 50),      # Good
                (12.1, 35.4, 51, 100), # Moderate
                (35.5, 55.4, 101, 150), # Unhealthy for Sensitive Groups
                (55.5, 150.4, 151, 200), # Unhealthy
                (150.5, 250.4, 201, 300), # Very Unhealthy
                (250.5, 500.4, 301, 500)  # Hazardous
            ],
            'pm10': [
                (0, 54, 0, 50),
                (55, 154, 51, 100),
                (155, 254, 101, 150),
                (255, 354, 151, 200),
                (355, 424, 201, 300),
                (425, 604, 301, 500)
            ],
            'o3': [  # 8-hour average
                (0, 0.054, 0, 50),
                (0.055, 0.070, 51, 100),
                (0.071, 0.085, 101, 150),
                (0.086, 0.105, 151, 200),
                (0.106, 0.200, 201, 300)
            ],
            'no2': [  # 1-hour average
                (0, 53, 0, 50),
                (54, 100, 51, 100),
                (101, 360, 101, 150),
                (361, 649, 151, 200),
                (650, 1249, 201, 300),
                (1250, 2049, 301, 500)
            ],
            'so2': [  # 1-hour average
                (0, 35, 0, 50),
                (36, 75, 51, 100),
                (76, 185, 101, 150),
                (186, 304, 151, 200),
                (305, 604, 201, 300),
                (605, 1004, 301, 500)
            ],
            'co': [  # 8-hour average
                (0, 4.4, 0, 50),
                (4.5, 9.4, 51, 100),
                (9.5, 12.4, 101, 150),
                (12.5, 15.4, 151, 200),
                (15.5, 30.4, 201, 300),
                (30.5, 50.4, 301, 500)
            ]
        }
        
        logger.info("EPA AirNow service initialized")
    
    async def _make_request(
        self, 
        endpoint: str, 
        params: Optional[Dict] = None
    ) -> Optional[Dict]:
        """Make API request with retry logic and rate limiting"""
        if not self.api_key:
            logger.warning("EPA AirNow API key not configured")
            return None
        
        # Add rate limiting
        await asyncio.sleep(self.rate_limit_delay)
        
        # Prepare parameters
        request_params = {
            'api_key': self.api_key,
            'format': 'application/json'
        }
        if params:
            request_params.update(params)
        
        url = f"{self.base_url}/{endpoint.lstrip('/')}"
        
        # Check cache
        cache_key = f"{url}?{urlencode(sorted(request_params.items()))}"
        if cache_key in self._cache:
            cached_data, timestamp = self._cache[cache_key]
            if datetime.now().timestamp() - timestamp < self._cache_duration:
                return cached_data
        
        for attempt in range(self.max_retries):
            try:
                async with httpx.AsyncClient(timeout=self.timeout) as client:
                    response = await client.get(url, params=request_params)
                    
                    if response.status_code == 200:
                        data = response.json()
                        
                        # Cache successful response
                        self._cache[cache_key] = (data, datetime.now().timestamp())
                        
                        return data
                    
                    elif response.status_code == 429:
                        # Rate limited
                        wait_time = 2 ** attempt
                        logger.warning(f"Rate limited, waiting {wait_time}s")
                        await asyncio.sleep(wait_time)
                        continue
                    
                    else:
                        logger.error(f"EPA AirNow API error: {response.status_code}")
                        return None
            
            except Exception as e:
                logger.error(f"Request failed (attempt {attempt + 1}): {e}")
                if attempt < self.max_retries - 1:
                    await asyncio.sleep(2 ** attempt)
                continue
        
        logger.error(f"All attempts failed for {endpoint}")
        return None
    
    def is_location_covered(self, latitude: float, longitude: float) -> bool:
        """Check if location is within EPA AirNow coverage area"""
        return (
            self.coverage_bounds['south'] <= latitude <= self.coverage_bounds['north'] and
            self.coverage_bounds['west'] <= longitude <= self.coverage_bounds['east']
        )
    
    async def get_current_observations(
        self, 
        latitude: float, 
        longitude: float, 
        distance: int = 25
    ) -> Optional[List[Dict]]:
        """Get current air quality observations near a location"""
        if not self.is_location_covered(latitude, longitude):
            return None
        
        params = {
            'latitude': latitude,
            'longitude': longitude,
            'distance': distance,  # miles
            'verbose': 1
        }
        
        try:
            data = await self._make_request('/aq/observation/latLong/current/', params)
            return data if data else []
        
        except Exception as e:
            logger.error(f"Error getting current observations: {e}")
            return None
    
    async def get_current_aqi(
        self, 
        latitude: float, 
        longitude: float, 
        distance: int = 25
    ) -> Optional[Dict]:
        """Get current AQI for a location"""
        if not self.is_location_covered(latitude, longitude):
            return None
        
        params = {
            'latitude': latitude,
            'longitude': longitude,
            'distance': distance
        }
        
        try:
            data = await self._make_request('/aq/observation/latLong/current/', params)
            
            if data and len(data) > 0:
                # Find the observation with the highest AQI
                max_aqi_obs = max(data, key=lambda x: x.get('AQI', 0))
                return max_aqi_obs
            
            return None
        
        except Exception as e:
            logger.error(f"Error getting current AQI: {e}")
            return None
    
    async def get_forecast(
        self, 
        latitude: float, 
        longitude: float, 
        date: Optional[str] = None
    ) -> Optional[List[Dict]]:
        """Get air quality forecast for a location"""
        if not self.is_location_covered(latitude, longitude):
            return None
        
        params = {
            'latitude': latitude,
            'longitude': longitude
        }
        
        if date:
            params['date'] = date
        
        try:
            data = await self._make_request('/aq/forecast/latLong/', params)
            return data if data else []
        
        except Exception as e:
            logger.error(f"Error getting forecast: {e}")
            return None
    
    async def get_historical_observations(
        self, 
        latitude: float, 
        longitude: float, 
        start_date: str, 
        end_date: str, 
        distance: int = 25
    ) -> Optional[List[Dict]]:
        """Get historical air quality observations"""
        if not self.is_location_covered(latitude, longitude):
            return None
        
        params = {
            'latitude': latitude,
            'longitude': longitude,
            'startDate': start_date,  # Format: YYYY-MM-DD
            'endDate': end_date,
            'distance': distance,
            'verbose': 1
        }
        
        try:
            data = await self._make_request('/aq/observation/latLong/historical/', params)
            return data if data else []
        
        except Exception as e:
            logger.error(f"Error getting historical observations: {e}")
            return None
    
    def calculate_aqi(self, pollutant: str, concentration: float) -> int:
        """Calculate AQI from pollutant concentration using EPA formula"""
        if pollutant.lower() not in self.aqi_breakpoints:
            return 0
        
        breakpoints = self.aqi_breakpoints[pollutant.lower()]
        
        for bp_low, bp_high, aqi_low, aqi_high in breakpoints:
            if bp_low <= concentration <= bp_high:
                # Linear interpolation formula
                aqi = ((aqi_high - aqi_low) / (bp_high - bp_low)) * (concentration - bp_low) + aqi_low
                return round(aqi)
        
        # If concentration exceeds all breakpoints
        if concentration > breakpoints[-1][1]:
            return 500  # Maximum AQI
        
        return 0
    
    def get_aqi_level(self, aqi: int) -> AQICategory:
        """Get AQI level and health information"""
        if aqi <= 50:
            return AQICategory.GOOD
        elif aqi <= 100:
            return AQICategory.MODERATE
        elif aqi <= 150:
            return AQICategory.UNHEALTHY_SENSITIVE
        elif aqi <= 200:
            return AQICategory.UNHEALTHY
        elif aqi <= 300:
            return AQICategory.VERY_UNHEALTHY
        else:
            return AQICategory.HAZARDOUS
    
    def get_health_message(self, aqi: int, dominant_pollutant: str = "PM2.5") -> str:
        """Get health message based on AQI level"""
        level = self.get_aqi_level(aqi)
        
        messages = {
            AQICategory.GOOD: "Air quality is considered satisfactory, and air pollution poses little or no risk.",
            AQICategory.MODERATE: "Air quality is acceptable for most people. However, sensitive groups may experience minor symptoms.",
            AQICategory.UNHEALTHY_SENSITIVE: "Members of sensitive groups may experience health effects. The general public is not likely to be affected.",
            AQICategory.UNHEALTHY: "Everyone may begin to experience health effects; members of sensitive groups may experience more serious health effects.",
            AQICategory.VERY_UNHEALTHY: "Health warnings of emergency conditions. The entire population is more likely to be affected.",
            AQICategory.HAZARDOUS: "Health alert: everyone may experience more serious health effects."
        }
        
        return messages.get(level, "Air quality information unavailable.")
    
    async def convert_to_air_quality_reading(
        self, 
        observations: List[Dict], 
        location_name: str,
        coordinates: Coordinates
    ) -> Optional[AirQualityReading]:
        """Convert EPA observations to standardized AirQualityReading"""
        if not observations:
            return None
        
        try:
            # Group observations by parameter
            pollutant_data = {}
            overall_aqi = 0
            dominant_pollutant = "PM2.5"
            
            for obs in observations:
                parameter = obs.get('ParameterName', '').lower()
                value = obs.get('Value', 0)
                aqi = obs.get('AQI', 0)
                
                # Map EPA parameter names to our standard names
                param_mapping = {
                    'pm2.5': 'pm25',
                    'pm10': 'pm10',
                    'ozone': 'o3',
                    'no2': 'no2',
                    'so2': 'so2',
                    'co': 'co'
                }
                
                mapped_param = param_mapping.get(parameter)
                if mapped_param:
                    pollutant_data[mapped_param] = {
                        'value': value,
                        'aqi': aqi,
                        'unit': obs.get('Unit', 'µg/m³')
                    }
                    
                    # Track highest AQI
                    if aqi > overall_aqi:
                        overall_aqi = aqi
                        dominant_pollutant = mapped_param.upper()
            
            # Create Pollutants object
            pollutants = Pollutants(
                pm25=pollutant_data.get('pm25', {}).get('value', 0),
                pm10=pollutant_data.get('pm10', {}).get('value', 0),
                o3=pollutant_data.get('o3', {}).get('value', 0),
                no2=pollutant_data.get('no2', {}).get('value', 0),
                so2=pollutant_data.get('so2', {}).get('value', 0),
                co=pollutant_data.get('co', {}).get('value', 0)
            )
            
            # If no AQI provided, calculate it
            if overall_aqi == 0 and pollutants.pm25 > 0:
                overall_aqi = self.calculate_aqi('pm25', pollutants.pm25)
            
            # Get AQI level and health info
            aqi_category = self.get_aqi_level(overall_aqi)
            health_message = self.get_health_message(overall_aqi, dominant_pollutant)
            
            # Create air quality reading
            reading = AirQualityReading(
                location=location_name,
                coordinates=coordinates,
                timestamp=datetime.now(timezone.utc),
                aqi=overall_aqi,
                category=aqi_category,
                primary_pollutant=dominant_pollutant,
                pollutants=pollutants,
                data_source=DataSource.EPA_AIRNOW,
                health_recommendations=[health_message]
            )
            
            return reading
        
        except Exception as e:
            logger.error(f"Error converting EPA observations: {e}")
            return None
    
    async def get_monitoring_stations(
        self, 
        latitude: float, 
        longitude: float, 
        distance: int = 50
    ) -> List[MonitoringStation]:
        """Get EPA monitoring stations near a location"""
        stations = []
        
        try:
            # Get observations to find stations
            observations = await self.get_current_observations(latitude, longitude, distance)
            
            if not observations:
                return stations
            
            # Extract unique stations from observations
            station_dict = {}
            
            for obs in observations:
                site_name = obs.get('SiteName', 'Unknown Site')
                site_lat = obs.get('Latitude', latitude)
                site_lng = obs.get('Longitude', longitude)
                agency_name = obs.get('AgencyName', 'EPA')
                
                station_id = f"{site_lat}_{site_lng}"
                
                if station_id not in station_dict:
                    station_dict[station_id] = MonitoringStation(
                        id=station_id,
                        name=site_name,
                        coordinates=Coordinates(lat=site_lat, lng=site_lng),
                        country="US",  # EPA AirNow covers US/Canada/Mexico, default to US
                        source_name=agency_name,
                        parameters=[],
                        station_type="ground",
                        last_updated=datetime.now(timezone.utc)
                    )
                
                # Add pollutant to station
                parameter = obs.get('ParameterName', '').lower()
                if parameter and parameter not in station_dict[station_id].parameters:
                    station_dict[station_id].parameters.append(parameter)
            
            stations = list(station_dict.values())
            
            # Calculate distances and sort by proximity
            user_location = (latitude, longitude)
            for station in stations:
                station_location = (station.coordinates.lat, station.coordinates.lng)
                distance_km = geodesic(user_location, station_location).kilometers
                station.distance_km = distance_km
            
            stations.sort(key=lambda x: x.distance_km or float('inf'))
            
        except Exception as e:
            logger.error(f"Error getting EPA monitoring stations: {e}")
        
        return stations
    
    async def get_alerts(
        self, 
        latitude: float, 
        longitude: float
    ) -> List[AirQualityAlert]:
        """Get air quality alerts for a location"""
        alerts = []
        
        try:
            # Check current AQI for alert conditions
            current_data = await self.get_current_aqi(latitude, longitude)
            
            if current_data:
                aqi = current_data.get('AQI', 0)
                category = current_data.get('Category', {}).get('Name', 'Good')
                
                # Create alert for unhealthy conditions
                if aqi > 100:  # Unhealthy for Sensitive Groups or worse
                    alert = AirQualityAlert(
                        id=f"epa_alert_{int(datetime.now().timestamp())}",
                        type="health_warning",
                        severity="moderate" if aqi <= 150 else "high" if aqi <= 200 else "severe",
                        title=f"Air Quality Alert - {category}",
                        message=self.get_health_message(aqi),
                        affected_area=f"Area within 25 miles of {latitude:.3f}, {longitude:.3f}",
                        start_time=datetime.now(timezone.utc),
                        end_time=datetime.now(timezone.utc) + timedelta(hours=24),
                        pollutants=[current_data.get('ParameterName', 'PM2.5')],
                        source="EPA AirNow"
                    )
                    alerts.append(alert)
        
        except Exception as e:
            logger.error(f"Error getting EPA alerts: {e}")
        
        return alerts
    
    async def get_service_status(self) -> Dict[str, Any]:
        """Get EPA AirNow service status"""
        try:
            # Test API connectivity with a simple request
            test_data = await self._make_request('/aq/observation/latLong/current/', {
                'latitude': 40.7128,  # NYC
                'longitude': -74.0060,
                'distance': 1
            })
            
            status = "operational" if test_data is not None else "degraded"
            
            return {
                "service": "EPA AirNow",
                "status": status,
                "coverage": "US, Canada, Mexico",
                "stations": "2000+",
                "last_checked": datetime.utcnow().isoformat(),
                "api_key_configured": bool(self.api_key),
                "cache_size": len(self._cache)
            }
        
        except Exception as e:
            logger.error(f"Error checking EPA service status: {e}")
            return {
                "service": "EPA AirNow",
                "status": "error",
                "error": str(e),
                "last_checked": datetime.utcnow().isoformat()
            }
    
    def clear_cache(self):
        """Clear service cache"""
        self._cache.clear()
        logger.info("EPA AirNow cache cleared")


# Global service instance
epa_airnow_service = EPAAirNowService()