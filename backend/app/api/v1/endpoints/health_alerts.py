"""
Health Alert API Endpoints
Personalized health risk notification endpoints
"""

import logging
from typing import Dict, List, Any, Optional
from fastapi import APIRouter, HTTPException, Query, BackgroundTasks
from pydantic import BaseModel, Field
from datetime import datetime

from app.services.health_alert_service import (
    get_health_alert_service,
    HealthProfile,
    HealthCondition,
    RiskLevel,
    AlertType,
    HealthAlert
)

logger = logging.getLogger(__name__)

router = APIRouter()


class HealthProfileRequest(BaseModel):
    """Request model for user health profile"""
    conditions: List[HealthCondition] = Field(..., description="List of health conditions")
    sensitivity_level: str = Field(default="normal", description="Sensitivity level: low, normal, high")
    age_group: str = Field(default="adult", description="Age group: child, adult, elderly")
    activity_level: str = Field(default="moderate", description="Activity level: sedentary, moderate, active")
    outdoor_exposure: str = Field(default="moderate", description="Outdoor exposure: minimal, moderate, high")


class AlertRequest(BaseModel):
    """Request model for generating health alerts"""
    latitude: float = Field(..., ge=-90, le=90, description="Latitude coordinate")
    longitude: float = Field(..., ge=-180, le=180, description="Longitude coordinate")
    health_profile: HealthProfileRequest
    hours_ahead: int = Field(default=24, ge=1, le=72, description="Hours to forecast ahead")


class AlertResponse(BaseModel):
    """Response model for health alerts"""
    success: bool
    alerts: Optional[List[Dict[str, Any]]] = None
    alert_count: int = 0
    highest_risk_level: Optional[str] = None
    error: Optional[str] = None
    timestamp: str
    metadata: Dict[str, Any] = Field(default_factory=dict)


@router.post("/generate")
async def generate_health_alerts(
    request: AlertRequest,
    background_tasks: BackgroundTasks
) -> AlertResponse:
    """
    Generate personalized health alerts based on user profile and air quality forecast
    
    This endpoint creates customized health risk notifications considering:
    - User's specific health conditions
    - Personal sensitivity and activity levels
    - Current and forecasted air quality conditions
    - Location-specific environmental factors
    """
    try:
        logger.info(f"Generating health alerts for ({request.latitude}, {request.longitude})")
        
        health_alert_service = await get_health_alert_service()
        
        # Convert request model to HealthProfile
        health_profile = HealthProfile(
            conditions=request.health_profile.conditions,
            sensitivity_level=request.health_profile.sensitivity_level,
            age_group=request.health_profile.age_group,
            activity_level=request.health_profile.activity_level,
            outdoor_exposure=request.health_profile.outdoor_exposure
        )
        
        # Generate personalized alerts
        alerts = await health_alert_service.generate_personalized_alerts(
            latitude=request.latitude,
            longitude=request.longitude,
            health_profile=health_profile,
            hours_ahead=request.hours_ahead
        )
        
        # Convert alerts to dict format for JSON response
        alert_dicts = []
        highest_risk = RiskLevel.LOW
        
        for alert in alerts:
            alert_dict = {
                "alert_id": alert.alert_id,
                "alert_type": alert.alert_type.value,
                "risk_level": alert.risk_level.value,
                "title": alert.title,
                "message": alert.message,
                "recommendations": alert.recommendations,
                "affected_pollutants": alert.affected_pollutants,
                "valid_until": alert.valid_until.isoformat(),
                "urgency_score": alert.urgency_score,
                "location": alert.location,
                "health_conditions": [c.value for c in alert.health_conditions]
            }
            alert_dicts.append(alert_dict)
            
            # Track highest risk level
            if alert.risk_level.value == "extreme":
                highest_risk = RiskLevel.EXTREME
            elif alert.risk_level.value == "very_high" and highest_risk != RiskLevel.EXTREME:
                highest_risk = RiskLevel.VERY_HIGH
            elif alert.risk_level.value == "high" and highest_risk not in [RiskLevel.EXTREME, RiskLevel.VERY_HIGH]:
                highest_risk = RiskLevel.HIGH
        
        return AlertResponse(
            success=True,
            alerts=alert_dicts,
            alert_count=len(alert_dicts),
            highest_risk_level=highest_risk.value if alert_dicts else None,
            timestamp=datetime.utcnow().isoformat(),
            metadata={
                "location": {"lat": request.latitude, "lon": request.longitude},
                "forecast_horizon_hours": request.hours_ahead,
                "health_conditions": [c.value for c in request.health_profile.conditions],
                "user_sensitivity": request.health_profile.sensitivity_level
            }
        )
        
    except Exception as e:
        logger.error(f"Error generating health alerts: {str(e)}", exc_info=True)
        return AlertResponse(
            success=False,
            error=f"Health alert generation error: {str(e)}",
            timestamp=datetime.utcnow().isoformat(),
            metadata={"error_type": "health_alert_generation_error"}
        )


@router.get("/quick-check")
async def quick_health_check(
    latitude: float = Query(..., ge=-90, le=90, description="Latitude coordinate"),
    longitude: float = Query(..., ge=-180, le=180, description="Longitude coordinate"),
    conditions: str = Query(..., description="Comma-separated health conditions"),
    sensitivity: str = Query(default="normal", description="Sensitivity level")
) -> Dict[str, Any]:
    """
    Quick health risk check for current conditions
    
    Simplified endpoint for immediate health risk assessment
    """
    try:
        logger.info(f"Quick health check for ({latitude}, {longitude})")
        
        # Parse health conditions
        condition_list = []
        for condition_str in conditions.split(","):
            condition_str = condition_str.strip().lower()
            try:
                condition = HealthCondition(condition_str)
                condition_list.append(condition)
            except ValueError:
                logger.warning(f"Unknown health condition: {condition_str}")
        
        if not condition_list:
            condition_list = [HealthCondition.HEALTHY]
        
        health_alert_service = await get_health_alert_service()
        
        # Create basic health profile
        health_profile = HealthProfile(
            conditions=condition_list,
            sensitivity_level=sensitivity,
            age_group="adult",
            activity_level="moderate",
            outdoor_exposure="moderate"
        )
        
        # Generate alerts for next 6 hours only
        alerts = await health_alert_service.generate_personalized_alerts(
            latitude=latitude,
            longitude=longitude,
            health_profile=health_profile,
            hours_ahead=6
        )
        
        # Extract immediate risk level
        immediate_alerts = [a for a in alerts if a.alert_type == AlertType.IMMEDIATE]
        immediate_risk = immediate_alerts[0].risk_level.value if immediate_alerts else "low"
        
        return {
            "success": True,
            "immediate_risk_level": immediate_risk,
            "alert_count": len(alerts),
            "has_emergency": any(a.alert_type == AlertType.EMERGENCY for a in alerts),
            "top_recommendations": immediate_alerts[0].recommendations[:3] if immediate_alerts else [],
            "affected_pollutants": immediate_alerts[0].affected_pollutants if immediate_alerts else [],
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error in quick health check: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Quick health check error: {str(e)}"
        )


@router.get("/risk-levels")
async def get_risk_level_info() -> Dict[str, Any]:
    """
    Get information about health risk levels and thresholds
    
    Returns detailed information about how risk levels are calculated
    """
    return {
        "success": True,
        "risk_levels": {
            "low": {
                "description": "Minimal health risk for most people",
                "color": "green",
                "general_advice": "Air quality is satisfactory for most people"
            },
            "moderate": {
                "description": "Acceptable for most, sensitive groups may experience minor symptoms",
                "color": "yellow",
                "general_advice": "Sensitive individuals should consider limiting prolonged outdoor exertion"
            },
            "high": {
                "description": "Health effects possible for sensitive groups",
                "color": "orange",
                "general_advice": "Sensitive groups should reduce outdoor activities"
            },
            "very_high": {
                "description": "Health warnings of emergency conditions",
                "color": "red",
                "general_advice": "Everyone should reduce outdoor activities"
            },
            "extreme": {
                "description": "Health alert - emergency conditions affect everyone",
                "color": "purple",
                "general_advice": "Everyone should avoid outdoor activities"
            }
        },
        "health_conditions": {
            condition.value: {
                "sensitivity_multiplier": "Higher than normal",
                "primary_concerns": "Respiratory and cardiovascular effects"
            }
            for condition in HealthCondition
        },
        "timestamp": datetime.utcnow().isoformat()
    }


@router.get("/recommendations/{risk_level}")
async def get_risk_recommendations(
    risk_level: str,
    conditions: str = Query(default="healthy", description="Comma-separated health conditions")
) -> Dict[str, Any]:
    """
    Get detailed recommendations for a specific risk level and health conditions
    """
    try:
        # Validate risk level
        try:
            risk_enum = RiskLevel(risk_level.lower())
        except ValueError:
            raise HTTPException(status_code=400, detail=f"Invalid risk level: {risk_level}")
        
        # Parse health conditions
        condition_list = []
        for condition_str in conditions.split(","):
            condition_str = condition_str.strip().lower()
            try:
                condition = HealthCondition(condition_str)
                condition_list.append(condition)
            except ValueError:
                logger.warning(f"Unknown health condition: {condition_str}")
        
        if not condition_list:
            condition_list = [HealthCondition.HEALTHY]
        
        # Generate mock recommendations (in a real implementation, this would be more sophisticated)
        general_recommendations = {
            RiskLevel.LOW: [
                "Air quality is good - enjoy outdoor activities",
                "No special precautions needed for most people"
            ],
            RiskLevel.MODERATE: [
                "Consider reducing prolonged outdoor exertion",
                "Sensitive individuals should monitor symptoms"
            ],
            RiskLevel.HIGH: [
                "Reduce outdoor activities, especially strenuous exercise",
                "Consider wearing a mask outdoors",
                "Keep windows closed"
            ],
            RiskLevel.VERY_HIGH: [
                "Avoid outdoor activities if possible",
                "Use air purifiers indoors",
                "Wear N95 mask if must go outside"
            ],
            RiskLevel.EXTREME: [
                "Stay indoors with windows and doors closed",
                "Use highest efficiency air filtration",
                "Seek medical attention if experiencing symptoms"
            ]
        }
        
        condition_specific = {}
        for condition in condition_list:
            if condition == HealthCondition.ASTHMA:
                condition_specific[condition.value] = [
                    "Keep rescue inhaler readily available",
                    "Monitor for breathing difficulties",
                    "Consider pre-medicating before exposure"
                ]
            elif condition == HealthCondition.COPD:
                condition_specific[condition.value] = [
                    "Use supplemental oxygen as prescribed",
                    "Monitor oxygen saturation",
                    "Stay hydrated"
                ]
            elif condition == HealthCondition.HEART_DISEASE:
                condition_specific[condition.value] = [
                    "Monitor for chest discomfort",
                    "Avoid strenuous activities",
                    "Take medications as prescribed"
                ]
        
        return {
            "success": True,
            "risk_level": risk_level,
            "general_recommendations": general_recommendations[risk_enum],
            "condition_specific_recommendations": condition_specific,
            "health_conditions": [c.value for c in condition_list],
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting recommendations: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Recommendations error: {str(e)}"
        )


@router.get("/health")
async def health_alert_service_check() -> Dict[str, Any]:
    """Health check for health alert service"""
    try:
        health_alert_service = await get_health_alert_service()
        
        return {
            "status": "healthy",
            "service": "health_alerts",
            "features_available": [
                "personalized_alerts",
                "risk_assessment",
                "health_recommendations",
                "emergency_notifications"
            ],
            "supported_conditions": [condition.value for condition in HealthCondition],
            "risk_levels": [level.value for level in RiskLevel],
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Health alert service check failed: {str(e)}")
        return {
            "status": "unhealthy",
            "service": "health_alerts",
            "error": str(e),
            "timestamp": datetime.utcnow().isoformat()
        }