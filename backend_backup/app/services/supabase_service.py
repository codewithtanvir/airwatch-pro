"""
Supabase Database Service - Python Implementation
Real-time database operations, user management, and push notifications
"""

import asyncio
import json
import logging
from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any, Union, Callable
from uuid import uuid4

from supabase import create_client, Client
from postgrest.exceptions import APIError
from gotrue.errors import AuthError
import httpx

from ..config import settings
from ..models import (
    AirQualityReading, UserPreferences, LocationSubscription,
    Alert, HistoricalDataPoint, Coordinates
)

logger = logging.getLogger(__name__)


class SupabaseService:
    """Supabase database service with real-time capabilities"""
    
    def __init__(self):
        self._cache: Dict[str, Dict] = {}
        self._cache_ttl = timedelta(minutes=settings.cache_ttl // 60)
        self._enabled = False
        
        # Only initialize if credentials are provided
        if (settings.supabase_url and 
            settings.supabase_key and 
            settings.supabase_anon_key and
            not settings.supabase_url.startswith('https://placeholder')):
            try:
                # Use anon key for primary client (standard practice)
                self.supabase: Client = create_client(
                    settings.supabase_url,
                    settings.supabase_anon_key
                )
                # Keep service role client for admin operations
                self.admin_client: Client = create_client(
                    settings.supabase_url,
                    settings.supabase_key
                )
                self._enabled = True
                logger.info("Supabase client initialized successfully")
            except Exception as e:
                logger.warning(f"Failed to initialize Supabase client: {e}")
                self._enabled = False
        else:
            logger.warning("Supabase credentials not configured - service disabled")
        
    async def initialize(self):
        """Initialize database connections and setup tables if needed"""
        if not self._enabled:
            logger.info("Supabase service disabled - skipping initialization")
            return True
            
        try:
            # Test connection
            response = self.supabase.table('data_sources').select('count').limit(1).execute()
            logger.info("Successfully connected to Supabase")
            return True
        except Exception as e:
            logger.error(f"Failed to connect to Supabase: {e}")
            self._enabled = False  # Disable service if connection fails
            return False

    # === AIR QUALITY DATA OPERATIONS ===
    
    def _check_enabled(self) -> bool:
        """Check if Supabase service is enabled and available"""
        if not self._enabled:
            logger.debug("Supabase service not available - operation skipped")
            return False
        return True
    
    async def store_air_quality_reading(self, reading: AirQualityReading) -> Optional[str]:
        """Store air quality reading in database"""
        if not self._check_enabled():
            return None
            
        try:
            data = {
                'id': str(uuid4()),
                'location_id': f"{reading.coordinates.lat}_{reading.coordinates.lng}",
                'latitude': reading.coordinates.lat,
                'longitude': reading.coordinates.lng,
                'timestamp': reading.timestamp.isoformat(),
                'aqi': reading.aqi,
                'aqi_category': reading.category.value,
                'pm25': reading.pollutants.pm25,
                'pm10': reading.pollutants.pm10,
                'no2': reading.pollutants.no2,
                'o3': reading.pollutants.o3,
                'so2': reading.pollutants.so2,
                'co': reading.pollutants.co,
                'primary_pollutant': reading.primary_pollutant,
                'data_source': reading.data_source.value,
                'quality_score': int(reading.quality_score * 100),
                'created_at': datetime.utcnow().isoformat(),
                'updated_at': datetime.utcnow().isoformat()
            }
            
            # Add weather data if available
            if reading.weather_data:
                data.update({
                    'temperature': reading.weather_data.temperature,
                    'humidity': reading.weather_data.humidity,
                    'wind_speed': reading.weather_data.wind_speed,
                    'wind_direction': reading.weather_data.wind_direction,
                    'pressure': reading.weather_data.pressure,
                    'visibility': reading.weather_data.visibility
                })
            
            result = self.supabase.table('air_quality_readings').insert(data).execute()
            
            if result.data:
                logger.info(f"Stored air quality reading: {data['id']}")
                return data['id']
            return None
            
        except APIError as e:
            logger.error(f"Error storing air quality reading: {e}")
            return None
    
    async def get_latest_reading(
        self,
        latitude: float,
        longitude: float,
        radius_km: float = 10
    ) -> Optional[Dict]:
        """Get latest air quality reading for a location"""
        try:
            # Simple distance-based query (in production, use PostGIS)
            lat_range = radius_km / 111.0  # Rough km to degrees conversion
            lng_range = radius_km / (111.0 * abs(latitude) if latitude != 0 else 111.0)
            
            result = self.supabase.table('air_quality_readings')\
                .select('*')\
                .gte('latitude', latitude - lat_range)\
                .lte('latitude', latitude + lat_range)\
                .gte('longitude', longitude - lng_range)\
                .lte('longitude', longitude + lng_range)\
                .order('timestamp', desc=True)\
                .limit(1)\
                .execute()
            
            return result.data[0] if result.data else None
            
        except APIError as e:
            logger.error(f"Error getting latest reading: {e}")
            return None
    
    async def get_historical_data(
        self,
        latitude: float,
        longitude: float,
        radius_km: float = 5,
        hours: int = 24
    ) -> List[Dict]:
        """Get historical air quality data for a location"""
        try:
            hours_ago = datetime.utcnow() - timedelta(hours=hours)
            
            # Distance-based filtering
            lat_range = radius_km / 111.0
            lng_range = radius_km / (111.0 * abs(latitude) if latitude != 0 else 111.0)
            
            result = self.supabase.table('air_quality_readings')\
                .select('*')\
                .gte('latitude', latitude - lat_range)\
                .lte('latitude', latitude + lat_range)\
                .gte('longitude', longitude - lng_range)\
                .lte('longitude', longitude + lng_range)\
                .gte('timestamp', hours_ago.isoformat())\
                .order('timestamp', desc=True)\
                .execute()
            
            return result.data or []
            
        except APIError as e:
            logger.error(f"Error getting historical data: {e}")
            return []

    # === USER MANAGEMENT ===
    
    async def create_user_preferences(
        self,
        user_id: str,
        preferences: UserPreferences
    ) -> bool:
        """Create or update user preferences"""
        try:
            data = {
                'user_id': user_id,
                'notification_enabled': preferences.notification_enabled,
                'email_alerts': preferences.email_alerts,
                'push_notifications': preferences.push_notifications,
                'sms_alerts': preferences.sms_alerts,
                'alert_thresholds': preferences.alert_thresholds,
                'preferred_units': preferences.preferred_units,
                'preferred_language': preferences.preferred_language,
                'timezone': preferences.timezone,
                'quiet_hours': preferences.quiet_hours,
                'location_tracking': preferences.location_tracking,
                'data_sharing': preferences.data_sharing,
                'updated_at': datetime.utcnow().isoformat()
            }
            
            # Use upsert to handle both create and update
            result = self.supabase.table('user_preferences')\
                .upsert(data, on_conflict='user_id')\
                .execute()
            
            return bool(result.data)
            
        except APIError as e:
            logger.error(f"Error creating user preferences: {e}")
            return False
    
    async def get_user_preferences(self, user_id: str) -> Optional[Dict]:
        """Get user preferences"""
        try:
            result = self.supabase.table('user_preferences')\
                .select('*')\
                .eq('user_id', user_id)\
                .single()\
                .execute()
            
            return result.data
            
        except APIError as e:
            logger.error(f"Error getting user preferences: {e}")
            return None

    # === LOCATION SUBSCRIPTIONS ===
    
    async def add_location_subscription(
        self,
        user_id: str,
        subscription: LocationSubscription
    ) -> Optional[str]:
        """Add location subscription for monitoring"""
        try:
            data = {
                'id': str(uuid4()),
                'user_id': user_id,
                'location_name': subscription.location_name,
                'latitude': subscription.coordinates.lat,
                'longitude': subscription.coordinates.lng,
                'radius_km': subscription.radius_km,
                'is_primary': subscription.is_primary,
                'alert_enabled': subscription.alert_enabled,
                'monitoring_frequency': subscription.monitoring_frequency,
                'created_at': datetime.utcnow().isoformat(),
                'updated_at': datetime.utcnow().isoformat()
            }
            
            result = self.supabase.table('location_subscriptions')\
                .insert(data)\
                .execute()
            
            if result.data:
                return data['id']
            return None
            
        except APIError as e:
            logger.error(f"Error adding location subscription: {e}")
            return None
    
    async def get_location_subscriptions(self, user_id: str) -> List[Dict]:
        """Get user's location subscriptions"""
        try:
            result = self.supabase.table('location_subscriptions')\
                .select('*')\
                .eq('user_id', user_id)\
                .order('created_at', desc=True)\
                .execute()
            
            return result.data or []
            
        except APIError as e:
            logger.error(f"Error getting location subscriptions: {e}")
            return []

    # === ALERTS AND NOTIFICATIONS ===
    
    async def create_alert(
        self,
        user_id: str,
        alert: Alert
    ) -> Optional[str]:
        """Create alert and store in database"""
        try:
            data = {
                'id': str(uuid4()),
                'user_id': user_id,
                'alert_type': alert.type.value,
                'severity': alert.severity.value,
                'title': alert.title,
                'message': alert.message,
                'location': alert.location,
                'latitude': alert.coordinates.lat if alert.coordinates else None,
                'longitude': alert.coordinates.lng if alert.coordinates else None,
                'aqi_value': alert.aqi_value,
                'pollutant_values': alert.pollutant_values or {},
                'active': alert.active,
                'expires_at': alert.expires_at.isoformat() if alert.expires_at else None,
                'created_at': datetime.utcnow().isoformat()
            }
            
            result = self.supabase.table('alert_history')\
                .insert(data)\
                .execute()
            
            if result.data:
                # Send notification if user preferences allow
                await self._send_notification_if_enabled(user_id, alert)
                return data['id']
            return None
            
        except APIError as e:
            logger.error(f"Error creating alert: {e}")
            return None
    
    async def get_alert_history(
        self,
        user_id: str,
        limit: int = 50,
        active_only: bool = False
    ) -> List[Dict]:
        """Get alert history for user"""
        try:
            query = self.supabase.table('alert_history')\
                .select('*')\
                .eq('user_id', user_id)
            
            if active_only:
                query = query.eq('active', True)
            
            result = query.order('created_at', desc=True)\
                .limit(limit)\
                .execute()
            
            return result.data or []
            
        except APIError as e:
            logger.error(f"Error getting alert history: {e}")
            return []
    
    async def acknowledge_alert(self, alert_id: str, user_id: str) -> bool:
        """Mark alert as acknowledged"""
        try:
            result = self.supabase.table('alert_history')\
                .update({
                    'acknowledged': True,
                    'acknowledged_at': datetime.utcnow().isoformat()
                })\
                .eq('id', alert_id)\
                .eq('user_id', user_id)\
                .execute()
            
            return bool(result.data)
            
        except APIError as e:
            logger.error(f"Error acknowledging alert: {e}")
            return False

    # === PUSH NOTIFICATIONS ===
    
    async def register_push_subscription(
        self,
        user_id: str,
        subscription_data: Dict
    ) -> bool:
        """Register push notification subscription"""
        try:
            data = {
                'user_id': user_id,
                'subscription': json.dumps(subscription_data),
                'created_at': datetime.utcnow().isoformat()
            }
            
            result = self.supabase.table('push_subscriptions')\
                .upsert(data, on_conflict='user_id')\
                .execute()
            
            return bool(result.data)
            
        except APIError as e:
            logger.error(f"Error registering push subscription: {e}")
            return False
    
    async def _send_notification_if_enabled(
        self,
        user_id: str,
        alert: Alert
    ):
        """Send notification if user preferences allow"""
        try:
            # Get user preferences
            preferences = await self.get_user_preferences(user_id)
            if not preferences or not preferences.get('notification_enabled'):
                return
            
            # Check quiet hours
            if self._is_in_quiet_hours(preferences):
                return
            
            # Send push notification if enabled
            if preferences.get('push_notifications'):
                await self._send_push_notification(user_id, alert)
            
            # Send email if enabled
            if preferences.get('email_alerts'):
                await self._send_email_notification(user_id, alert)
                
        except Exception as e:
            logger.error(f"Error sending notification: {e}")
    
    def _is_in_quiet_hours(self, preferences: Dict) -> bool:
        """Check if current time is within user's quiet hours"""
        quiet_hours = preferences.get('quiet_hours', {})
        if not quiet_hours.get('enabled'):
            return False
        
        # Simplified quiet hours check
        now = datetime.utcnow()
        current_time = now.hour * 60 + now.minute
        
        try:
            start_hour, start_min = map(int, quiet_hours['start_time'].split(':'))
            end_hour, end_min = map(int, quiet_hours['end_time'].split(':'))
            
            start_time = start_hour * 60 + start_min
            end_time = end_hour * 60 + end_min
            
            if start_time <= end_time:
                return start_time <= current_time <= end_time
            else:
                # Crosses midnight
                return current_time >= start_time or current_time <= end_time
                
        except (ValueError, KeyError):
            return False
    
    async def _send_push_notification(self, user_id: str, alert: Alert):
        """Send push notification using Web Push Protocol"""
        try:
            # Get user's push subscription
            result = self.supabase.table('push_subscriptions')\
                .select('subscription')\
                .eq('user_id', user_id)\
                .single()\
                .execute()
            
            if not result.data:
                return
            
            subscription = json.loads(result.data['subscription'])
            
            # Create notification payload
            payload = {
                'title': alert.title,
                'body': alert.message,
                'icon': '/icon-192x192.png',
                'badge': '/badge-72x72.png',
                'tag': f'alert-{alert.id}',
                'data': {
                    'alert_id': alert.id or '',
                    'alert_type': alert.type.value,
                    'severity': alert.severity.value,
                    'location': alert.location
                }
            }
            
            # Send via external push service (implementation depends on provider)
            # This would integrate with Firebase, OneSignal, or native Web Push
            logger.info(f"Would send push notification to {user_id}: {payload['title']}")
            
        except Exception as e:
            logger.error(f"Error sending push notification: {e}")
    
    async def _send_email_notification(self, user_id: str, alert: Alert):
        """Send email notification"""
        try:
            # Get user email from auth
            user_result = self.supabase.auth.admin.get_user_by_id(user_id)
            if not user_result.user:
                return
            
            email = user_result.user.email
            if not email:
                return
            
            # Email sending would be implemented here
            # This could use SendGrid, AWS SES, or similar service
            logger.info(f"Would send email to {email}: {alert.title}")
            
        except Exception as e:
            logger.error(f"Error sending email notification: {e}")

    # === DATA SOURCES MANAGEMENT ===
    
    async def update_data_source_status(
        self,
        source_name: str,
        status: str,
        metadata: Optional[Dict] = None
    ) -> bool:
        """Update data source status and metadata"""
        try:
            data = {
                'source_name': source_name,
                'status': status,
                'last_successful_fetch': datetime.utcnow().isoformat(),
                'metadata': metadata or {},
                'updated_at': datetime.utcnow().isoformat()
            }
            
            result = self.supabase.table('data_sources')\
                .upsert(data, on_conflict='source_name')\
                .execute()
            
            return bool(result.data)
            
        except APIError as e:
            logger.error(f"Error updating data source status: {e}")
            return False
    
    async def get_data_sources_status(self) -> List[Dict]:
        """Get status of all data sources"""
        try:
            result = self.supabase.table('data_sources')\
                .select('*')\
                .order('updated_at', desc=True)\
                .execute()
            
            return result.data or []
            
        except APIError as e:
            logger.error(f"Error getting data sources status: {e}")
            return []

    # === REAL-TIME SUBSCRIPTIONS ===
    
    def subscribe_to_air_quality_updates(
        self,
        callback: Callable,
        latitude: float,
        longitude: float,
        radius_km: float = 5
    ) -> str:
        """Subscribe to real-time air quality updates for a location"""
        try:
            subscription_id = str(uuid4())
            
            # Create real-time subscription
            channel = self.supabase.channel(f'air_quality_{subscription_id}')
            
            def handle_change(payload):
                """Handle real-time database changes"""
                if payload['eventType'] == 'INSERT':
                    reading = payload['new']
                    # Check if reading is within radius
                    if self._is_within_radius(
                        reading['latitude'], reading['longitude'],
                        latitude, longitude, radius_km
                    ):
                        callback(reading)
            
            # NOTE: Realtime subscriptions require newer Supabase client version
            # For now, we'll implement polling-based updates instead
            logger.info(f"Created subscription {subscription_id} for location {latitude}, {longitude}")
            # TODO: Implement polling-based real-time updates
            
            # try:
            #     channel.on('postgres_changes', {
            #         'event': 'INSERT',
            #         'schema': 'public',
            #         'table': 'air_quality_readings'
            #     }, handle_change)
            #     
            #     channel.subscribe()
            # except AttributeError:
            #     # Fallback for older supabase client versions
            #     logger.warning("Realtime subscriptions not available with current Supabase client version")
            
            return subscription_id
            
        except Exception as e:
            logger.error(f"Error setting up real-time subscription: {e}")
            return ""
    
    def _is_within_radius(
        self,
        reading_lat: float,
        reading_lng: float,
        target_lat: float,
        target_lng: float,
        radius_km: float
    ) -> bool:
        """Check if reading is within radius of target location"""
        # Simplified distance calculation
        lat_diff = abs(reading_lat - target_lat)
        lng_diff = abs(reading_lng - target_lng)
        
        # Rough conversion: 1 degree ≈ 111 km
        distance_km = ((lat_diff ** 2) + (lng_diff ** 2)) ** 0.5 * 111
        
        return distance_km <= radius_km

    # === ANALYTICS AND REPORTING ===
    
    async def get_air_quality_statistics(
        self,
        latitude: float,
        longitude: float,
        radius_km: float = 10,
        days: int = 7
    ) -> Dict[str, Any]:
        """Get air quality statistics for a location"""
        try:
            start_date = datetime.utcnow() - timedelta(days=days)
            
            # Get readings within area and time range
            readings = await self.get_historical_data(
                latitude, longitude, radius_km, days * 24
            )
            
            if not readings:
                return {}
            
            # Calculate statistics
            aqi_values = [r['aqi'] for r in readings]
            pm25_values = [r['pm25'] for r in readings if r.get('pm25')]
            
            stats = {
                'total_readings': len(readings),
                'average_aqi': sum(aqi_values) / len(aqi_values) if aqi_values else 0,
                'max_aqi': max(aqi_values) if aqi_values else 0,
                'min_aqi': min(aqi_values) if aqi_values else 0,
                'average_pm25': sum(pm25_values) / len(pm25_values) if pm25_values else 0,
                'days_good': len([a for a in aqi_values if a <= 50]),
                'days_moderate': len([a for a in aqi_values if 51 <= a <= 100]),
                'days_unhealthy': len([a for a in aqi_values if a > 100]),
                'start_date': start_date.isoformat(),
                'end_date': datetime.utcnow().isoformat()
            }
            
            return stats
            
        except Exception as e:
            logger.error(f"Error getting air quality statistics: {e}")
            return {}

    # === HEALTH CHECK ===
    
    async def health_check(self) -> Dict[str, Any]:
        """Check database health and connectivity"""
        if not self._enabled:
            return {
                'service_name': 'Supabase',
                'status': 'offline',
                'response_time_ms': 0.0,
                'last_check': datetime.utcnow(),
                'details': {
                    'database_connected': False,
                    'reason': 'Service disabled - credentials not configured'
                }
            }
            
        try:
            start_time = datetime.utcnow()
            
            # Test database connectivity
            result = self.supabase.table('data_sources')\
                .select('count')\
                .limit(1)\
                .execute()
            
            response_time = (datetime.utcnow() - start_time).total_seconds() * 1000
            
            return {
                'service_name': 'Supabase',
                'status': 'operational',
                'response_time_ms': response_time,
                'last_check': datetime.utcnow(),
                'details': {
                    'database_connected': True,
                    'timestamp': datetime.utcnow().isoformat()
                }
            }
            
        except Exception as e:
            return {
                'service_name': 'Supabase',
                'status': 'offline',
                'response_time_ms': 0.0,
                'last_check': datetime.utcnow(),
                'details': {
                    'database_connected': False,
                    'error': str(e),
                    'timestamp': datetime.utcnow().isoformat()
                }
            }


# Create singleton instance
supabase_service = SupabaseService()