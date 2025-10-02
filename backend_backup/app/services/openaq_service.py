"""
OpenAQ Global Air Quality Service - Python Implementation
Access to 18,600+ monitoring stations worldwide with real-time air quality data
"""

import asyncio
import logging
from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any, Tuple
from urllib.parse import urlencode

import httpx
from geopy.distance import geodesic

from ..config import settings
from ..models import AirQualityReading, Coordinates, Pollutants, DataSource, MonitoringStation, AQICategory

logger = logging.getLogger(__name__)


class OpenAQService:
    """OpenAQ Platform service for global air quality monitoring data"""
    
    def __init__(self):
        self.base_url = settings.openaq_base_url
        self.api_key = settings.openaq_api_key
        self.rate_limit = settings.openaq_rate_limit
        self.cache: Dict[str, Dict] = {}
        self.cache_ttl = timedelta(minutes=10)
        
        # Rate limiting
        self.last_request_time = datetime.min
        self.min_request_interval = timedelta(milliseconds=100)  # 10 requests per second
        self.request_count = 0
        self.rate_limit_window_start = datetime.utcnow()
        
    async def _rate_limit(self):
        """Enforce rate limiting for OpenAQ API"""
        now = datetime.utcnow()
        
        # Reset counter if window expired (1 hour)
        if now - self.rate_limit_window_start > timedelta(hours=1):
            self.request_count = 0
            self.rate_limit_window_start = now
        
        # Check if we've exceeded rate limit
        if self.request_count >= self.rate_limit:
            sleep_time = 3600 - (now - self.rate_limit_window_start).total_seconds()
            if sleep_time > 0:
                logger.warning(f"Rate limit exceeded, sleeping for {sleep_time} seconds")
                await asyncio.sleep(sleep_time)
                self.request_count = 0
                self.rate_limit_window_start = datetime.utcnow()
        
        # Enforce minimum interval between requests
        time_since_last = now - self.last_request_time
        if time_since_last < self.min_request_interval:
            sleep_time = (self.min_request_interval - time_since_last).total_seconds()
            await asyncio.sleep(sleep_time)
        
        self.last_request_time = datetime.utcnow()
        self.request_count += 1
    
    async def _make_request(
        self,
        endpoint: str,
        params: Optional[Dict] = None
    ) -> Optional[Dict]:
        """Make authenticated request to OpenAQ API"""
        await self._rate_limit()
        
        url = f"{self.base_url}/{endpoint}"
        
        headers = {
            'X-API-Key': self.api_key,
            'Accept': 'application/json',
            'User-Agent': 'AirWatch-Backend/1.0'
        }
        
        request_params = params or {}
        
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.get(
                    url,
                    params=request_params,
                    headers=headers
                )
                
                if response.status_code == 200:
                    return response.json()
                elif response.status_code == 429:
                    logger.warning("OpenAQ rate limit exceeded")
                    # Wait and retry once
                    await asyncio.sleep(60)
                    response = await client.get(url, params=request_params, headers=headers)
                    if response.status_code == 200:
                        return response.json()
                else:
                    logger.error(f"OpenAQ API error: {response.status_code} - {response.text}")
                
                return None
                
        except Exception as e:
            logger.error(f"Error making OpenAQ API request: {e}")
            return None
    
    async def get_latest_measurements(
        self,
        coordinates: Optional[Coordinates] = None,
        radius_km: Optional[float] = 25,
        parameters: Optional[List[str]] = None,
        limit: int = 100
    ) -> List[Dict]:
        """Get latest air quality measurements"""
        cache_key = f"latest_{coordinates}_{radius_km}_{parameters}_{limit}"
        
        # Check cache
        if cache_key in self.cache:
            cached_data = self.cache[cache_key]
            if datetime.utcnow() - cached_data['timestamp'] < self.cache_ttl:
                return cached_data['data']
        
        try:
            endpoint = "measurements"
            request_params = {
                'limit': min(limit, 1000),  # OpenAQ max limit
                'sort': 'desc',
                'order_by': 'datetime'
            }
            
            # Add location-based filtering
            if coordinates:
                params_update = {
                    'coordinates': f"{coordinates.lat},{coordinates.lng}"
                }
                if radius_km is not None:
                    params_update['radius'] = str(radius_km * 1000)  # Convert to meters as string
                request_params.update(params_update)
            
            # Add parameter filtering
            if parameters:
                request_params['parameter'] = ','.join(parameters)
            else:
                # Default parameters
                request_params['parameter'] = 'pm25,pm10,o3,no2,so2,co'
            
            response_data = await self._make_request(endpoint, request_params)
            
            if response_data and 'results' in response_data:
                measurements = response_data['results']
                
                # Cache the results
                self.cache[cache_key] = {
                    'data': measurements,
                    'timestamp': datetime.utcnow()
                }
                
                logger.info(f"Retrieved {len(measurements)} latest measurements from OpenAQ")
                return measurements
            
            return []
            
        except Exception as e:
            logger.error(f"Error getting latest measurements: {e}")
            return []
    
    async def get_measurements_by_location(
        self,
        latitude: float,
        longitude: float,
        radius_km: float = 25,
        hours_back: int = 24
    ) -> List[Dict]:
        """Get measurements for a specific location and time range"""
        try:
            coordinates = Coordinates(lat=latitude, lng=longitude)
            
            # Calculate time range
            end_time = datetime.utcnow()
            start_time = end_time - timedelta(hours=hours_back)
            
            endpoint = "measurements"
            params = {
                'coordinates': f"{latitude},{longitude}",
                'radius': radius_km * 1000,  # Convert to meters
                'date_from': start_time.strftime('%Y-%m-%dT%H:%M:%S'),
                'date_to': end_time.strftime('%Y-%m-%dT%H:%M:%S'),
                'limit': 1000,
                'sort': 'desc',
                'parameter': 'pm25,pm10,o3,no2,so2,co'
            }
            
            response_data = await self._make_request(endpoint, params)
            
            if response_data and 'results' in response_data:
                measurements = response_data['results']
                logger.info(f"Retrieved {len(measurements)} measurements for location {latitude}, {longitude}")
                return measurements
            
            return []
            
        except Exception as e:
            logger.error(f"Error getting measurements by location: {e}")
            return []
    
    async def get_monitoring_stations(
        self,
        coordinates: Optional[Coordinates] = None,
        radius_km: Optional[float] = 50,
        country: Optional[str] = None,
        limit: int = 100
    ) -> List[MonitoringStation]:
        """Get monitoring stations information"""
        try:
            endpoint = "locations"
            params = {
                'limit': min(limit, 1000),
                'sort': 'desc',
                'order_by': 'lastUpdated'
            }
            
            # Add location-based filtering
            if coordinates:
                params_update = {
                    'coordinates': f"{coordinates.lat},{coordinates.lng}"
                }
                if radius_km is not None:
                    params_update['radius'] = str(radius_km * 1000)  # Convert to meters as string
                params.update(params_update)
            
            # Add country filtering
            if country:
                params['country'] = country
            
            response_data = await self._make_request(endpoint, params)
            
            if response_data and 'results' in response_data:
                locations = response_data['results']
                
                # Convert to MonitoringStation objects
                stations = []
                for location in locations:
                    try:
                        station = MonitoringStation(
                            id=str(location.get('id', '')),
                            name=location.get('name', 'Unknown Station'),
                            coordinates=Coordinates(
                                lat=location.get('coordinates', {}).get('latitude', 0),
                                lng=location.get('coordinates', {}).get('longitude', 0)
                            ),
                            country=location.get('country', 'Unknown'),
                            city=location.get('city'),
                            source_name=location.get('sourceName', 'OpenAQ'),
                            parameters=location.get('parameters', []),
                            last_updated=self._parse_datetime(location.get('lastUpdated')),
                            is_active=location.get('isActive', True),
                            station_type='ground'
                        )
                        stations.append(station)
                    except Exception as e:
                        logger.warning(f"Error parsing station data: {e}")
                        continue
                
                logger.info(f"Retrieved {len(stations)} monitoring stations")
                return stations
            
            return []
            
        except Exception as e:
            logger.error(f"Error getting monitoring stations: {e}")
            return []
    
    async def get_countries(self) -> List[Dict[str, Any]]:
        """Get list of countries with air quality data"""
        try:
            endpoint = "countries"
            params = {
                'limit': 1000,
                'sort': 'asc',
                'order_by': 'name'
            }
            
            response_data = await self._make_request(endpoint, params)
            
            if response_data and 'results' in response_data:
                countries = response_data['results']
                logger.info(f"Retrieved {len(countries)} countries from OpenAQ")
                return countries
            
            return []
            
        except Exception as e:
            logger.error(f"Error getting countries: {e}")
            return []
    
    async def get_cities(
        self,
        country: Optional[str] = None,
        limit: int = 100
    ) -> List[Dict[str, Any]]:
        """Get list of cities with air quality data"""
        try:
            endpoint = "cities"
            params = {
                'limit': min(limit, 1000),
                'sort': 'desc',
                'order_by': 'count'
            }
            
            if country:
                params['country'] = country
            
            response_data = await self._make_request(endpoint, params)
            
            if response_data and 'results' in response_data:
                cities = response_data['results']
                logger.info(f"Retrieved {len(cities)} cities from OpenAQ")
                return cities
            
            return []
            
        except Exception as e:
            logger.error(f"Error getting cities: {e}")
            return []
    
    async def get_parameters(self) -> List[Dict[str, Any]]:
        """Get list of available pollutant parameters"""
        try:
            endpoint = "parameters"
            
            response_data = await self._make_request(endpoint)
            
            if response_data and 'results' in response_data:
                parameters = response_data['results']
                logger.info(f"Retrieved {len(parameters)} parameters from OpenAQ")
                return parameters
            
            return []
            
        except Exception as e:
            logger.error(f"Error getting parameters: {e}")
            return []
    
    async def search_locations(
        self,
        query: str,
        limit: int = 10
    ) -> List[Dict[str, Any]]:
        """Search for locations by name"""
        try:
            # Search cities first
            cities = await self.get_cities(limit=limit)
            
            # Filter cities by query
            matching_cities = []
            query_lower = query.lower()
            
            for city in cities:
                city_name = city.get('city', '').lower()
                country_name = city.get('country', '').lower()
                
                if (query_lower in city_name or 
                    query_lower in country_name or
                    city_name.startswith(query_lower)):
                    matching_cities.append({
                        'name': f"{city.get('city', '')}, {city.get('country', '')}",
                        'coordinates': {
                            'lat': city.get('coordinates', {}).get('latitude', 0),
                            'lng': city.get('coordinates', {}).get('longitude', 0)
                        },
                        'country': city.get('country', ''),
                        'city': city.get('city', ''),
                        'measurement_count': city.get('count', 0),
                        'source': 'OpenAQ'
                    })
                
                if len(matching_cities) >= limit:
                    break
            
            return matching_cities
            
        except Exception as e:
            logger.error(f"Error searching locations: {e}")
            return []
    
    async def get_historical_averages(
        self,
        latitude: float,
        longitude: float,
        parameter: str,
        temporal: str = "day",
        days_back: int = 30
    ) -> List[Dict]:
        """Get historical averaged data for a parameter"""
        try:
            end_date = datetime.utcnow()
            start_date = end_date - timedelta(days=days_back)
            
            endpoint = "averages"
            params = {
                'coordinates': f"{latitude},{longitude}",
                'radius': 25000,  # 25km radius
                'parameter': parameter,
                'temporal': temporal,
                'date_from': start_date.strftime('%Y-%m-%d'),
                'date_to': end_date.strftime('%Y-%m-%d'),
                'limit': 1000
            }
            
            response_data = await self._make_request(endpoint, params)
            
            if response_data and 'results' in response_data:
                averages = response_data['results']
                logger.info(f"Retrieved {len(averages)} historical averages for {parameter}")
                return averages
            
            return []
            
        except Exception as e:
            logger.error(f"Error getting historical averages: {e}")
            return []
    
    def _parse_datetime(self, date_string: Optional[str]) -> Optional[datetime]:
        """Parse datetime string from OpenAQ API"""
        if not date_string:
            return None
        
        try:
            # Handle different date formats from OpenAQ
            if date_string.endswith('Z'):
                return datetime.fromisoformat(date_string.replace('Z', '+00:00'))
            elif '+' in date_string:
                return datetime.fromisoformat(date_string)
            else:
                return datetime.fromisoformat(date_string + '+00:00')
        except ValueError:
            return None
    
    def _calculate_distance(
        self,
        coord1: Coordinates,
        coord2: Coordinates
    ) -> float:
        """Calculate distance between two coordinates in kilometers"""
        try:
            return geodesic(
                (coord1.lat, coord1.lng),
                (coord2.lat, coord2.lng)
            ).kilometers
        except Exception:
            # Fallback to simple calculation
            lat_diff = coord1.lat - coord2.lat
            lng_diff = coord1.lng - coord2.lng
            return ((lat_diff ** 2) + (lng_diff ** 2)) ** 0.5 * 111  # Rough km conversion
    
    async def convert_to_air_quality_reading(
        self,
        measurements: List[Dict],
        location_name: str,
        coordinates: Coordinates
    ) -> Optional[AirQualityReading]:
        """Convert OpenAQ measurements to AirQualityReading"""
        try:
            if not measurements:
                return None
            
            # Group measurements by parameter
            pollutant_data = {}
            latest_timestamp = None
            
            for measurement in measurements:
                parameter = measurement.get('parameter', '').lower()
                value = measurement.get('value', 0)
                timestamp_str = measurement.get('date', {}).get('utc', '')
                
                # Parse timestamp
                timestamp = self._parse_datetime(timestamp_str)
                if not latest_timestamp or (timestamp and timestamp > latest_timestamp):
                    latest_timestamp = timestamp
                
                # Map parameter names
                if parameter in ['pm25', 'pm2.5']:
                    pollutant_data['pm25'] = value
                elif parameter in ['pm10']:
                    pollutant_data['pm10'] = value
                elif parameter in ['o3', 'ozone']:
                    pollutant_data['o3'] = value
                elif parameter in ['no2']:
                    pollutant_data['no2'] = value
                elif parameter in ['so2']:
                    pollutant_data['so2'] = value
                elif parameter in ['co']:
                    pollutant_data['co'] = value
            
            # Create Pollutants object
            pollutants = Pollutants(
                pm25=pollutant_data.get('pm25', 0),
                pm10=pollutant_data.get('pm10', 0),
                o3=pollutant_data.get('o3', 0),
                no2=pollutant_data.get('no2', 0),
                so2=pollutant_data.get('so2', 0),
                co=pollutant_data.get('co', 0)
            )
            
            # Calculate AQI from pollutants (simplified)
            aqi = self._calculate_aqi_from_pollutants(pollutants)
            
            # Determine AQI category
            category = self._get_aqi_category(aqi)
            
            # Determine primary pollutant
            primary_pollutant = self._get_primary_pollutant(pollutants)
            
            return AirQualityReading(
                location=location_name,
                coordinates=coordinates,
                timestamp=latest_timestamp or datetime.utcnow(),
                aqi=aqi,
                category=category,
                pollutants=pollutants,
                primary_pollutant=primary_pollutant,
                data_source=DataSource.OPENAQ,
                quality_score=0.85,  # OpenAQ generally has good data quality
                health_recommendations=self._get_health_recommendations(aqi, category)
            )
            
        except Exception as e:
            logger.error(f"Error converting measurements to AirQualityReading: {e}")
            return None
    
    def _calculate_aqi_from_pollutants(self, pollutants: Pollutants) -> int:
        """Calculate AQI from pollutant concentrations (simplified EPA method)"""
        aqi_values = []
        
        # PM2.5 AQI calculation
        if pollutants.pm25 > 0:
            aqi_values.append(self._pm25_to_aqi(pollutants.pm25))
        
        # PM10 AQI calculation
        if pollutants.pm10 > 0:
            aqi_values.append(self._pm10_to_aqi(pollutants.pm10))
        
        # O3 AQI calculation (assuming µg/m³, convert to ppm)
        if pollutants.o3 > 0:
            o3_ppm = pollutants.o3 / 1960  # Rough conversion
            aqi_values.append(self._ozone_to_aqi(o3_ppm))
        
        # NO2 AQI calculation
        if pollutants.no2 > 0:
            aqi_values.append(self._no2_to_aqi(pollutants.no2))
        
        return max(aqi_values) if aqi_values else 50
    
    def _pm25_to_aqi(self, pm25: float) -> int:
        """Convert PM2.5 concentration to AQI"""
        if pm25 <= 12: return int(pm25 * 50 / 12)
        elif pm25 <= 35.4: return int(50 + (pm25 - 12) * 50 / (35.4 - 12))
        elif pm25 <= 55.4: return int(100 + (pm25 - 35.4) * 50 / (55.4 - 35.4))
        elif pm25 <= 150.4: return int(150 + (pm25 - 55.4) * 50 / (150.4 - 55.4))
        elif pm25 <= 250.4: return int(200 + (pm25 - 150.4) * 100 / (250.4 - 150.4))
        else: return 300
    
    def _pm10_to_aqi(self, pm10: float) -> int:
        """Convert PM10 concentration to AQI"""
        if pm10 <= 54: return int(pm10 * 50 / 54)
        elif pm10 <= 154: return int(50 + (pm10 - 54) * 50 / (154 - 54))
        elif pm10 <= 254: return int(100 + (pm10 - 154) * 50 / (254 - 154))
        elif pm10 <= 354: return int(150 + (pm10 - 254) * 50 / (354 - 254))
        else: return 200
    
    def _ozone_to_aqi(self, ozone_ppm: float) -> int:
        """Convert Ozone concentration (ppm) to AQI"""
        if ozone_ppm <= 0.054: return int(ozone_ppm * 50 / 0.054)
        elif ozone_ppm <= 0.070: return int(50 + (ozone_ppm - 0.054) * 50 / (0.070 - 0.054))
        elif ozone_ppm <= 0.085: return int(100 + (ozone_ppm - 0.070) * 50 / (0.085 - 0.070))
        elif ozone_ppm <= 0.105: return int(150 + (ozone_ppm - 0.085) * 50 / (0.105 - 0.085))
        else: return 200
    
    def _no2_to_aqi(self, no2: float) -> int:
        """Convert NO2 concentration to AQI"""
        if no2 <= 53: return int(no2 * 50 / 53)
        elif no2 <= 100: return int(50 + (no2 - 53) * 50 / (100 - 53))
        elif no2 <= 360: return int(100 + (no2 - 100) * 100 / (360 - 100))
        else: return 200
    
    def _get_aqi_category(self, aqi: int) -> AQICategory:
        """Get AQI category from AQI value"""
        if aqi <= 50: return AQICategory.GOOD
        elif aqi <= 100: return AQICategory.MODERATE
        elif aqi <= 150: return AQICategory.UNHEALTHY_SENSITIVE
        elif aqi <= 200: return AQICategory.UNHEALTHY
        elif aqi <= 300: return AQICategory.VERY_UNHEALTHY
        else: return AQICategory.HAZARDOUS
    
    def _get_primary_pollutant(self, pollutants: Pollutants) -> str:
        """Determine primary pollutant driving AQI"""
        aqi_values = {
            'PM2.5': self._pm25_to_aqi(pollutants.pm25) if pollutants.pm25 > 0 else 0,
            'PM10': self._pm10_to_aqi(pollutants.pm10) if pollutants.pm10 > 0 else 0,
            'Ozone': self._ozone_to_aqi(pollutants.o3 / 1960) if pollutants.o3 > 0 else 0,
            'NO2': self._no2_to_aqi(pollutants.no2) if pollutants.no2 > 0 else 0
        }
        
        return max(aqi_values.items(), key=lambda x: x[1])[0] if aqi_values else 'PM2.5'
    
    def _get_health_recommendations(self, aqi: int, category: str) -> List[str]:
        """Get health recommendations based on AQI"""
        if aqi <= 50:
            return ["Air quality is satisfactory. Enjoy outdoor activities."]
        elif aqi <= 100:
            return [
                "Air quality is acceptable for most people.",
                "Sensitive individuals may experience minor irritation."
            ]
        elif aqi <= 150:
            return [
                "Sensitive groups should limit prolonged outdoor exertion.",
                "General public can continue normal activities."
            ]
        elif aqi <= 200:
            return [
                "Everyone should limit prolonged outdoor exertion.",
                "Sensitive groups should avoid outdoor activities."
            ]
        elif aqi <= 300:
            return [
                "Everyone should avoid prolonged outdoor exertion.",
                "Consider staying indoors."
            ]
        else:
            return [
                "Health warning: everyone should avoid outdoor activities.",
                "Stay indoors and keep windows closed."
            ]
    
    async def get_service_status(self) -> Dict[str, Any]:
        """Get OpenAQ service status"""
        try:
            start_time = datetime.utcnow()
            
            # Test API connectivity
            response_data = await self._make_request("countries", {"limit": 1})
            
            response_time = (datetime.utcnow() - start_time).total_seconds() * 1000
            
            status = "operational" if response_data else "degraded"
            
            return {
                'service_name': 'OpenAQ Platform',
                'status': status,
                'response_time_ms': response_time,
                'last_check': datetime.utcnow(),
                'details': {
                    'api_accessible': response_data is not None,
                    'global_coverage': True,
                    'station_count': '18,600+',
                    'parameters': 'PM2.5, PM10, O3, NO2, SO2, CO',
                    'rate_limit': f"{self.rate_limit}/hour"
                }
            }
            
        except Exception as e:
            return {
                'service_name': 'OpenAQ Platform',
                'status': 'offline',
                'response_time_ms': 0,
                'last_check': datetime.utcnow(),
                'details': {
                    'error': str(e)
                }
            }
    
    def clear_cache(self):
        """Clear the service cache"""
        self.cache.clear()
        logger.info("OpenAQ service cache cleared")


# Create singleton instance
openaq_service = OpenAQService()