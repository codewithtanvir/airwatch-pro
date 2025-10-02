"""
API v1 Main Router
Central router that includes all endpoint modules
"""

from fastapi import APIRouter

from app.api.v1.endpoints import air_quality, health, locations, services, database, satellite, weather, enhanced_air_quality, forecasting, health_alerts

api_router = APIRouter()

# Include all endpoint routers
api_router.include_router(health.router, prefix="/health", tags=["health"])
api_router.include_router(air_quality.router, prefix="/air-quality", tags=["air-quality"])
api_router.include_router(enhanced_air_quality.router, prefix="/enhanced-air-quality", tags=["enhanced-air-quality"])
api_router.include_router(forecasting.router, prefix="/forecasting", tags=["forecasting"])
api_router.include_router(health_alerts.router, prefix="/health-alerts", tags=["health-alerts"])
api_router.include_router(satellite.router, prefix="/satellite", tags=["satellite"])
api_router.include_router(weather.router, prefix="/weather", tags=["weather"])
api_router.include_router(locations.router, prefix="/locations", tags=["locations"])
api_router.include_router(services.router, prefix="/services", tags=["services"])
api_router.include_router(database.router, prefix="/database", tags=["database"])

# Add cache endpoint at root level for compatibility
api_router.include_router(services.router, prefix="", tags=["cache"])