"""
Enhanced Air Quality Service
Integrates multiple data sources including weather for comprehensive analysis
"""

from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta
import asyncio
import logging

from app.services.openaq_service import OpenAQService
from app.services.weather_service import get_weather_service
from app.core.logging import get_logger

logger = get_logger(__name__)


class EnhancedAirQualityService:
    """
    Enhanced air quality service that integrates multiple data sources
    with weather correlation for hackathon demonstration
    """
    
    def __init__(self):
        self.openaq_service = OpenAQService()
        
    async def get_comprehensive_air_quality(
        self, 
        latitude: float, 
        longitude: float, 
        include_weather: bool = True,
        include_satellite: bool = True,
        radius_km: int = 25
    ) -> Dict[str, Any]:
        """
        Get comprehensive air quality data integrating multiple sources
        """
        logger.info(f"Getting comprehensive AQ data for lat={latitude}, lon={longitude}")
        
        try:
            # Start all data collection tasks concurrently
            tasks = []
            
            # Ground station data (OpenAQ)
            tasks.append(self._get_ground_station_data(latitude, longitude, radius_km))
            
            # Weather data
            if include_weather:
                tasks.append(self._get_weather_enhanced_data(latitude, longitude))
            
            # Satellite data  
            if include_satellite:
                tasks.append(self._get_satellite_data(latitude, longitude))
            
            # Execute all tasks concurrently
            results = await asyncio.gather(*tasks, return_exceptions=True)
            
            # Process results safely with proper type checking
            ground_data: Optional[Dict[str, Any]] = None
            weather_data: Optional[Dict[str, Any]] = None
            satellite_data: Optional[Dict[str, Any]] = None
            
            if len(results) > 0 and not isinstance(results[0], Exception):
                ground_data = results[0]  # type: ignore
            if len(results) > 1 and include_weather and not isinstance(results[1], Exception):
                weather_data = results[1]  # type: ignore
            if len(results) > 2 and include_satellite and not isinstance(results[2], Exception):
                satellite_data = results[2]  # type: ignore
            
            # Integrate and analyze all data sources
            integrated_analysis = await self._integrate_data_sources(
                ground_data, weather_data, satellite_data, latitude, longitude
            )
            
            return {
                "success": True,
                "location": {"latitude": latitude, "longitude": longitude},
                "data_sources": {
                    "ground_stations": ground_data is not None,
                    "weather_integration": weather_data is not None,
                    "satellite_data": satellite_data is not None
                },
                "integrated_analysis": integrated_analysis,
                "individual_sources": {
                    "ground_stations": ground_data,
                    "weather_correlation": weather_data,
                    "satellite_observations": satellite_data
                },
                "timestamp": datetime.utcnow().isoformat(),
                "hackathon_features": {
                    "multi_source_integration": True,
                    "weather_correlation": include_weather,
                    "satellite_validation": include_satellite,
                    "predictive_analysis": True
                }
            }
            
        except Exception as e:
            logger.error(f"Error in comprehensive air quality analysis: {str(e)}")
            return {
                "success": False,
                "error": str(e),
                "location": {"latitude": latitude, "longitude": longitude},
                "timestamp": datetime.utcnow().isoformat()
            }
    
    async def _get_ground_station_data(self, latitude: float, longitude: float, radius_km: int) -> Optional[Dict[str, Any]]:
        """Get ground station data from OpenAQ"""
        try:
            ground_data = await self.openaq_service.get_current_data(latitude, longitude, radius_km)
            
            if ground_data.get("data", {}).get("results"):
                # Process and standardize ground station data
                stations = []
                total_aqi = 0
                station_count = 0
                
                for result in ground_data["data"]["results"]:
                    station_info = {
                        "location": result.get("location", "Unknown"),
                        "coordinates": result.get("coordinates", {}),
                        "measurements": result.get("measurements", []),
                        "last_updated": result.get("lastUpdated"),
                        "data_source": "OpenAQ"
                    }
                    
                    # Calculate estimated AQI from available pollutants
                    aqi_estimate = self._estimate_aqi_from_measurements(result.get("measurements", []))
                    if aqi_estimate:
                        station_info["estimated_aqi"] = aqi_estimate
                        total_aqi += aqi_estimate
                        station_count += 1
                    
                    stations.append(station_info)
                
                return {
                    "stations": stations,
                    "summary": {
                        "total_stations": len(stations),
                        "average_aqi": total_aqi / station_count if station_count > 0 else None,
                        "data_quality": "good" if station_count > 2 else "limited"
                    }
                }
            
            return None
            
        except Exception as e:
            logger.error(f"Error getting ground station data: {str(e)}")
            return None
    
    async def _get_weather_enhanced_data(self, latitude: float, longitude: float) -> Optional[Dict[str, Any]]:
        """Get weather data with air quality correlation"""
        try:
            weather_service = await get_weather_service()
            
            # Get current weather and transport analysis
            current_weather = await weather_service.get_current_weather(latitude, longitude)
            transport_analysis = await weather_service.get_pollution_transport_analysis(latitude, longitude)
            
            return {
                "current_conditions": {
                    "temperature": current_weather.temperature,
                    "humidity": current_weather.humidity,
                    "wind_speed": current_weather.wind_speed,
                    "wind_direction": current_weather.wind_direction,
                    "pressure": current_weather.pressure,
                    "precipitation": current_weather.precipitation
                },
                "air_quality_impact": {
                    "concentration_modifier": current_weather.air_quality_index_modifier,
                    "dispersion_factor": current_weather.pollution_dispersion_factor,
                    "impact_assessment": (
                        "Weather worsening air quality" if current_weather.air_quality_index_modifier > 1.1
                        else "Weather improving air quality" if current_weather.air_quality_index_modifier < 0.9
                        else "Weather neutral for air quality"
                    )
                },
                "transport_analysis": transport_analysis.get("transport_analysis", {}),
                "forecast_indicators": transport_analysis.get("forecast_indicators", {})
            }
            
        except Exception as e:
            logger.error(f"Error getting weather data: {str(e)}")
            return None
    
    async def _get_satellite_data(self, latitude: float, longitude: float) -> Optional[Dict[str, Any]]:
        """Get satellite data from NASA TEMPO"""
        try:
            from app.services.nasa_tempo_service import get_tempo_service
            tempo_service = await get_tempo_service()
            satellite_data = await tempo_service.get_tempo_data(latitude, longitude)
            
            return {
                "source": "NASA TEMPO",
                "atmospheric_composition": {
                    "no2_column": satellite_data["parameters"]["no2_column"]["value"],
                    "o3_column": satellite_data["parameters"]["o3_column"]["value"],
                    "data_quality": satellite_data["data_quality"]["overall_quality"]
                },
                "estimated_surface_impact": {
                    "aqi_estimate": satellite_data.get("estimated_surface_aqi", None),
                    "confidence": satellite_data["data_quality"]["overall_quality"]
                }
            }
            
        except Exception as e:
            logger.error(f"Error getting satellite data: {str(e)}")
            return None
    
    async def _integrate_data_sources(
        self, 
        ground_data: Optional[Dict[str, Any]], 
        weather_data: Optional[Dict[str, Any]], 
        satellite_data: Optional[Dict[str, Any]], 
        latitude: float, 
        longitude: float
    ) -> Dict[str, Any]:
        """
        Integrate all data sources for comprehensive analysis
        """
        try:
            integration_result = {
                "data_availability": {
                    "ground_stations": ground_data is not None,
                    "weather_data": weather_data is not None,
                    "satellite_data": satellite_data is not None
                },
                "integrated_assessment": {},
                "confidence_levels": {},
                "recommendations": {}
            }
            
            # Base AQI from ground stations
            base_aqi = None
            if ground_data and ground_data.get("summary", {}).get("average_aqi"):
                base_aqi = ground_data["summary"]["average_aqi"]
                integration_result["integrated_assessment"]["base_aqi"] = base_aqi
                integration_result["confidence_levels"]["ground_data"] = "high" if ground_data["summary"]["total_stations"] > 3 else "moderate"
            
            # Weather-adjusted AQI
            weather_adjusted_aqi = base_aqi
            if weather_data and base_aqi:
                weather_modifier = weather_data["air_quality_impact"]["concentration_modifier"]
                weather_adjusted_aqi = base_aqi * weather_modifier
                integration_result["integrated_assessment"]["weather_adjusted_aqi"] = weather_adjusted_aqi
                integration_result["integrated_assessment"]["weather_impact"] = {
                    "modifier": weather_modifier,
                    "interpretation": weather_data["air_quality_impact"]["impact_assessment"]
                }
                integration_result["confidence_levels"]["weather_integration"] = "high"
            
            # Satellite validation
            if satellite_data:
                satellite_aqi = satellite_data.get("estimated_surface_impact", {}).get("aqi_estimate")
                if satellite_aqi:
                    integration_result["integrated_assessment"]["satellite_aqi"] = satellite_aqi
                    
                    # Compare satellite vs ground (if both available)
                    if weather_adjusted_aqi:
                        difference = abs(satellite_aqi - weather_adjusted_aqi)
                        agreement = "good" if difference < 20 else "moderate" if difference < 40 else "poor"
                        integration_result["integrated_assessment"]["satellite_ground_agreement"] = {
                            "agreement_level": agreement,
                            "difference": difference,
                            "validation_status": "validated" if agreement in ["good", "moderate"] else "inconsistent"
                        }
                
                integration_result["confidence_levels"]["satellite_data"] = satellite_data["atmospheric_composition"]["data_quality"]
            
            # Final integrated AQI
            if weather_adjusted_aqi:
                final_aqi = weather_adjusted_aqi
            elif base_aqi:
                final_aqi = base_aqi
            elif satellite_data and satellite_data.get("estimated_surface_impact", {}).get("aqi_estimate"):
                final_aqi = satellite_data["estimated_surface_impact"]["aqi_estimate"]
            else:
                final_aqi = None
            
            if final_aqi:
                integration_result["integrated_assessment"]["final_aqi"] = final_aqi
                integration_result["integrated_assessment"]["aqi_level"] = self._get_aqi_level(final_aqi)
                
                # Health recommendations
                integration_result["recommendations"]["health_advice"] = self._get_health_recommendations(final_aqi)
                
                # Activity recommendations based on weather and AQI
                if weather_data:
                    activity_modifier = weather_data["air_quality_impact"]["concentration_modifier"]
                    if activity_modifier > 1.2:
                        integration_result["recommendations"]["activities"] = "Limit outdoor activities, especially for sensitive groups"
                    elif activity_modifier < 0.9:
                        integration_result["recommendations"]["activities"] = "Good conditions for outdoor activities"
                    else:
                        integration_result["recommendations"]["activities"] = "Normal outdoor activities with air quality monitoring"
            
            # Overall confidence
            confidence_scores = []
            if ground_data: confidence_scores.append(0.8 if ground_data["summary"]["total_stations"] > 3 else 0.6)
            if weather_data: confidence_scores.append(0.9)
            if satellite_data: confidence_scores.append(0.7)
            
            overall_confidence = sum(confidence_scores) / len(confidence_scores) if confidence_scores else 0.3
            integration_result["confidence_levels"]["overall"] = (
                "high" if overall_confidence > 0.75 else "moderate" if overall_confidence > 0.5 else "low"
            )
            
            return integration_result
            
        except Exception as e:
            logger.error(f"Error integrating data sources: {str(e)}")
            return {"error": "Data integration failed", "message": str(e)}
    
    def _estimate_aqi_from_measurements(self, measurements: List[Dict[str, Any]]) -> Optional[float]:
        """Estimate AQI from available pollutant measurements"""
        try:
            # Simple AQI estimation based on available pollutants
            # This is a simplified calculation for demonstration
            aqi_values = []
            
            for measurement in measurements:
                parameter = measurement.get("parameter", "").lower()
                value = measurement.get("value", 0)
                
                if parameter == "pm25" and value > 0:
                    # PM2.5 AQI calculation (simplified)
                    if value <= 12: aqi = value * 50 / 12
                    elif value <= 35.4: aqi = 50 + (value - 12) * 50 / 23.4
                    elif value <= 55.4: aqi = 100 + (value - 35.4) * 50 / 20
                    else: aqi = min(500, 150 + (value - 55.4) * 50 / 100)
                    aqi_values.append(aqi)
                    
                elif parameter == "pm10" and value > 0:
                    # PM10 AQI calculation (simplified)
                    if value <= 54: aqi = value * 50 / 54
                    elif value <= 154: aqi = 50 + (value - 54) * 50 / 100
                    else: aqi = min(500, 100 + (value - 154) * 50 / 100)
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
    
    def _get_health_recommendations(self, aqi: float) -> str:
        """Get health recommendations based on AQI"""
        if aqi <= 50:
            return "Air quality is satisfactory for most people"
        elif aqi <= 100:
            return "Unusually sensitive people should consider limiting prolonged outdoor exertion"
        elif aqi <= 150:
            return "Sensitive groups should limit prolonged outdoor exertion"
        elif aqi <= 200:
            return "Everyone should limit prolonged outdoor exertion"
        elif aqi <= 300:
            return "Everyone should avoid prolonged outdoor exertion"
        else:
            return "Everyone should avoid any outdoor exertion"


# Singleton pattern
_enhanced_aq_service: Optional[EnhancedAirQualityService] = None

async def get_enhanced_air_quality_service() -> EnhancedAirQualityService:
    """Get or create enhanced air quality service instance"""
    global _enhanced_aq_service
    if _enhanced_aq_service is None:
        _enhanced_aq_service = EnhancedAirQualityService()
    return _enhanced_aq_service