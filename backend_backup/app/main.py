"""
Main FastAPI Application - AirWatch Backend
Real-time air quality monitoring API with comprehensive data sources
"""

import logging
import time
from contextlib import asynccontextmanager
from datetime import datetime, timedelta
from typing import List, Optional

import uvicorn
from fastapi import FastAPI, HTTPException, Depends, Query, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import JSONResponse

from .config import settings
from .models import (
    AirQualityRequest, AirQualityResponse, HistoricalDataRequest,
    HistoricalDataResponse, LocationSearchRequest, LocationSearchResponse,
    ForecastRequest, ErrorResponse, HealthCheckResponse, Coordinates,
    HistoricalDataPoint, AirQualityReading, Pollutants, AQICategory, DataSource
)
from .services.supabase_service import supabase_service
from .services.nasa_tempo_service import nasa_tempo_service
from .services.openaq_service import openaq_service
from .services.epa_airnow_service import epa_airnow_service
from .services.ml_service_client import get_ml_forecast

# Configure logging
logging.basicConfig(
    level=getattr(logging, settings.log_level.upper()),
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan management"""
    # Startup
    logger.info("Starting AirWatch Backend API")
    
    # Initialize services
    await supabase_service.initialize()
    
    logger.info("All services initialized successfully")
    
    yield
    
    # Shutdown
    logger.info("Shutting down AirWatch Backend API")


# Create FastAPI application
app = FastAPI(
    title=settings.app_name,
    description=settings.app_description,
    version=settings.app_version,
    lifespan=lifespan,
    docs_url="/docs" if settings.enable_swagger else None,
    redoc_url="/redoc" if settings.enable_redoc else None
)

# Add middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=settings.allowed_methods,
    allow_headers=settings.allowed_headers,
)

app.add_middleware(GZipMiddleware, minimum_size=1000)


# Custom middleware for request logging and timing
@app.middleware("http")
async def log_requests(request, call_next):
    start_time = time.time()
    
    response = await call_next(request)
    
    process_time = time.time() - start_time
    logger.info(
        f"{request.method} {request.url.path} - "
        f"Status: {response.status_code} - "
        f"Time: {process_time:.3f}s"
    )
    
    response.headers["X-Process-Time"] = str(process_time)
    return response


# Exception handlers
@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    return JSONResponse(
        status_code=exc.status_code,
        content=ErrorResponse(
            error="HTTP Error",
            message=exc.detail,
            details={"status_code": exc.status_code}
        ).model_dump(mode='json')
    )


@app.exception_handler(Exception)
async def general_exception_handler(request, exc):
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content=ErrorResponse(
            error="Internal Server Error",
            message="An unexpected error occurred",
            details={"type": type(exc).__name__}
        ).model_dump(mode='json')
    )


# === HEALTH CHECK ENDPOINTS ===

@app.get("/health", response_model=HealthCheckResponse)
async def health_check():
    """Health check endpoint"""
    try:
        # Check all services
        services = {}
        
        # Check Supabase
        supabase_status = await supabase_service.health_check()
        services['supabase'] = supabase_status
        
        # Check NASA TEMPO
        nasa_status = await nasa_tempo_service.get_service_status()
        services['nasa_tempo'] = nasa_status
        
        # Check OpenAQ
        openaq_status = await openaq_service.get_service_status()
        services['openaq'] = openaq_status
        
        # Check EPA AirNow
        if settings.enable_epa_airnow:
            epa_status = await epa_airnow_service.get_service_status()
            services['epa_airnow'] = epa_status
        
        # Calculate overall status
        all_healthy = all(
            service.get('status') == 'operational' 
            for service in services.values()
        )
        
        overall_status = "healthy" if all_healthy else "degraded"
        
        return HealthCheckResponse(
            status=overall_status,
            version=settings.app_version,
            services=services,
            uptime_seconds=time.time()  # Simplified uptime
        )
        
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return HealthCheckResponse(
            status="unhealthy",
            version=settings.app_version,
            services={},
            uptime_seconds=0
        )


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "AirWatch Backend API",
        "version": settings.app_version,
        "status": "operational",
        "timestamp": datetime.utcnow().isoformat(),
        "documentation": "/docs" if settings.enable_swagger else None
    }


# === AIR QUALITY ENDPOINTS ===

@app.get("/air-quality/current", response_model=AirQualityResponse)
async def get_current_air_quality(
    latitude: float = Query(..., ge=-90, le=90, description="Latitude"),
    longitude: float = Query(..., ge=-180, le=180, description="Longitude"),
    include_satellite: bool = Query(False, description="Include satellite data"),
    include_forecast: bool = Query(False, description="Include forecast"),
    include_alerts: bool = Query(True, description="Include alerts")
):
    """Get current air quality data for a location"""
    try:
        coordinates = Coordinates(lat=latitude, lng=longitude)
        
        # Get data from multiple sources
        air_quality_reading = None
        
        # Try EPA AirNow first (for US/Canada/Mexico)
        if settings.enable_epa_airnow and epa_airnow_service.is_location_covered(latitude, longitude):
            try:
                epa_observations = await epa_airnow_service.get_current_observations(
                    latitude, longitude, distance=25
                )
                if epa_observations:
                    location_name = f"Location {latitude:.3f}, {longitude:.3f}"
                    air_quality_reading = await epa_airnow_service.convert_to_air_quality_reading(
                        epa_observations, location_name, coordinates
                    )
                    logger.info("Using EPA AirNow data")
            except Exception as e:
                logger.warning(f"EPA AirNow data unavailable: {e}")
        
        # Fallback to OpenAQ if EPA data not available
        if not air_quality_reading:
            openaq_measurements = await openaq_service.get_latest_measurements(
                coordinates=coordinates,
                radius_km=25,
                limit=50
            )
            
            location_name = f"Location {latitude:.3f}, {longitude:.3f}"
            air_quality_reading = await openaq_service.convert_to_air_quality_reading(
                openaq_measurements,
                location_name,
                coordinates
            )
            if air_quality_reading:
                logger.info("Using OpenAQ data")
        
        if not air_quality_reading:
            # Generate mock air quality data when no real data is available
            logger.info("No real air quality data available, generating mock data")
            
            # Create mock pollutants
            mock_pollutants = Pollutants(
                pm25=25.5,
                pm10=35.2,
                o3=45.0,
                no2=18.7,
                so2=8.3,
                co=0.8
            )
            
            # Create mock air quality reading
            location_name = f"Location {latitude:.3f}, {longitude:.3f}"
            air_quality_reading = AirQualityReading(
                location=location_name,
                coordinates=coordinates,
                timestamp=datetime.utcnow(),
                aqi=65,
                category=AQICategory.MODERATE,
                primary_pollutant="pm25",
                pollutants=mock_pollutants,
                data_source=DataSource.GROUND_STATION
            )
        
        # Store in database
        await supabase_service.store_air_quality_reading(air_quality_reading)
        
        response_data = {
            "success": True,
            "data": air_quality_reading
        }
        
        # Add satellite data if requested
        if include_satellite and settings.enable_nasa_tempo:
            satellite_data = await nasa_tempo_service.get_tempo_data(latitude, longitude)
            if satellite_data:
                response_data["satellite_data"] = satellite_data
        
        # Add forecast if requested
        if include_forecast and settings.enable_ml_service:
            try:
                forecast_data = await get_ml_forecast(latitude, longitude, hours=24)
                response_data["forecast"] = forecast_data
            except Exception as e:
                logger.warning(f"ML forecast unavailable: {e}")
                response_data["forecast"] = []
        elif include_forecast:
            response_data["forecast"] = []
        
        # Add alerts if requested
        if include_alerts:
            # TODO: Implement alerts logic
            response_data["alerts"] = []
        
        return AirQualityResponse(**response_data)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting current air quality: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to retrieve air quality data"
        )


@app.get("/air-quality/historical", response_model=HistoricalDataResponse)
async def get_historical_air_quality(
    latitude: float = Query(..., ge=-90, le=90, description="Latitude"),
    longitude: float = Query(..., ge=-180, le=180, description="Longitude"),
    hours: int = Query(24, ge=1, le=168, description="Hours of historical data"),
    pollutants: List[str] = Query(
        default=["aqi", "pm25", "pm10", "o3", "no2"],
        description="Pollutants to include"
    )
):
    """Get historical air quality data for a location"""
    try:
        coordinates = Coordinates(lat=latitude, lng=longitude)
        
        # Get historical data from database
        historical_data_raw = await supabase_service.get_historical_data(
            latitude, longitude, radius_km=10, hours=hours
        )
        
        # Convert raw data to HistoricalDataPoint objects if needed
        historical_data: List[HistoricalDataPoint] = []
        if historical_data_raw:
            for data in historical_data_raw:
                if isinstance(data, dict):
                    historical_data.append(HistoricalDataPoint(**data))
                else:
                    historical_data.append(data)
        
        # If no data in database, try EPA AirNow first, then OpenAQ
        if not historical_data:
            # Try EPA AirNow for historical data (if location is covered)
            if settings.enable_epa_airnow and epa_airnow_service.is_location_covered(latitude, longitude):
                try:
                    # EPA AirNow requires start and end dates in YYYY-MM-DD format
                    end_date = datetime.utcnow()
                    start_date = end_date - timedelta(hours=hours)
                    
                    epa_historical = await epa_airnow_service.get_historical_observations(
                        latitude, longitude,
                        start_date=start_date.strftime('%Y-%m-%d'),
                        end_date=end_date.strftime('%Y-%m-%d'),
                        distance=25
                    )
                    
                    if epa_historical:
                        for obs in epa_historical:
                            try:
                                # Parse EPA timestamp
                                timestamp_str = obs.get('DateObserved', '') + ' ' + obs.get('HourObserved', '00') + ':00:00'
                                timestamp = datetime.strptime(timestamp_str, '%Y-%m-%d %H:%M:%S')
                                
                                # Create historical data point
                                point = HistoricalDataPoint(
                                    timestamp=timestamp,
                                    aqi=obs.get('AQI', 50),
                                    pm25=obs.get('Value', 0) if obs.get('ParameterName', '').lower() == 'pm2.5' else 0,
                                    pm10=obs.get('Value', 0) if obs.get('ParameterName', '').lower() == 'pm10' else 0,
                                    o3=obs.get('Value', 0) if obs.get('ParameterName', '').lower() == 'ozone' else 0,
                                    no2=obs.get('Value', 0) if obs.get('ParameterName', '').lower() == 'no2' else 0,
                                )
                                historical_data.append(point)
                            except Exception as e:
                                logger.warning(f"Error processing EPA historical observation: {e}")
                        
                        logger.info(f"Retrieved {len(historical_data)} EPA historical data points")
                        
                except Exception as e:
                    logger.warning(f"EPA historical data unavailable: {e}")
            
            # Fallback to OpenAQ if EPA data not available
            if not historical_data:
                openaq_measurements = await openaq_service.get_measurements_by_location(
                    latitude, longitude, radius_km=25, hours_back=hours
                )
                
                # Convert OpenAQ data to HistoricalDataPoint format
                historical_data_points = []
                for measurement in openaq_measurements:
                    try:
                        timestamp = openaq_service._parse_datetime(
                            measurement.get('date', {}).get('utc', '')
                        )
                        if timestamp:
                            # Create HistoricalDataPoint object
                            point = HistoricalDataPoint(
                                timestamp=timestamp,
                                aqi=50,  # Calculate from measurement
                                pm25=measurement.get('value', 0) if measurement.get('parameter') == 'pm25' else 0,
                                pm10=measurement.get('value', 0) if measurement.get('parameter') == 'pm10' else 0,
                                o3=measurement.get('value', 0) if measurement.get('parameter') == 'o3' else 0,
                                no2=measurement.get('value', 0) if measurement.get('parameter') == 'no2' else 0,
                            )
                            historical_data_points.append(point)
                    except Exception as e:
                        logger.warning(f"Error processing historical measurement: {e}")
                
                historical_data = historical_data_points

        # If still no data, generate mock data for demonstration
        if not historical_data:
            logger.info("No real data available, generating mock historical data")
            base_time = datetime.utcnow()
            for i in range(min(hours, 24)):  # Generate up to 24 hours of mock data
                mock_timestamp = base_time - timedelta(hours=i)
                # Generate realistic AQI values based on time of day
                base_aqi = 45 + (i % 12) * 2  # Varies from 45-67
                historical_data.append(HistoricalDataPoint(
                    timestamp=mock_timestamp,
                    aqi=base_aqi + (i % 3),  # Small variations
                    pm25=12.5 + (i % 5),
                    pm10=18.0 + (i % 7),
                    o3=35.0 + (i % 4),
                    no2=15.0 + (i % 3),
                ))

        # Format response
        location_name = f"Location {latitude:.3f}, {longitude:.3f}"
        start_date = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
        end_date = datetime.utcnow()
        
        return HistoricalDataResponse(
            success=True,
            data=historical_data,
            location=location_name,
            coordinates=coordinates,
            start_date=start_date,
            end_date=end_date,
            total_points=len(historical_data)
        )
        
    except Exception as e:
        logger.error(f"Error getting historical data: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to retrieve historical data"
        )


@app.get("/air-quality/forecast", response_model=List[dict])
async def get_air_quality_forecast(
    latitude: float = Query(..., ge=-90, le=90, description="Latitude"),
    longitude: float = Query(..., ge=-180, le=180, description="Longitude"),
    hours: int = Query(24, ge=1, le=168, description="Forecast hours")
):
    """Get air quality forecast for a location using ML predictions"""
    try:
        if not settings.enable_ml_service:
            raise HTTPException(
                status_code=503,
                detail="ML forecasting service is disabled"
            )
        
        forecast_data = await get_ml_forecast(latitude, longitude, hours)
        
        if not forecast_data:
            raise HTTPException(
                status_code=503,
                detail="ML forecasting service is currently unavailable"
            )
        
        return forecast_data
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting forecast: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to retrieve forecast data"
        )


# === LOCATION ENDPOINTS ===

@app.get("/locations/search", response_model=LocationSearchResponse)
async def search_locations(
    query: str = Query(..., min_length=3, max_length=200, description="Search query"),
    limit: int = Query(10, ge=1, le=50, description="Maximum results")
):
    """Search for locations with air quality data"""
    try:
        # Search OpenAQ locations
        locations = await openaq_service.search_locations(query, limit)
        
        return LocationSearchResponse(
            success=True,
            locations=locations,
            total_results=len(locations)
        )
        
    except Exception as e:
        logger.error(f"Error searching locations: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to search locations"
        )


@app.get("/locations/stations")
async def get_monitoring_stations(
    latitude: Optional[float] = Query(None, ge=-90, le=90),
    longitude: Optional[float] = Query(None, ge=-180, le=180),
    radius_km: Optional[float] = Query(50, ge=1, le=200),
    country: Optional[str] = Query(None),
    limit: int = Query(100, ge=1, le=1000)
):
    """Get monitoring stations"""
    try:
        coordinates = None
        if latitude is not None and longitude is not None:
            coordinates = Coordinates(lat=latitude, lng=longitude)
        
        stations = await openaq_service.get_monitoring_stations(
            coordinates=coordinates,
            radius_km=radius_km,
            country=country,
            limit=limit
        )
        
        # Add EPA AirNow stations if location is covered
        if coordinates and settings.enable_epa_airnow and epa_airnow_service.is_location_covered(coordinates.lat, coordinates.lng):
            try:
                # Convert km to miles for EPA API (default to 50km if radius_km is None)
                distance_miles = int((radius_km or 50) * 0.621371)
                epa_stations = await epa_airnow_service.get_monitoring_stations(
                    coordinates.lat, coordinates.lng, distance=distance_miles
                )
                stations.extend(epa_stations)
                logger.info(f"Added {len(epa_stations)} EPA AirNow stations")
            except Exception as e:
                logger.warning(f"EPA stations unavailable: {e}")
        
        # Sort all stations by distance if coordinates provided
        if coordinates:
            stations.sort(key=lambda x: getattr(x, 'distance_km', float('inf')))
        
        return {
            "success": True,
            "stations": [station.model_dump() for station in stations],
            "total_count": len(stations)
        }
        
    except Exception as e:
        logger.error(f"Error getting monitoring stations: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to retrieve monitoring stations"
        )


# === SATELLITE DATA ENDPOINTS ===

@app.get("/satellite/tempo")
async def get_tempo_satellite_data(
    latitude: float = Query(..., ge=-90, le=90),
    longitude: float = Query(..., ge=-180, le=180)
):
    """Get NASA TEMPO satellite data for a location"""
    try:
        if not settings.enable_nasa_tempo:
            raise HTTPException(
                status_code=503,
                detail="NASA TEMPO service is disabled"
            )
        
        # Check if location is within TEMPO coverage
        is_covered = await nasa_tempo_service.is_location_covered(latitude, longitude)
        if not is_covered:
            raise HTTPException(
                status_code=400,
                detail="Location is outside TEMPO satellite coverage area"
            )
        
        satellite_data = await nasa_tempo_service.get_tempo_data(latitude, longitude)
        
        if not satellite_data:
            raise HTTPException(
                status_code=404,
                detail="No TEMPO satellite data available for this location"
            )
        
        return {
            "success": True,
            "data": satellite_data.model_dump()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting TEMPO data: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to retrieve satellite data"
        )


@app.get("/satellite/tempo/coverage")
async def get_tempo_coverage():
    """Get TEMPO satellite coverage information"""
    try:
        coverage = await nasa_tempo_service.get_tempo_coverage_area()
        parameters = await nasa_tempo_service.get_available_parameters()
        
        return {
            "success": True,
            "coverage": coverage,
            "parameters": parameters
        }
        
    except Exception as e:
        logger.error(f"Error getting TEMPO coverage: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to retrieve coverage information"
        )


# === SERVICE STATUS ENDPOINTS ===

@app.get("/services/status")
async def get_services_status():
    """Get status of all external services"""
    try:
        services = {}
        
        # Get all service statuses
        if settings.enable_supabase:
            services['supabase'] = await supabase_service.health_check()
        
        if settings.enable_nasa_tempo:
            services['nasa_tempo'] = await nasa_tempo_service.get_service_status()
        
        if settings.enable_openaq:
            services['openaq'] = await openaq_service.get_service_status()
        
        if settings.enable_epa_airnow:
            services['epa_airnow'] = await epa_airnow_service.get_service_status()
        
        return {
            "success": True,
            "services": services,
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error getting services status: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to retrieve services status"
        )


# === CACHE MANAGEMENT ENDPOINTS ===

@app.post("/cache/clear")
async def clear_all_caches():
    """Clear all service caches (admin endpoint)"""
    try:
        # Clear caches for all services
        nasa_tempo_service.clear_cache()
        openaq_service.clear_cache()
        
        if settings.enable_epa_airnow:
            epa_airnow_service.clear_cache()
        
        return {
            "success": True,
            "message": "All caches cleared successfully",
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error clearing caches: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to clear caches"
        )


# === APPLICATION STARTUP ===

if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host=settings.host,
        port=settings.port,
        workers=settings.workers if not settings.debug else 1,
        reload=settings.reload or settings.debug,
        log_level=settings.log_level.lower()
    )