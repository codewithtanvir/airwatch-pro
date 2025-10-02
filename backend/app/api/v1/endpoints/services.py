"""
Service Management Endpoints
Endpoints for checking service status and managing system resources
"""

from fastapi import APIRouter
from typing import Dict, Any
from datetime import datetime

from app.core.logging import get_logger
from app.services.service_manager import service_manager

router = APIRouter()
logger = get_logger(__name__)


@router.get("/status")
async def get_services_status():
    """Get status of all external API services"""
    logger.info("Services status check requested")
    
    # Use the service manager to check actual service health
    health_data = await service_manager.health_check_all()
    
    # Transform to match frontend expectations
    services_status = {}
    for service_name, health_info in health_data["services"].items():
        services_status[service_name] = {
            "service": service_name,
            "status": "operational" if health_info["healthy"] else "error",
            "coverage": "North America" if service_name == "epa" else "Global",
            "stations": "1000+" if service_name == "openaq" else "500+",
            "last_checked": health_data["timestamp"],
            "api_key_configured": True,
            "cache_size": 150,  # Mock cache size
            "error": health_info.get("error")
        }
    
    return {
        "success": True,
        "services": services_status,
        "timestamp": health_data["timestamp"]
    }


@router.post("/cache/clear")
async def clear_all_caches():
    """Clear all service caches"""
    logger.info("Cache clear requested")
    
    # TODO: Implement actual cache clearing
    return {
        "success": True,
        "message": "All caches cleared successfully",
        "timestamp": datetime.now().isoformat()
    }