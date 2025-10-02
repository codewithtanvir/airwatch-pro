"""
Weather Service Integration
Provides meteorological data to enhance air quality analysis and forecasting
"""

import aiohttp
import asyncio
from typing import Dict, List, Optional, Any
from datetime import datetime, timedelta
import logging
from dataclasses import dataclass

from app.core.logging import get_logger

logger = get_logger(__name__)


@dataclass
class WeatherData:
    """Weather data structure for air quality correlation"""
    temperature: float
    humidity: float
    pressure: float
    wind_speed: float
    wind_direction: float
    wind_gust: Optional[float]
    visibility: float
    uv_index: float
    precipitation: float
    cloud_cover: float
    air_quality_index_modifier: float
    pollution_dispersion_factor: float
    timestamp: str


@dataclass
class WeatherForecast:
    """Weather forecast for air quality prediction"""
    datetime: str
    temperature: float
    humidity: float
    wind_speed: float
    wind_direction: float
    precipitation_chance: float
    cloud_cover: float
    pressure_trend: str
    air_quality_impact: str
    dispersion_conditions: str


class WeatherService:
    """
    Weather service for air quality enhancement
    Integrates with OpenWeatherMap API for real-time and forecast data
    """
    
    def __init__(self):
        # In production, use environment variable for API key
        self.api_key = "demo_key_for_hackathon"  # Replace with real key
        self.base_url = "https://api.openweathermap.org/data/2.5"
        self.session: Optional[aiohttp.ClientSession] = None
        
    async def _get_session(self) -> aiohttp.ClientSession:
        """Get or create HTTP session"""
        if self.session is None or self.session.closed:
            self.session = aiohttp.ClientSession()
        return self.session
    
    async def close(self):
        """Close HTTP session"""
        if self.session and not self.session.closed:
            await self.session.close()
    
    def _calculate_air_quality_modifiers(self, weather_data: Dict[str, Any]) -> Dict[str, float]:
        """
        Calculate how weather conditions affect air quality
        Returns modifiers for pollution concentration and dispersion
        """
        wind_speed = weather_data.get("wind", {}).get("speed", 0)
        humidity = weather_data.get("main", {}).get("humidity", 50)
        pressure = weather_data.get("main", {}).get("pressure", 1013)
        temp = weather_data.get("main", {}).get("temp", 20)
        precipitation = weather_data.get("rain", {}).get("1h", 0) + weather_data.get("snow", {}).get("1h", 0)
        
        # Wind speed correlation with pollution dispersion
        if wind_speed > 10:  # Strong winds (> 10 m/s)
            dispersion_factor = 0.7  # Good dispersion, lower concentrations
        elif wind_speed > 5:  # Moderate winds (5-10 m/s)
            dispersion_factor = 0.85
        elif wind_speed > 2:  # Light winds (2-5 m/s)
            dispersion_factor = 1.0
        else:  # Calm conditions (< 2 m/s)
            dispersion_factor = 1.3  # Poor dispersion, higher concentrations
            
        # Temperature inversion effects
        # High pressure + low wind = temperature inversion = poor air quality
        pressure_factor = 1.0
        if pressure > 1020 and wind_speed < 3:  # High pressure, calm conditions
            pressure_factor = 1.25  # Temperature inversion likely
        elif pressure < 1000:  # Low pressure, usually more mixing
            pressure_factor = 0.9
            
        # Humidity effects on particle formation and growth
        humidity_factor = 1.0
        if humidity > 80:  # High humidity promotes particle growth
            humidity_factor = 1.15
        elif humidity < 30:  # Low humidity, less particle growth
            humidity_factor = 0.95
            
        # Precipitation washout effect
        precipitation_factor = 1.0
        if precipitation > 1.0:  # Significant precipitation
            precipitation_factor = 0.6  # Strong washout effect
        elif precipitation > 0.1:  # Light precipitation
            precipitation_factor = 0.8
            
        # Combined air quality modifier
        aqi_modifier = dispersion_factor * pressure_factor * humidity_factor * precipitation_factor
        
        return {
            "aqi_modifier": aqi_modifier,
            "dispersion_factor": dispersion_factor,
            "pressure_factor": pressure_factor,
            "humidity_factor": humidity_factor,
            "precipitation_factor": precipitation_factor
        }
    
    def _get_wind_direction_name(self, degrees: float) -> str:
        """Convert wind direction degrees to compass direction"""
        directions = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE",
                     "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"]
        index = round(degrees / 22.5) % 16
        return directions[index]
    
    def _assess_pollution_transport(self, wind_speed: float, wind_direction: float, 
                                  pressure: float, temperature: float) -> str:
        """Assess how weather conditions affect pollution transport"""
        
        if wind_speed > 15:
            return "rapid_dispersion"
        elif wind_speed > 8:
            return "good_dispersion"
        elif wind_speed > 3:
            return "moderate_dispersion"
        elif pressure > 1020 and temperature > 25:
            return "poor_dispersion_inversion"
        elif wind_speed < 1:
            return "stagnant_conditions"
        else:
            return "limited_dispersion"
    
    async def get_current_weather(self, latitude: float, longitude: float) -> WeatherData:
        """
        Get current weather data for air quality analysis
        """
        logger.info(f"Fetching weather data for lat={latitude}, lon={longitude}")
        
        try:
            # For demo purposes, return realistic weather data
            # In production, replace with actual API call
            current_time = datetime.utcnow()
            
            # Simulate realistic weather based on location and time
            base_temp = 15 + (latitude / 90) * 15  # Temperature correlation with latitude
            
            mock_weather_data = {
                "main": {
                    "temp": base_temp + (current_time.hour - 12) * 0.5,  # Daily temperature variation
                    "humidity": 65 + (current_time.hour % 12) * 2,  # Humidity variation
                    "pressure": 1013 + (latitude / 90) * 5  # Pressure variation
                },
                "wind": {
                    "speed": 5.5 + (current_time.hour % 6),  # Wind speed variation
                    "deg": (current_time.hour * 15) % 360,  # Wind direction variation
                    "gust": 8.2
                },
                "visibility": 10000,
                "clouds": {"all": 30},
                "rain": {"1h": 0.0},
                "snow": {"1h": 0.0},
                "uvi": max(0, 5 - abs(current_time.hour - 12) * 0.5)  # UV index based on time
            }
            
            # Calculate air quality modifiers
            modifiers = self._calculate_air_quality_modifiers(mock_weather_data)
            
            weather_data = WeatherData(
                temperature=mock_weather_data["main"]["temp"],
                humidity=mock_weather_data["main"]["humidity"],
                pressure=mock_weather_data["main"]["pressure"],
                wind_speed=mock_weather_data["wind"]["speed"],
                wind_direction=mock_weather_data["wind"]["deg"],
                wind_gust=mock_weather_data["wind"].get("gust"),
                visibility=mock_weather_data["visibility"] / 1000,  # Convert to km
                uv_index=mock_weather_data["uvi"],
                precipitation=mock_weather_data["rain"]["1h"] + mock_weather_data["snow"]["1h"],
                cloud_cover=mock_weather_data["clouds"]["all"],
                air_quality_index_modifier=modifiers["aqi_modifier"],
                pollution_dispersion_factor=modifiers["dispersion_factor"],
                timestamp=current_time.isoformat()
            )
            
            logger.info(f"Weather data retrieved: temp={weather_data.temperature}°C, "
                       f"wind={weather_data.wind_speed}m/s, AQI modifier={weather_data.air_quality_index_modifier:.2f}")
            
            return weather_data
            
        except Exception as e:
            logger.error(f"Error fetching weather data: {str(e)}")
            # Return default weather data if API fails
            return WeatherData(
                temperature=20.0,
                humidity=60.0,
                pressure=1013.25,
                wind_speed=3.0,
                wind_direction=180.0,
                wind_gust=None,
                visibility=10.0,
                uv_index=3.0,
                precipitation=0.0,
                cloud_cover=50.0,
                air_quality_index_modifier=1.0,
                pollution_dispersion_factor=1.0,
                timestamp=datetime.utcnow().isoformat()
            )
    
    async def get_weather_forecast(self, latitude: float, longitude: float, 
                                 hours_ahead: int = 48) -> List[WeatherForecast]:
        """
        Get weather forecast for air quality prediction
        """
        logger.info(f"Fetching weather forecast for lat={latitude}, lon={longitude}, hours={hours_ahead}")
        
        try:
            forecasts = []
            current_time = datetime.utcnow()
            
            for hour in range(1, min(hours_ahead + 1, 49)):  # Max 48 hours
                forecast_time = current_time + timedelta(hours=hour)
                
                # Simulate forecast weather patterns
                base_temp = 15 + (latitude / 90) * 15
                daily_temp_variation = 5 * abs(((forecast_time.hour - 14) % 24 - 12) / 12)
                temperature = base_temp + daily_temp_variation + (hour * 0.1)  # Slight trend
                
                humidity = 60 + (hour % 12) * 2 + (forecast_time.hour % 6) * 3
                wind_speed = 4 + (hour % 8) + (forecast_time.hour % 4)
                wind_direction = (forecast_time.hour * 20 + hour * 5) % 360
                
                precipitation_chance = max(0, min(100, 20 + (hour % 24) * 2 + (forecast_time.hour % 8) * 5))
                cloud_cover = 30 + (hour % 16) * 4
                
                # Determine pressure trend
                if hour < 12:
                    pressure_trend = "rising"
                elif hour < 36:
                    pressure_trend = "stable"
                else:
                    pressure_trend = "falling"
                
                # Assess air quality impact
                if wind_speed > 10:
                    air_quality_impact = "improving"
                elif wind_speed < 2 and precipitation_chance < 10:
                    air_quality_impact = "worsening"
                else:
                    air_quality_impact = "stable"
                
                # Assess dispersion conditions
                dispersion_conditions = self._assess_pollution_transport(
                    wind_speed, wind_direction, 1013, temperature
                )
                
                forecast = WeatherForecast(
                    datetime=forecast_time.isoformat(),
                    temperature=temperature,
                    humidity=humidity,
                    wind_speed=wind_speed,
                    wind_direction=wind_direction,
                    precipitation_chance=precipitation_chance,
                    cloud_cover=cloud_cover,
                    pressure_trend=pressure_trend,
                    air_quality_impact=air_quality_impact,
                    dispersion_conditions=dispersion_conditions
                )
                
                forecasts.append(forecast)
            
            logger.info(f"Generated {len(forecasts)} weather forecast entries")
            return forecasts
            
        except Exception as e:
            logger.error(f"Error generating weather forecast: {str(e)}")
            return []
    
    async def get_pollution_transport_analysis(self, latitude: float, longitude: float) -> Dict[str, Any]:
        """
        Analyze how current weather affects pollution transport and concentration
        """
        logger.info(f"Analyzing pollution transport for lat={latitude}, lon={longitude}")
        
        try:
            weather = await self.get_current_weather(latitude, longitude)
            
            # Calculate transport vectors
            wind_direction_name = self._get_wind_direction_name(weather.wind_direction)
            transport_assessment = self._assess_pollution_transport(
                weather.wind_speed, weather.wind_direction, 
                weather.pressure, weather.temperature
            )
            
            # Mixing height estimation (simplified)
            if weather.temperature > 25 and weather.wind_speed < 3:
                mixing_height = "low"  # Poor vertical mixing
                mixing_height_m = 300
            elif weather.temperature < 10 or weather.wind_speed > 8:
                mixing_height = "high"  # Good vertical mixing
                mixing_height_m = 1500
            else:
                mixing_height = "moderate"
                mixing_height_m = 800
            
            # Boundary layer stability
            if weather.pressure > 1020 and weather.wind_speed < 2:
                stability = "stable"  # Temperature inversion likely
            elif weather.wind_speed > 10:
                stability = "unstable"  # Good mixing
            else:
                stability = "neutral"
            
            analysis = {
                "current_conditions": {
                    "wind_speed_ms": weather.wind_speed,
                    "wind_direction_deg": weather.wind_direction,
                    "wind_direction_name": wind_direction_name,
                    "temperature_c": weather.temperature,
                    "pressure_hpa": weather.pressure,
                    "humidity_percent": weather.humidity
                },
                "transport_analysis": {
                    "dispersion_category": transport_assessment,
                    "mixing_height": mixing_height,
                    "mixing_height_meters": mixing_height_m,
                    "boundary_layer_stability": stability,
                    "pollution_concentration_factor": weather.air_quality_index_modifier,
                    "dispersion_effectiveness": weather.pollution_dispersion_factor
                },
                "impact_assessment": {
                    "ventilation_index": weather.wind_speed * mixing_height_m / 1000,
                    "pollution_accumulation_risk": "high" if weather.air_quality_index_modifier > 1.2 else "moderate" if weather.air_quality_index_modifier > 1.0 else "low",
                    "recommended_activity_level": "limited" if weather.air_quality_index_modifier > 1.2 else "moderate" if weather.air_quality_index_modifier > 1.0 else "normal"
                },
                "forecast_indicators": {
                    "pressure_trend": "rising" if weather.pressure > 1015 else "falling",
                    "expected_dispersion_change": "improving" if weather.wind_speed > 5 else "deteriorating",
                    "pollution_washout_potential": "high" if weather.precipitation > 0.5 else "low"
                }
            }
            
            logger.info(f"Transport analysis completed: {transport_assessment}, "
                       f"AQI modifier: {weather.air_quality_index_modifier:.2f}")
            
            return analysis
            
        except Exception as e:
            logger.error(f"Error in pollution transport analysis: {str(e)}")
            return {
                "error": "Transport analysis unavailable",
                "message": str(e)
            }


# Singleton pattern for weather service
_weather_service: Optional[WeatherService] = None

async def get_weather_service() -> WeatherService:
    """Get or create weather service instance"""
    global _weather_service
    if _weather_service is None:
        _weather_service = WeatherService()
    return _weather_service

async def close_weather_service():
    """Close weather service and cleanup resources"""
    global _weather_service
    if _weather_service:
        await _weather_service.close()
        _weather_service = None