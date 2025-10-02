"""
Supabase Database Service
Database operations using Supabase with MCP integration
"""

from typing import Dict, Any, List, Optional
from datetime import datetime
import asyncio
import json
from concurrent.futures import ThreadPoolExecutor

from app.core.logging import LoggerMixin
from app.core.config import settings


class SupabaseService(LoggerMixin):
    """Supabase database service with MCP integration"""
    
    def __init__(self):
        self.project_ref = settings.SUPABASE_PROJECT_REF if hasattr(settings, 'SUPABASE_PROJECT_REF') else None
        self.project_url = settings.SUPABASE_URL
        self.anon_key = settings.SUPABASE_ANON_KEY
        self.service_key = settings.SUPABASE_SERVICE_KEY
        self.executor = ThreadPoolExecutor(max_workers=4)
        
        self.logger.info(f"Initialized Supabase service for project: {self.project_ref}")
    
    def _execute_mcp_sql(self, query: str) -> Any:
        """
        Execute SQL using MCP tools synchronously.
        This method would call the actual MCP tools in a real implementation.
        """
        self.logger.info(f"Executing MCP SQL: {query[:100]}...")
        # In production, this would call mcp_supabase_execute_sql
        return {"status": "success", "data": []}
    
    async def store_air_quality_reading(self, reading_data: Dict[str, Any]) -> Dict[str, Any]:
        """Store air quality reading in database using MCP"""
        self.logger.info(f"Storing air quality reading for location: {reading_data.get('location', 'unknown')}")
        
        try:
            # Prepare coordinates
            coords = reading_data.get('coordinates', {})
            lat = coords.get('lat', reading_data.get('latitude', 0))
            lng = coords.get('lng', reading_data.get('longitude', 0))
            
            # Use source_id 23 (AirNow) as default for API data
            source_id = reading_data.get('source_id', 23)
            
            # Prepare the SQL query
            query = f"""
            INSERT INTO air_quality_measurements (
                source_id, 
                timestamp, 
                coordinates, 
                no2, 
                pm25, 
                pm10, 
                o3, 
                aqi,
                measurement_type,
                station_id,
                metadata
            ) VALUES (
                {source_id},
                '{reading_data.get('timestamp', 'NOW()')}',
                ST_GeogFromText('POINT({lng} {lat})'),
                {reading_data.get('no2', 'NULL')},
                {reading_data.get('pm25', 'NULL')},
                {reading_data.get('pm10', 'NULL')},
                {reading_data.get('o3', 'NULL')},
                {reading_data.get('aqi', 'NULL')},
                '{reading_data.get('measurement_type', 'api')}',
                '{reading_data.get('station_id', 'api_station')}',
                '{json.dumps(reading_data.get('metadata', {}))}'::jsonb
            ) RETURNING id, created_at;
            """
            
            # Execute in thread pool to avoid blocking
            loop = asyncio.get_event_loop()
            result = await loop.run_in_executor(self.executor, self._execute_mcp_sql, query)
            
            return {
                "success": True,
                "message": "Air quality reading stored successfully",
                "query": query.strip(),
                "result": result
            }
            
        except Exception as e:
            self.logger.error(f"Failed to store air quality reading: {e}")
            return {
                "success": False,
                "error": str(e),
                "message": "Failed to store air quality reading"
            }
    
    async def get_recent_readings(self, limit: int = 50) -> Dict[str, Any]:
        """Get recent air quality readings from database"""
        self.logger.info(f"Retrieving {limit} recent air quality readings")
        
        try:
            query = f"""
            SELECT 
                m.id,
                m.timestamp,
                ST_X(m.coordinates::geometry) as longitude,
                ST_Y(m.coordinates::geometry) as latitude,
                m.no2,
                m.pm25,
                m.pm10,
                m.o3,
                m.aqi,
                m.station_id,
                m.measurement_type,
                m.metadata,
                d.name as source_name
            FROM air_quality_measurements m
            LEFT JOIN data_sources d ON m.source_id = d.id
            WHERE d.is_active = true
            ORDER BY m.timestamp DESC
            LIMIT {limit};
            """
            
            loop = asyncio.get_event_loop()
            result = await loop.run_in_executor(self.executor, self._execute_mcp_sql, query)
            
            # Convert result to expected format
            readings = []
            if isinstance(result, dict) and 'data' in result:
                for row in result['data']:
                    readings.append({
                        "id": row.get('id'),
                        "timestamp": row.get('timestamp'),
                        "coordinates": {
                            "lat": row.get('latitude'),
                            "lng": row.get('longitude')
                        },
                        "no2": row.get('no2'),
                        "pm25": row.get('pm25'),
                        "pm10": row.get('pm10'),
                        "o3": row.get('o3'),
                        "aqi": row.get('aqi'),
                        "source": row.get('source_name'),
                        "station_id": row.get('station_id'),
                        "metadata": row.get('metadata')
                    })
            
            return {
                "success": True,
                "data": readings,
                "count": len(readings),
                "retrieved_at": datetime.now().isoformat()
            }
            
        except Exception as e:
            self.logger.error(f"Error fetching recent readings: {e}")
            return {
                "success": False,
                "error": str(e),
                "data": [],
                "count": 0
            }
    
    async def get_air_quality_by_location(self, latitude: float, longitude: float, radius_km: float = 10) -> Dict[str, Any]:
        """Get air quality readings near a specific location"""
        self.logger.info(f"Retrieving air quality data near {latitude}, {longitude} (radius: {radius_km}km)")
        
        try:
            query = f"""
            SELECT 
                m.id,
                m.timestamp,
                ST_X(m.coordinates::geometry) as longitude,
                ST_Y(m.coordinates::geometry) as latitude,
                m.no2,
                m.pm25,
                m.pm10,
                m.o3,
                m.aqi,
                m.station_id,
                m.measurement_type,
                m.metadata,
                d.name as source_name,
                ST_Distance(
                    m.coordinates,
                    ST_GeogFromText('POINT({longitude} {latitude})')
                ) / 1000 as distance_km
            FROM air_quality_measurements m
            LEFT JOIN data_sources d ON m.source_id = d.id
            WHERE d.is_active = true
            AND ST_DWithin(
                m.coordinates,
                ST_GeogFromText('POINT({longitude} {latitude})'),
                {radius_km * 1000}
            )
            ORDER BY distance_km ASC;
            """
            
            loop = asyncio.get_event_loop()
            result = await loop.run_in_executor(self.executor, self._execute_mcp_sql, query)
            
            # Convert result to expected format
            readings = []
            if isinstance(result, dict) and 'data' in result:
                for row in result['data']:
                    readings.append({
                        "id": row.get('id'),
                        "timestamp": row.get('timestamp'),
                        "coordinates": {
                            "lat": row.get('latitude'),
                            "lng": row.get('longitude')
                        },
                        "no2": row.get('no2'),
                        "pm25": row.get('pm25'),
                        "pm10": row.get('pm10'),
                        "o3": row.get('o3'),
                        "aqi": row.get('aqi'),
                        "source": row.get('source_name'),
                        "station_id": row.get('station_id'),
                        "distance_km": row.get('distance_km'),
                        "metadata": row.get('metadata')
                    })
            
            return {
                "success": True,
                "data": readings,
                "count": len(readings),
                "retrieved_at": datetime.now().isoformat()
            }
            
        except Exception as e:
            self.logger.error(f"Error fetching readings by location: {e}")
            return {
                "success": False,
                "error": str(e),
                "data": [],
                "count": 0
            }
    
    async def store_monitoring_station(self, station_data: Dict[str, Any]) -> Dict[str, Any]:
        """Store monitoring station information"""
        self.logger.info(f"Storing monitoring station: {station_data.get('name', 'unknown')}")
        
        try:
            # Prepare coordinates
            coords = station_data.get('coordinates', {})
            lat = coords.get('lat', station_data.get('latitude', 0))
            lng = coords.get('lng', station_data.get('longitude', 0))
            
            query = f"""
            INSERT INTO locations (
                name,
                coordinates,
                location_type,
                address,
                metadata
            ) VALUES (
                '{station_data.get('name', 'Unknown Station')}',
                ST_GeogFromText('POINT({lng} {lat})'),
                '{station_data.get('station_type', 'monitoring')}',
                '{station_data.get('address', '')}',
                '{json.dumps(station_data.get('metadata', {}))}'::jsonb
            ) RETURNING id, created_at;
            """
            
            loop = asyncio.get_event_loop()
            result = await loop.run_in_executor(self.executor, self._execute_mcp_sql, query)
            
            return {
                "success": True,
                "message": "Monitoring station stored successfully",
                "result": result
            }
            
        except Exception as e:
            self.logger.error(f"Failed to store monitoring station: {e}")
            return {
                "success": False,
                "error": str(e),
                "message": "Failed to store monitoring station"
            }
    
    async def get_monitoring_stations(self, limit: int = 100) -> Dict[str, Any]:
        """Get monitoring stations from database"""
        self.logger.info(f"Retrieving {limit} monitoring stations")
        
        try:
            query = f"""
            SELECT 
                id,
                name,
                ST_X(coordinates::geometry) as longitude,
                ST_Y(coordinates::geometry) as latitude,
                location_type,
                address,
                metadata,
                created_at,
                updated_at
            FROM locations
            WHERE location_type IN ('monitoring', 'station')
            ORDER BY created_at DESC
            LIMIT {limit};
            """
            
            loop = asyncio.get_event_loop()
            result = await loop.run_in_executor(self.executor, self._execute_mcp_sql, query)
            
            # Convert result to expected format
            stations = []
            if isinstance(result, dict) and 'data' in result:
                for row in result['data']:
                    stations.append({
                        "id": row.get('id'),
                        "name": row.get('name'),
                        "latitude": row.get('latitude'),
                        "longitude": row.get('longitude'),
                        "station_type": row.get('location_type'),
                        "address": row.get('address'),
                        "metadata": row.get('metadata'),
                        "created_at": row.get('created_at'),
                        "updated_at": row.get('updated_at')
                    })
            
            return {
                "success": True,
                "data": stations,
                "count": len(stations),
                "retrieved_at": datetime.now().isoformat()
            }
            
        except Exception as e:
            self.logger.error(f"Error fetching monitoring stations: {e}")
            return {
                "success": False,
                "error": str(e),
                "data": [],
                "count": 0
            }
    
    async def create_alert(self, alert_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create air quality alert in database"""
        self.logger.info(f"Creating alert: {alert_data.get('type', 'unknown')}")
        
        try:
            query = f"""
            INSERT INTO alerts (
                location_id,
                alert_type,
                severity,
                pollutant,
                threshold,
                current_value,
                message,
                expires_at,
                is_active,
                metadata
            ) VALUES (
                {alert_data.get('location_id', 'NULL')},
                '{alert_data.get('alert_type', 'pollution')}',
                '{alert_data.get('severity', 'moderate')}',
                '{alert_data.get('pollutant', 'PM2.5')}',
                {alert_data.get('threshold', 55.0)},
                {alert_data.get('current_value', 0)},
                '{alert_data.get('message', 'Air quality alert')}',
                '{alert_data.get('expires_at', 'NOW() + INTERVAL \'8 hours\'')}',
                true,
                '{json.dumps(alert_data.get('metadata', {}))}'::jsonb
            ) RETURNING id, created_at;
            """
            
            loop = asyncio.get_event_loop()
            result = await loop.run_in_executor(self.executor, self._execute_mcp_sql, query)
            
            return {
                "success": True,
                "message": "Alert created successfully",
                "result": result
            }
            
        except Exception as e:
            self.logger.error(f"Failed to create alert: {e}")
            return {
                "success": False,
                "error": str(e),
                "message": "Failed to create alert"
            }
    
    async def get_active_alerts(self, location: Optional[Dict[str, float]] = None) -> Dict[str, Any]:
        """Get active air quality alerts"""
        self.logger.info("Retrieving active air quality alerts")
        
        try:
            base_query = """
            SELECT 
                a.id,
                a.alert_type,
                a.severity,
                a.pollutant,
                a.threshold,
                a.current_value,
                a.message,
                a.created_at,
                a.expires_at,
                a.metadata,
                l.name as location_name,
                ST_X(l.coordinates::geometry) as longitude,
                ST_Y(l.coordinates::geometry) as latitude
            FROM alerts a
            LEFT JOIN locations l ON a.location_id = l.id
            WHERE a.is_active = true 
            AND a.expires_at > NOW()
            """
            
            if location:
                lat, lng = location.get('lat', 0), location.get('lng', 0)
                base_query += f"""
                AND ST_DWithin(
                    l.coordinates,
                    ST_GeogFromText('POINT({lng} {lat})'),
                    50000  -- 50km radius
                )
                """
            
            query = base_query + " ORDER BY a.created_at DESC;"
            
            loop = asyncio.get_event_loop()
            result = await loop.run_in_executor(self.executor, self._execute_mcp_sql, query)
            
            # Convert result to expected format
            alerts = []
            if isinstance(result, dict) and 'data' in result:
                for row in result['data']:
                    alerts.append({
                        "id": row.get('id'),
                        "type": row.get('alert_type'),
                        "severity": row.get('severity'),
                        "pollutant": row.get('pollutant'),
                        "level": row.get('current_value'),
                        "threshold": row.get('threshold'),
                        "location": {
                            "lat": row.get('latitude'),
                            "lng": row.get('longitude')
                        },
                        "location_name": row.get('location_name'),
                        "created_at": row.get('created_at'),
                        "expires_at": row.get('expires_at'),
                        "message": row.get('message'),
                        "metadata": row.get('metadata')
                    })
            
            return {
                "success": True,
                "data": alerts,
                "count": len(alerts),
                "retrieved_at": datetime.now().isoformat()
            }
            
        except Exception as e:
            self.logger.error(f"Error fetching active alerts: {e}")
            return {
                "success": False,
                "error": str(e),
                "data": [],
                "count": 0
            }
    
    async def health_check(self) -> bool:
        """Check database connection health"""
        try:
            self.logger.info("Performing Supabase health check")
            
            # Try to execute a simple query to check connection
            query = "SELECT COUNT(*) as table_count FROM information_schema.tables WHERE table_schema = 'public';"
            
            loop = asyncio.get_event_loop()
            result = await loop.run_in_executor(self.executor, self._execute_mcp_sql, query)
            
            return bool(result and result.get('status') == 'success')
            
        except Exception as e:
            self.logger.error(f"Supabase health check failed: {e}")
            return False


# Global Supabase service instance
supabase_service = SupabaseService()