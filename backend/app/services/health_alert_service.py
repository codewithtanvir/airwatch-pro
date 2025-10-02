"""
Health Risk Alert Service
Personalized health risk notifications based on air quality forecasts and user profiles
"""

import logging
import asyncio
from typing import Dict, List, Any, Optional, Tuple
from datetime import datetime, timedelta
from enum import Enum
from dataclasses import dataclass
from pydantic import BaseModel

from app.services.forecasting_service import get_forecasting_service

logger = logging.getLogger(__name__)


class HealthCondition(str, Enum):
    """Health conditions that affect air quality sensitivity"""
    ASTHMA = "asthma"
    COPD = "copd"
    HEART_DISEASE = "heart_disease"
    DIABETES = "diabetes"
    PREGNANCY = "pregnancy"
    ELDERLY = "elderly"
    CHILDREN = "children"
    HEALTHY = "healthy"


class RiskLevel(str, Enum):
    """Risk levels for health alerts"""
    LOW = "low"
    MODERATE = "moderate"
    HIGH = "high"
    VERY_HIGH = "very_high"
    EXTREME = "extreme"


class AlertType(str, Enum):
    """Types of health alerts"""
    IMMEDIATE = "immediate"
    HOURLY = "hourly"
    DAILY = "daily"
    FORECAST = "forecast"
    EMERGENCY = "emergency"


@dataclass
class HealthProfile:
    """User health profile for personalized alerts"""
    conditions: List[HealthCondition]
    sensitivity_level: str  # "low", "normal", "high"
    age_group: str  # "child", "adult", "elderly"
    activity_level: str  # "sedentary", "moderate", "active"
    outdoor_exposure: str  # "minimal", "moderate", "high"


@dataclass
class HealthAlert:
    """Health alert data structure"""
    alert_id: str
    alert_type: AlertType
    risk_level: RiskLevel
    title: str
    message: str
    recommendations: List[str]
    affected_pollutants: List[str]
    valid_until: datetime
    urgency_score: float
    location: Dict[str, float]
    health_conditions: List[HealthCondition]


class PersonalizedHealthAlertService:
    """Service for generating personalized health risk alerts"""
    
    def __init__(self):
        self.logger = logging.getLogger(__name__)
        
        # Health condition sensitivity multipliers
        self.condition_sensitivity = {
            HealthCondition.ASTHMA: {"pm2_5": 2.0, "o3": 2.5, "no2": 2.0, "so2": 1.8},
            HealthCondition.COPD: {"pm2_5": 2.5, "pm10": 2.0, "o3": 2.2, "no2": 2.0},
            HealthCondition.HEART_DISEASE: {"pm2_5": 2.0, "pm10": 1.8, "co": 2.5, "no2": 1.5},
            HealthCondition.DIABETES: {"pm2_5": 1.5, "o3": 1.8, "no2": 1.5},
            HealthCondition.PREGNANCY: {"pm2_5": 1.8, "pm10": 1.5, "co": 2.0, "o3": 1.6},
            HealthCondition.ELDERLY: {"pm2_5": 1.8, "pm10": 1.5, "o3": 1.8, "no2": 1.5},
            HealthCondition.CHILDREN: {"pm2_5": 1.6, "o3": 2.0, "no2": 1.8, "so2": 1.5},
            HealthCondition.HEALTHY: {"pm2_5": 1.0, "pm10": 1.0, "o3": 1.0, "no2": 1.0, "so2": 1.0, "co": 1.0}
        }
        
        # AQI thresholds for different risk levels by health condition
        self.risk_thresholds = {
            HealthCondition.ASTHMA: {"low": 30, "moderate": 50, "high": 100, "very_high": 150},
            HealthCondition.COPD: {"low": 25, "moderate": 45, "high": 90, "very_high": 130},
            HealthCondition.HEART_DISEASE: {"low": 35, "moderate": 55, "high": 110, "very_high": 160},
            HealthCondition.ELDERLY: {"low": 40, "moderate": 60, "high": 120, "very_high": 170},
            HealthCondition.CHILDREN: {"low": 35, "moderate": 55, "high": 110, "very_high": 160},
            HealthCondition.HEALTHY: {"low": 50, "moderate": 100, "high": 150, "very_high": 200}
        }
    
    async def generate_personalized_alerts(
        self,
        latitude: float,
        longitude: float,
        health_profile: HealthProfile,
        hours_ahead: int = 24
    ) -> List[HealthAlert]:
        """Generate personalized health alerts based on air quality forecast"""
        
        try:
            # Get comprehensive forecast
            forecasting_service = await get_forecasting_service()
            forecast_result = await forecasting_service.generate_comprehensive_forecast(
                latitude=latitude,
                longitude=longitude,
                hours_ahead=hours_ahead
            )
            
            if not forecast_result.get("success"):
                self.logger.error("Failed to get forecast for health alerts")
                return []
            
            alerts = []
            forecast_data = forecast_result.get("forecast_data", [])
            current_analysis = forecast_result.get("current_analysis", {})
            
            # Generate immediate alert for current conditions
            immediate_alert = await self._generate_immediate_alert(
                current_analysis, health_profile, latitude, longitude
            )
            if immediate_alert:
                alerts.append(immediate_alert)
            
            # Generate forecast-based alerts
            forecast_alerts = await self._generate_forecast_alerts(
                forecast_data, health_profile, latitude, longitude
            )
            alerts.extend(forecast_alerts)
            
            # Generate emergency alerts if needed
            emergency_alerts = await self._check_emergency_conditions(
                forecast_data, health_profile, latitude, longitude
            )
            alerts.extend(emergency_alerts)
            
            # Sort alerts by urgency score
            alerts.sort(key=lambda x: x.urgency_score, reverse=True)
            
            return alerts
            
        except Exception as e:
            self.logger.error(f"Error generating personalized alerts: {str(e)}", exc_info=True)
            return []
    
    async def _generate_immediate_alert(
        self,
        current_analysis: Dict[str, Any],
        health_profile: HealthProfile,
        latitude: float,
        longitude: float
    ) -> Optional[HealthAlert]:
        """Generate immediate alert for current conditions"""
        
        current_aqi = current_analysis.get("current_aqi")
        if not current_aqi:
            return None
        
        # Calculate personalized risk level
        risk_level, adjusted_aqi = self._calculate_personalized_risk(
            current_aqi, health_profile, current_analysis
        )
        
        if risk_level in [RiskLevel.HIGH, RiskLevel.VERY_HIGH, RiskLevel.EXTREME]:
            # Determine primary health conditions at risk
            at_risk_conditions = self._get_at_risk_conditions(
                current_aqi, health_profile.conditions
            )
            
            # Generate recommendations
            recommendations = self._generate_health_recommendations(
                risk_level, health_profile, current_analysis, at_risk_conditions
            )
            
            return HealthAlert(
                alert_id=f"immediate_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}",
                alert_type=AlertType.IMMEDIATE,
                risk_level=risk_level,
                title=f"Current Air Quality Health Alert - {risk_level.value.title()} Risk",
                message=self._generate_alert_message(risk_level, current_aqi, adjusted_aqi, at_risk_conditions),
                recommendations=recommendations,
                affected_pollutants=self._identify_problem_pollutants(current_analysis),
                valid_until=datetime.utcnow() + timedelta(hours=1),
                urgency_score=self._calculate_urgency_score(risk_level, at_risk_conditions),
                location={"latitude": latitude, "longitude": longitude},
                health_conditions=at_risk_conditions
            )
        
        return None
    
    async def _generate_forecast_alerts(
        self,
        forecast_data: List[Dict[str, Any]],
        health_profile: HealthProfile,
        latitude: float,
        longitude: float
    ) -> List[HealthAlert]:
        """Generate alerts based on forecast predictions"""
        
        alerts = []
        
        # Check for significant deterioration in next 24 hours
        high_risk_periods = []
        
        for i, hour_data in enumerate(forecast_data[:24]):
            predicted_aqi = hour_data.get("predicted_aqi", 0)
            risk_level, adjusted_aqi = self._calculate_personalized_risk(
                predicted_aqi, health_profile, hour_data
            )
            
            if risk_level in [RiskLevel.HIGH, RiskLevel.VERY_HIGH, RiskLevel.EXTREME]:
                high_risk_periods.append({
                    "hour": i + 1,
                    "aqi": predicted_aqi,
                    "adjusted_aqi": adjusted_aqi,
                    "risk_level": risk_level,
                    "data": hour_data
                })
        
        # Generate forecast alert if significant risks found
        if high_risk_periods:
            at_risk_conditions = self._get_at_risk_conditions(
                max(period["aqi"] for period in high_risk_periods),
                health_profile.conditions
            )
            
            max_risk_level = max(period["risk_level"] for period in high_risk_periods)
            
            recommendations = self._generate_forecast_recommendations(
                high_risk_periods, health_profile, at_risk_conditions
            )
            
            alerts.append(HealthAlert(
                alert_id=f"forecast_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}",
                alert_type=AlertType.FORECAST,
                risk_level=max_risk_level,
                title=f"Air Quality Forecast Alert - {len(high_risk_periods)} High Risk Hours Ahead",
                message=self._generate_forecast_message(high_risk_periods, at_risk_conditions),
                recommendations=recommendations,
                affected_pollutants=self._identify_forecast_problem_pollutants(high_risk_periods),
                valid_until=datetime.utcnow() + timedelta(hours=24),
                urgency_score=self._calculate_urgency_score(max_risk_level, at_risk_conditions) * 0.8,
                location={"latitude": latitude, "longitude": longitude},
                health_conditions=at_risk_conditions
            ))
        
        return alerts
    
    async def _check_emergency_conditions(
        self,
        forecast_data: List[Dict[str, Any]],
        health_profile: HealthProfile,
        latitude: float,
        longitude: float
    ) -> List[HealthAlert]:
        """Check for emergency-level conditions requiring immediate action"""
        
        alerts = []
        
        # Check for extreme conditions
        for i, hour_data in enumerate(forecast_data[:6]):  # Next 6 hours
            predicted_aqi = hour_data.get("predicted_aqi", 0)
            risk_level, adjusted_aqi = self._calculate_personalized_risk(
                predicted_aqi, health_profile, hour_data
            )
            
            if risk_level == RiskLevel.EXTREME or adjusted_aqi > 300:
                at_risk_conditions = health_profile.conditions
                
                alerts.append(HealthAlert(
                    alert_id=f"emergency_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}_{i}",
                    alert_type=AlertType.EMERGENCY,
                    risk_level=RiskLevel.EXTREME,
                    title="EMERGENCY: Extreme Air Quality Alert",
                    message=f"EMERGENCY ALERT: Extremely hazardous air quality predicted in {i+1} hour(s). Immediate protective action required for all health conditions.",
                    recommendations=self._generate_emergency_recommendations(health_profile),
                    affected_pollutants=self._identify_problem_pollutants(hour_data),
                    valid_until=datetime.utcnow() + timedelta(hours=6),
                    urgency_score=10.0,  # Maximum urgency
                    location={"latitude": latitude, "longitude": longitude},
                    health_conditions=at_risk_conditions
                ))
                break  # Only one emergency alert needed
        
        return alerts
    
    def _calculate_personalized_risk(
        self,
        base_aqi: float,
        health_profile: HealthProfile,
        air_data: Dict[str, Any]
    ) -> Tuple[RiskLevel, float]:
        """Calculate personalized risk level based on health profile"""
        
        # Get the most sensitive health condition
        primary_condition = self._get_primary_health_condition(health_profile.conditions)
        
        # Adjust AQI based on health conditions and pollutant sensitivities
        components = air_data.get("components", {})
        
        adjusted_factors = []
        for pollutant, value in components.items():
            if pollutant in self.condition_sensitivity[primary_condition]:
                sensitivity = self.condition_sensitivity[primary_condition][pollutant]
                adjusted_factors.append(sensitivity)
        
        # Calculate adjusted AQI
        adjustment_factor = max(adjusted_factors) if adjusted_factors else 1.0
        
        # Additional adjustments based on profile
        if health_profile.sensitivity_level == "high":
            adjustment_factor *= 1.2
        elif health_profile.sensitivity_level == "low":
            adjustment_factor *= 0.9
        
        if health_profile.activity_level == "active":
            adjustment_factor *= 1.15
        
        if health_profile.outdoor_exposure == "high":
            adjustment_factor *= 1.1
        
        adjusted_aqi = base_aqi * adjustment_factor
        
        # Determine risk level based on adjusted AQI
        thresholds = self.risk_thresholds[primary_condition]
        
        if adjusted_aqi >= thresholds["very_high"]:
            if adjusted_aqi >= 300:
                risk_level = RiskLevel.EXTREME
            else:
                risk_level = RiskLevel.VERY_HIGH
        elif adjusted_aqi >= thresholds["high"]:
            risk_level = RiskLevel.HIGH
        elif adjusted_aqi >= thresholds["moderate"]:
            risk_level = RiskLevel.MODERATE
        else:
            risk_level = RiskLevel.LOW
        
        return risk_level, adjusted_aqi
    
    def _get_primary_health_condition(self, conditions: List[HealthCondition]) -> HealthCondition:
        """Get the most sensitive health condition"""
        priority_order = [
            HealthCondition.COPD,
            HealthCondition.ASTHMA,
            HealthCondition.HEART_DISEASE,
            HealthCondition.PREGNANCY,
            HealthCondition.ELDERLY,
            HealthCondition.CHILDREN,
            HealthCondition.DIABETES,
            HealthCondition.HEALTHY
        ]
        
        for condition in priority_order:
            if condition in conditions:
                return condition
        
        return HealthCondition.HEALTHY
    
    def _get_at_risk_conditions(
        self,
        aqi: float,
        user_conditions: List[HealthCondition]
    ) -> List[HealthCondition]:
        """Determine which health conditions are at risk"""
        at_risk = []
        
        for condition in user_conditions:
            thresholds = self.risk_thresholds[condition]
            if aqi >= thresholds["moderate"]:
                at_risk.append(condition)
        
        return at_risk
    
    def _generate_health_recommendations(
        self,
        risk_level: RiskLevel,
        health_profile: HealthProfile,
        air_data: Dict[str, Any],
        at_risk_conditions: List[HealthCondition]
    ) -> List[str]:
        """Generate personalized health recommendations"""
        
        recommendations = []
        
        # General recommendations based on risk level
        if risk_level == RiskLevel.EXTREME:
            recommendations.extend([
                "Stay indoors and keep windows closed",
                "Use air purifiers if available",
                "Avoid all outdoor activities",
                "Seek medical attention if experiencing symptoms"
            ])
        elif risk_level == RiskLevel.VERY_HIGH:
            recommendations.extend([
                "Limit outdoor activities to essential only",
                "Wear N95 or P100 mask when outdoors",
                "Keep windows closed and use air conditioning"
            ])
        elif risk_level == RiskLevel.HIGH:
            recommendations.extend([
                "Reduce outdoor exercise and activities",
                "Consider wearing a mask outdoors",
                "Take frequent breaks if must be outside"
            ])
        
        # Condition-specific recommendations
        for condition in at_risk_conditions:
            if condition == HealthCondition.ASTHMA:
                recommendations.extend([
                    "Keep rescue inhaler readily available",
                    "Monitor for asthma symptoms closely",
                    "Consider pre-medicating before outdoor exposure"
                ])
            elif condition == HealthCondition.COPD:
                recommendations.extend([
                    "Use supplemental oxygen as prescribed",
                    "Monitor breathing difficulty",
                    "Stay hydrated and rest frequently"
                ])
            elif condition == HealthCondition.HEART_DISEASE:
                recommendations.extend([
                    "Monitor for chest pain or discomfort",
                    "Avoid strenuous activities",
                    "Take medications as prescribed"
                ])
            elif condition == HealthCondition.PREGNANCY:
                recommendations.extend([
                    "Minimize outdoor exposure",
                    "Monitor fetal movement",
                    "Consult healthcare provider if concerned"
                ])
        
        return recommendations
    
    def _generate_forecast_recommendations(
        self,
        high_risk_periods: List[Dict[str, Any]],
        health_profile: HealthProfile,
        at_risk_conditions: List[HealthCondition]
    ) -> List[str]:
        """Generate recommendations for forecast alerts"""
        
        recommendations = []
        
        # Time-specific recommendations
        earliest_risk = min(period["hour"] for period in high_risk_periods)
        
        recommendations.extend([
            f"Plan indoor activities for the next {earliest_risk} hour(s)",
            "Reschedule outdoor activities to avoid high-risk periods",
            "Prepare medications and air purification devices"
        ])
        
        # Activity planning
        if health_profile.activity_level == "active":
            recommendations.append("Consider moving exercise to early morning or late evening")
        
        if health_profile.outdoor_exposure == "high":
            recommendations.append("Plan work/commute routes to minimize exposure time")
        
        return recommendations
    
    def _generate_emergency_recommendations(self, health_profile: HealthProfile) -> List[str]:
        """Generate emergency-level recommendations"""
        
        return [
            "IMMEDIATE ACTION REQUIRED: Stay indoors immediately",
            "Seal windows and doors if possible",
            "Use highest-efficiency air filtration available",
            "Contact healthcare provider if experiencing any symptoms",
            "Monitor local emergency services for evacuation orders",
            "Keep emergency medications readily accessible",
            "Avoid all outdoor activities until conditions improve"
        ]
    
    def _identify_problem_pollutants(self, air_data: Dict[str, Any]) -> List[str]:
        """Identify pollutants causing health concerns"""
        
        problem_pollutants = []
        components = air_data.get("components", {})
        
        # EPA standard thresholds for health concerns
        thresholds = {
            "pm2_5": 35,
            "pm10": 150,
            "o3": 120,
            "no2": 100,
            "so2": 75,
            "co": 15
        }
        
        for pollutant, value in components.items():
            if pollutant in thresholds and value > thresholds[pollutant]:
                problem_pollutants.append(pollutant.upper().replace("_", "."))
        
        return problem_pollutants
    
    def _identify_forecast_problem_pollutants(self, high_risk_periods: List[Dict[str, Any]]) -> List[str]:
        """Identify problematic pollutants across forecast periods"""
        
        all_pollutants = set()
        
        for period in high_risk_periods:
            pollutants = self._identify_problem_pollutants(period["data"])
            all_pollutants.update(pollutants)
        
        return list(all_pollutants)
    
    def _calculate_urgency_score(
        self,
        risk_level: RiskLevel,
        at_risk_conditions: List[HealthCondition]
    ) -> float:
        """Calculate urgency score for alert prioritization"""
        
        base_scores = {
            RiskLevel.LOW: 1.0,
            RiskLevel.MODERATE: 3.0,
            RiskLevel.HIGH: 6.0,
            RiskLevel.VERY_HIGH: 8.0,
            RiskLevel.EXTREME: 10.0
        }
        
        score = base_scores[risk_level]
        
        # Increase urgency based on health conditions
        high_risk_conditions = [
            HealthCondition.ASTHMA,
            HealthCondition.COPD,
            HealthCondition.HEART_DISEASE
        ]
        
        for condition in at_risk_conditions:
            if condition in high_risk_conditions:
                score *= 1.3
            else:
                score *= 1.1
        
        return min(score, 10.0)  # Cap at 10.0
    
    def _generate_alert_message(
        self,
        risk_level: RiskLevel,
        base_aqi: float,
        adjusted_aqi: float,
        at_risk_conditions: List[HealthCondition]
    ) -> str:
        """Generate human-readable alert message"""
        
        condition_names = {
            HealthCondition.ASTHMA: "asthma",
            HealthCondition.COPD: "COPD",
            HealthCondition.HEART_DISEASE: "heart disease",
            HealthCondition.DIABETES: "diabetes",
            HealthCondition.PREGNANCY: "pregnancy",
            HealthCondition.ELDERLY: "elderly individuals",
            HealthCondition.CHILDREN: "children"
        }
        
        conditions_text = ", ".join([condition_names.get(c, c.value) for c in at_risk_conditions])
        
        return (
            f"Current air quality poses {risk_level.value} health risk. "
            f"AQI: {base_aqi:.0f} (adjusted to {adjusted_aqi:.0f} for your health profile). "
            f"Individuals with {conditions_text} should take extra precautions."
        )
    
    def _generate_forecast_message(
        self,
        high_risk_periods: List[Dict[str, Any]],
        at_risk_conditions: List[HealthCondition]
    ) -> str:
        """Generate forecast alert message"""
        
        earliest_hour = min(period["hour"] for period in high_risk_periods)
        max_aqi = max(period["aqi"] for period in high_risk_periods)
        
        condition_names = {
            HealthCondition.ASTHMA: "asthma",
            HealthCondition.COPD: "COPD",
            HealthCondition.HEART_DISEASE: "heart disease",
            HealthCondition.DIABETES: "diabetes",
            HealthCondition.PREGNANCY: "pregnancy",
            HealthCondition.ELDERLY: "elderly individuals",
            HealthCondition.CHILDREN: "children"
        }
        
        conditions_text = ", ".join([condition_names.get(c, c.value) for c in at_risk_conditions])
        
        return (
            f"Air quality deterioration predicted starting in {earliest_hour} hour(s). "
            f"Peak AQI expected: {max_aqi:.0f}. "
            f"Plan accordingly if you have {conditions_text}."
        )


# Service instance
_health_alert_service: Optional[PersonalizedHealthAlertService] = None


async def get_health_alert_service() -> PersonalizedHealthAlertService:
    """Get or create the health alert service instance"""
    global _health_alert_service
    if _health_alert_service is None:
        _health_alert_service = PersonalizedHealthAlertService()
    return _health_alert_service