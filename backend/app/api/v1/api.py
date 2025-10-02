"""
API v1 Main Router
Central router that includes all endpoint modules
"""

from fastapi import APIRouter

from app.api.v1.endpoints import air_quality, health, locations, services, database

api_router = APIRouter()

# Include all endpoint routers
api_router.include_router(health.router, prefix="/health", tags=["health"])
api_router.include_router(air_quality.router, prefix="/air-quality", tags=["air-quality"])
api_router.include_router(locations.router, prefix="/locations", tags=["locations"])
api_router.include_router(services.router, prefix="/services", tags=["services"])
api_router.include_router(database.router, prefix="/database", tags=["database"])

# Add cache endpoint at root level for compatibility
api_router.include_router(services.router, prefix="", tags=["cache"])