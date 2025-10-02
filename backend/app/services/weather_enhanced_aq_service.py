"""
Enhanced Air Quality Service - Weather Integration
Integrates air quality data with weather conditions for better analysis
"""

from typing import Dict, List, Any, Optional
from datetime import datetime
import asyncio

from app.services.openaq_service import OpenAQService
from app.services.weather_service import get_weather_service
from app.core.logging import get_logger

logger = get_logger(__name__)


class WeatherEnhancedAirQualityService:
    """Enhanced air quality service with weather integration"""
    
    def __init__(self):
        self.openaq_service = OpenAQService()
        
    async def get_weather_enhanced_air_quality(
        self, 
        latitude: float, 
        longitude: float, 
        radius_km: int = 25
    ) -> Dict[str, Any]:
        """Get air quality data enhanced with weather correlation"""
        
        logger.info(f"Getting weather-enhanced AQ data for lat={latitude}, lon={longitude}")
        
        try:
            # Get ground station data and weather data concurrently
            ground_task = self._get_ground_stations(latitude, longitude, radius_km)
            weather_task = self._get_weather_analysis(latitude, longitude)
            
            ground_result, weather_result = await asyncio.gather(
                ground_task, weather_task, return_exceptions=True
            )
            
            # Process results with proper type handling
            ground_data: Optional[Dict[str, Any]] = ground_result if not isinstance(ground_result, Exception) else None  # type: ignore
            weather_data: Optional[Dict[str, Any]] = weather_result if not isinstance(weather_result, Exception) else None  # type: ignore
            
            # Create enhanced analysis
            enhanced_analysis = self._create_enhanced_analysis(ground_data, weather_data)
            
            return {
                "success": True,
                "location": {"latitude": latitude, "longitude": longitude},
                "timestamp": datetime.utcnow().isoformat(),
                "ground_stations": ground_data,
                "weather_analysis": weather_data,
                "enhanced_analysis": enhanced_analysis,
                "hackathon_features": {
                    "weather_correlation": True,
                    "pollution_dispersion_modeling": True,
                    "enhanced_forecasting": True
                }
            }
            
        except Exception as e:
            logger.error(f"Error in weather-enhanced air quality analysis: {str(e)}")
            return {
                "success": False,
                "error": str(e),
                "location": {"latitude": latitude, "longitude": longitude},
                "timestamp": datetime.utcnow().isoformat()
            }
    
    async def _get_ground_stations(self, latitude: float, longitude: float, radius_km: int) -> Optional[Dict[str, Any]]:
        """Get ground station data"""
        try:
            openaq_data = await self.openaq_service.get_current_data(latitude, longitude, radius_km)
            
            if openaq_data.get("data", {}).get("results"):
                stations = []
                total_aqi = 0
                station_count = 0
                
                for result in openaq_data["data"]["results"]:
                    # Calculate estimated AQI
                    measurements = result.get("measurements", [])
                    estimated_aqi = self._estimate_aqi(measurements)
                    
                    station = {
                        "location": result.get("location", "Unknown"),
                        "coordinates": result.get("coordinates", {}),
                        "measurements": measurements,
                        "estimated_aqi": estimated_aqi,
                        "last_updated": result.get("lastUpdated"),
                        "data_source": "OpenAQ"
                    }
                    stations.append(station)
                    
                    if estimated_aqi:
                        total_aqi += estimated_aqi
                        station_count += 1
                
                return {
                    "stations": stations,
                    "station_count": len(stations),
                    "average_aqi": total_aqi / station_count if station_count > 0 else None,
                    "data_quality": "good" if station_count > 2 else "limited"
                }
            
            return None
            
        except Exception as e:
            logger.error(f"Error getting ground station data: {str(e)}")
            return None
    
    async def _get_weather_analysis(self, latitude: float, longitude: float) -> Optional[Dict[str, Any]]:
        """Get weather analysis with air quality correlation"""
        try:
            weather_service = await get_weather_service()
            
            # Get current weather and pollution transport analysis
            current_weather = await weather_service.get_current_weather(latitude, longitude)
            transport_analysis = await weather_service.get_pollution_transport_analysis(latitude, longitude)
            
            return {
                "current_conditions": {
                    "temperature": current_weather.temperature,
                    "humidity": current_weather.humidity,
                    "wind_speed": current_weather.wind_speed,
                    "wind_direction": current_weather.wind_direction,
                    "pressure": current_weather.pressure,
                    "precipitation": current_weather.precipitation,
                    "visibility": current_weather.visibility
                },
                "air_quality_impact": {
                    "concentration_modifier": current_weather.air_quality_index_modifier,
                    "dispersion_factor": current_weather.pollution_dispersion_factor,
                    "impact_description": self._get_weather_impact_description(current_weather.air_quality_index_modifier)
                },
                "transport_analysis": transport_analysis.get("transport_analysis", {}),
                "pollution_transport": transport_analysis.get("impact_assessment", {})
            }
            
        except Exception as e:
            logger.error(f"Error getting weather analysis: {str(e)}")
            return None
    
    def _create_enhanced_analysis(self, ground_data: Optional[Dict[str, Any]], weather_data: Optional[Dict[str, Any]]) -> Dict[str, Any]:
        """Create enhanced analysis combining ground and weather data"""
        
        analysis = {
            "data_integration": {
                "ground_stations_available": ground_data is not None,
                "weather_data_available": weather_data is not None
            },
            "enhanced_aqi": {},
            "recommendations": {},
            "confidence": {}
        }
        
        # Base AQI from ground stations
        base_aqi = None
        if ground_data and ground_data.get("average_aqi"):
            base_aqi = ground_data["average_aqi"]
            analysis["enhanced_aqi"]["base_aqi"] = base_aqi
            analysis["enhanced_aqi"]["aqi_level"] = self._get_aqi_level(base_aqi)
        
        # Weather-adjusted AQI
        if weather_data and base_aqi:
            weather_modifier = weather_data["air_quality_impact"]["concentration_modifier"]
            adjusted_aqi = base_aqi * weather_modifier
            
            analysis["enhanced_aqi"]["weather_adjusted_aqi"] = adjusted_aqi
            analysis["enhanced_aqi"]["weather_modifier"] = weather_modifier
            analysis["enhanced_aqi"]["adjusted_aqi_level"] = self._get_aqi_level(adjusted_aqi)
            analysis["enhanced_aqi"]["weather_impact"] = weather_data["air_quality_impact"]["impact_description"]
            
            # Recommendations based on weather-adjusted AQI
            analysis["recommendations"] = self._get_enhanced_recommendations(adjusted_aqi, weather_data)
        elif base_aqi:
            analysis["recommendations"] = self._get_basic_recommendations(base_aqi)
        
        # Confidence assessment
        confidence_score = 0.3  # Base confidence
        if ground_data:
            station_count = ground_data.get("station_count", 0)
            confidence_score += 0.4 if station_count > 3 else 0.2 if station_count > 1 else 0.1
        if weather_data:
            confidence_score += 0.3
        
        analysis["confidence"]["overall_score"] = confidence_score
        analysis["confidence"]["level"] = "high" if confidence_score > 0.7 else "moderate" if confidence_score > 0.4 else "low"
        
        return analysis
    
    def _estimate_aqi(self, measurements: List[Dict[str, Any]]) -> Optional[float]:
        """Estimate AQI from pollutant measurements"""
        try:
            aqi_values = []
            
            for measurement in measurements:
                parameter = measurement.get("parameter", "").lower()
                value = measurement.get("value", 0)
                
                if parameter == "pm25" and value > 0:
                    # Simplified PM2.5 AQI calculation
                    if value <= 12:
                        aqi = value * 50 / 12
                    elif value <= 35.4:
                        aqi = 50 + (value - 12) * 50 / 23.4
                    elif value <= 55.4:
                        aqi = 100 + (value - 35.4) * 50 / 20
                    else:
                        aqi = min(500, 150 + (value - 55.4) * 50 / 100)
                    aqi_values.append(aqi)
                
                elif parameter == "pm10" and value > 0:
                    # Simplified PM10 AQI calculation
                    if value <= 54:
                        aqi = value * 50 / 54
                    elif value <= 154:
                        aqi = 50 + (value - 54) * 50 / 100
                    else:
                        aqi = min(500, 100 + (value - 154) * 50 / 100)
                    aqi_values.append(aqi)
            
            return max(aqi_values) if aqi_values else None
            
        except Exception:
            return None
    
    def _get_aqi_level(self, aqi: float) -> str:
        """Get AQI level description"""
        if aqi <= 50: return "Good"
        elif aqi <= 100: return "Moderate"
        elif aqi <= 150: return "Unhealthy for Sensitive Groups"
        elif aqi <= 200: return "Unhealthy"
        elif aqi <= 300: return "Very Unhealthy"
        else: return "Hazardous"
    
    def _get_weather_impact_description(self, modifier: float) -> str:
        """Get weather impact description"""
        if modifier > 1.3:
            return "Weather significantly worsening air quality"
        elif modifier > 1.1:
            return "Weather moderately worsening air quality"
        elif modifier < 0.8:
            return "Weather significantly improving air quality"
        elif modifier < 0.95:
            return "Weather moderately improving air quality"
        else:
            return "Weather having neutral impact on air quality"
    
    def _get_enhanced_recommendations(self, aqi: float, weather_data: Dict[str, Any]) -> Dict[str, str]:
        """Get enhanced recommendations based on AQI and weather"""
        recommendations = {}
        
        # Base health advice
        if aqi <= 50:
            recommendations["health"] = "Air quality is good for all outdoor activities"
        elif aqi <= 100:
            recommendations["health"] = "Air quality is acceptable for most people"
        elif aqi <= 150:
            recommendations["health"] = "Sensitive groups should limit prolonged outdoor exertion"
        elif aqi <= 200:
            recommendations["health"] = "Everyone should limit prolonged outdoor exertion"
        else:
            recommendations["health"] = "Everyone should avoid outdoor exertion"
        
        # Weather-enhanced activity advice
        weather_modifier = weather_data["air_quality_impact"]["concentration_modifier"]
        wind_speed = weather_data["current_conditions"]["wind_speed"]
        
        if weather_modifier > 1.2:
            recommendations["activities"] = "Weather conditions are trapping pollutants - minimize outdoor time"
        elif wind_speed > 10:
            recommendations["activities"] = "Good wind conditions for outdoor activities"
        elif weather_data["current_conditions"]["precipitation"] > 0:
            recommendations["activities"] = "Rainfall is improving air quality - good for activities after rain"
        else:
            recommendations["activities"] = "Monitor conditions before extended outdoor activities"
        
        # Timing recommendations
        if weather_modifier > 1.1:
            recommendations["timing"] = "Air quality may improve later as weather conditions change"
        else:
            recommendations["timing"] = "Current conditions are relatively stable"
        
        return recommendations
    
    def _get_basic_recommendations(self, aqi: float) -> Dict[str, str]:
        """Get basic recommendations based on AQI only"""
        if aqi <= 50:
            return {"health": "Air quality is good for all activities"}
        elif aqi <= 100:
            return {"health": "Air quality is acceptable for most people"}
        elif aqi <= 150:
            return {"health": "Sensitive groups should limit outdoor activities"}
        else:
            return {"health": "Everyone should limit outdoor activities"}


# Singleton pattern
_weather_enhanced_service: Optional[WeatherEnhancedAirQualityService] = None

async def get_weather_enhanced_service() -> WeatherEnhancedAirQualityService:
    """Get or create weather-enhanced air quality service instance"""
    global _weather_enhanced_service
    if _weather_enhanced_service is None:
        _weather_enhanced_service = WeatherEnhancedAirQualityService()
    return _weather_enhanced_service