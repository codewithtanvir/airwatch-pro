"""
Weather API Endpoints
Provides weather data for air quality analysis and forecasting
"""

from fastapi import APIRouter, Query, HTTPException
from typing import Dict, List, Any
from datetime import datetime

from app.core.logging import get_logger
from app.services.weather_service import get_weather_service

router = APIRouter()
logger = get_logger(__name__)


@router.get("/current")
async def get_current_weather(
    latitude: float = Query(..., description="Latitude"),
    longitude: float = Query(..., description="Longitude"),
    include_air_quality_analysis: bool = Query(True, description="Include air quality correlation analysis")
):
    """
    Get current weather data with air quality impact analysis
    Enhanced for hackathon - correlates weather with pollution dispersion
    """
    logger.info(f"Current weather requested for lat={latitude}, lon={longitude}")
    
    try:
        weather_service = await get_weather_service()
        weather_data = await weather_service.get_current_weather(latitude, longitude)
        
        response = {
            "success": True,
            "weather": {
                "temperature": weather_data.temperature,
                "humidity": weather_data.humidity,
                "pressure": weather_data.pressure,
                "wind_speed": weather_data.wind_speed,
                "wind_direction": weather_data.wind_direction,
                "wind_gust": weather_data.wind_gust,
                "visibility": weather_data.visibility,
                "uv_index": weather_data.uv_index,
                "precipitation": weather_data.precipitation,
                "cloud_cover": weather_data.cloud_cover,
                "timestamp": weather_data.timestamp
            },
            "units": {
                "temperature": "°C",
                "wind_speed": "m/s",
                "wind_direction": "degrees",
                "pressure": "hPa",
                "humidity": "%",
                "visibility": "km",
                "precipitation": "mm/h"
            }
        }
        
        if include_air_quality_analysis:
            response["air_quality_correlation"] = {
                "pollution_concentration_modifier": weather_data.air_quality_index_modifier,
                "dispersion_effectiveness": weather_data.pollution_dispersion_factor,
                "interpretation": {
                    "modifier_meaning": "Multiplier for base AQI values (>1.0 = worse, <1.0 = better)",
                    "dispersion_meaning": "Pollution dispersion capability (lower = better dispersion)",
                    "current_impact": (
                        "Poor air quality conditions - limited dispersion" if weather_data.air_quality_index_modifier > 1.2
                        else "Moderate air quality conditions" if weather_data.air_quality_index_modifier > 1.0
                        else "Good air quality conditions - enhanced dispersion"
                    )
                }
            }
        
        return response
        
    except Exception as e:
        logger.error(f"Error retrieving current weather: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to retrieve current weather data")


@router.get("/forecast")
async def get_weather_forecast(
    latitude: float = Query(..., description="Latitude"),
    longitude: float = Query(..., description="Longitude"),
    hours: int = Query(24, description="Forecast hours ahead (max 48)")
):
    """
    Get weather forecast for air quality prediction
    Includes meteorological conditions affecting pollution transport
    """
    logger.info(f"Weather forecast requested for lat={latitude}, lon={longitude}, hours={hours}")
    
    try:
        weather_service = await get_weather_service()
        forecast_data = await weather_service.get_weather_forecast(latitude, longitude, hours)
        
        if not forecast_data:
            raise HTTPException(status_code=503, detail="Weather forecast service temporarily unavailable")
        
        # Format forecast data for frontend consumption
        formatted_forecast = []
        for forecast in forecast_data:
            formatted_forecast.append({
                "datetime": forecast.datetime,
                "temperature": forecast.temperature,
                "humidity": forecast.humidity,
                "wind_speed": forecast.wind_speed,
                "wind_direction": forecast.wind_direction,
                "precipitation_chance": forecast.precipitation_chance,
                "cloud_cover": forecast.cloud_cover,
                "pressure_trend": forecast.pressure_trend,
                "air_quality_impact": forecast.air_quality_impact,
                "dispersion_conditions": forecast.dispersion_conditions
            })
        
        return {
            "success": True,
            "forecast": formatted_forecast,
            "forecast_summary": {
                "total_hours": len(formatted_forecast),
                "air_quality_trends": {
                    "improving_hours": len([f for f in forecast_data if f.air_quality_impact == "improving"]),
                    "stable_hours": len([f for f in forecast_data if f.air_quality_impact == "stable"]),
                    "worsening_hours": len([f for f in forecast_data if f.air_quality_impact == "worsening"])
                },
                "dispersion_outlook": {
                    "good_dispersion_hours": len([f for f in forecast_data if "good" in f.dispersion_conditions]),
                    "poor_dispersion_hours": len([f for f in forecast_data if "poor" in f.dispersion_conditions or "stagnant" in f.dispersion_conditions])
                }
            },
            "hackathon_features": {
                "weather_air_quality_integration": True,
                "pollution_transport_modeling": True,
                "meteorological_forecasting": True
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating weather forecast: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to generate weather forecast")


@router.get("/pollution-transport")
async def get_pollution_transport_analysis(
    latitude: float = Query(..., description="Latitude"),
    longitude: float = Query(..., description="Longitude")
):
    """
    Analyze how current weather conditions affect pollution transport and dispersion
    Key feature for hackathon - demonstrates advanced meteorological modeling
    """
    logger.info(f"Pollution transport analysis requested for lat={latitude}, lon={longitude}")
    
    try:
        weather_service = await get_weather_service()
        transport_analysis = await weather_service.get_pollution_transport_analysis(latitude, longitude)
        
        if "error" in transport_analysis:
            raise HTTPException(status_code=503, detail=transport_analysis["message"])
        
        return {
            "success": True,
            "transport_analysis": transport_analysis,
            "message": "Pollution transport analysis completed",
            "interpretation": {
                "dispersion_category": {
                    "rapid_dispersion": "Excellent conditions for pollution removal",
                    "good_dispersion": "Good conditions for pollution dispersal",
                    "moderate_dispersion": "Moderate pollution dispersal capability",
                    "limited_dispersion": "Limited pollution dispersal - increased concentrations",
                    "poor_dispersion_inversion": "Temperature inversion - very poor dispersion",
                    "stagnant_conditions": "Stagnant air - highest pollution accumulation risk"
                },
                "ventilation_index": "Higher values indicate better air circulation and pollution removal",
                "pollution_accumulation_risk": "Risk of pollutant buildup in the local atmosphere"
            },
            "hackathon_value": "Demonstrates advanced atmospheric science integration for air quality prediction"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in pollution transport analysis: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to analyze pollution transport conditions")


@router.get("/air-quality-correlation")
async def get_weather_air_quality_correlation(
    latitude: float = Query(..., description="Latitude"),
    longitude: float = Query(..., description="Longitude"),
    include_forecast: bool = Query(True, description="Include forecast correlation")
):
    """
    Get comprehensive weather-air quality correlation analysis
    Combines current conditions with forecast trends for enhanced prediction
    """
    logger.info(f"Weather-AQ correlation analysis requested for lat={latitude}, lon={longitude}")
    
    try:
        weather_service = await get_weather_service()
        
        # Get current weather and transport analysis
        current_weather = await weather_service.get_current_weather(latitude, longitude)
        transport_analysis = await weather_service.get_pollution_transport_analysis(latitude, longitude)
        
        correlation_data = {
            "current_correlation": {
                "aqi_concentration_modifier": current_weather.air_quality_index_modifier,
                "dispersion_factor": current_weather.pollution_dispersion_factor,
                "weather_impact_summary": (
                    "Weather conditions are significantly worsening air quality" if current_weather.air_quality_index_modifier > 1.3
                    else "Weather conditions are moderately worsening air quality" if current_weather.air_quality_index_modifier > 1.1
                    else "Weather conditions are neutral for air quality" if current_weather.air_quality_index_modifier > 0.9
                    else "Weather conditions are improving air quality"
                ),
                "primary_factors": []
            },
            "meteorological_drivers": {
                "wind_impact": "beneficial" if current_weather.wind_speed > 5 else "neutral" if current_weather.wind_speed > 2 else "detrimental",
                "pressure_impact": "inversion_risk" if current_weather.pressure > 1020 and current_weather.wind_speed < 3 else "neutral",
                "humidity_impact": "particle_growth" if current_weather.humidity > 80 else "neutral",
                "precipitation_impact": "washout_active" if current_weather.precipitation > 0.1 else "no_washout"
            }
        }
        
        # Add primary factors explanation
        if current_weather.wind_speed < 2:
            correlation_data["current_correlation"]["primary_factors"].append("Low wind speed limiting dispersion")
        if current_weather.pressure > 1020:
            correlation_data["current_correlation"]["primary_factors"].append("High pressure potentially causing temperature inversion")
        if current_weather.humidity > 80:
            correlation_data["current_correlation"]["primary_factors"].append("High humidity promoting particle growth")
        if current_weather.precipitation > 0.1:
            correlation_data["current_correlation"]["primary_factors"].append("Precipitation providing washout effect")
        
        response = {
            "success": True,
            "correlation_analysis": correlation_data,
            "transport_summary": transport_analysis.get("transport_analysis", {}),
            "recommendations": {
                "outdoor_activities": (
                    "Limit outdoor activities" if current_weather.air_quality_index_modifier > 1.2
                    else "Moderate outdoor activities" if current_weather.air_quality_index_modifier > 1.0
                    else "Normal outdoor activities recommended"
                ),
                "sensitive_groups": (
                    "Stay indoors" if current_weather.air_quality_index_modifier > 1.3
                    else "Limit outdoor exposure" if current_weather.air_quality_index_modifier > 1.1
                    else "Normal activities with air quality monitoring"
                )
            }
        }
        
        # Add forecast correlation if requested
        if include_forecast:
            forecast_data = await weather_service.get_weather_forecast(latitude, longitude, 24)
            if forecast_data:
                improving_hours = len([f for f in forecast_data if f.air_quality_impact == "improving"])
                worsening_hours = len([f for f in forecast_data if f.air_quality_impact == "worsening"])
                
                response["forecast_correlation"] = {
                    "24_hour_outlook": (
                        "Air quality conditions improving" if improving_hours > worsening_hours
                        else "Air quality conditions worsening" if worsening_hours > improving_hours
                        else "Air quality conditions stable"
                    ),
                    "improving_hours": improving_hours,
                    "worsening_hours": worsening_hours,
                    "stable_hours": len(forecast_data) - improving_hours - worsening_hours
                }
        
        return response
        
    except Exception as e:
        logger.error(f"Error in weather-air quality correlation analysis: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to analyze weather-air quality correlation")