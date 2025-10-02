"""
Frontend Integration Test
Test that all endpoints expected by the frontend are working correctly
"""

import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_root_endpoint():
    """Test the root endpoint"""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert "message" in data
    assert "version" in data


def test_health_endpoint():
    """Test the health check endpoint"""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"


def test_api_health_endpoint():
    """Test the API v1 health endpoint"""
    response = client.get("/api/v1/health/")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"


def test_current_air_quality_endpoint():
    """Test current air quality endpoint matches frontend expectations"""
    response = client.get("/api/v1/air-quality/current?latitude=40.7128&longitude=-74.0060")
    assert response.status_code == 200
    data = response.json()
    
    # Check frontend-expected structure
    assert "success" in data
    assert data["success"] is True
    assert "data" in data
    
    # Check air quality data structure
    aq_data = data["data"]
    assert "location" in aq_data
    assert "coordinates" in aq_data
    assert "aqi" in aq_data
    assert "pollutants" in aq_data
    assert "aqi_level" in aq_data
    

def test_historical_air_quality_endpoint():
    """Test historical air quality endpoint"""
    response = client.get("/api/v1/air-quality/historical?latitude=40.7128&longitude=-74.0060&hours=24")
    assert response.status_code == 200
    data = response.json()
    
    assert "success" in data
    assert data["success"] is True
    assert "data" in data
    assert isinstance(data["data"], list)


def test_location_search_endpoint():
    """Test location search endpoint"""
    response = client.get("/api/v1/locations/search?query=New York&limit=5")
    assert response.status_code == 200
    data = response.json()
    
    assert "success" in data
    assert data["success"] is True
    assert "data" in data
    assert "total_results" in data


def test_monitoring_stations_endpoint():
    """Test monitoring stations endpoint"""
    response = client.get("/api/v1/locations/stations?latitude=40.7128&longitude=-74.0060&radius_km=50")
    assert response.status_code == 200
    data = response.json()
    
    assert "success" in data
    assert data["success"] is True
    assert "stations" in data
    assert "total_count" in data


def test_tempo_satellite_endpoint():
    """Test TEMPO satellite data endpoint"""
    response = client.get("/api/v1/satellite/tempo?latitude=40.7128&longitude=-74.0060")
    assert response.status_code == 200
    data = response.json()
    
    assert "success" in data
    assert data["success"] is True
    assert "data" in data


def test_tempo_coverage_endpoint():
    """Test TEMPO coverage endpoint"""
    response = client.get("/api/v1/satellite/tempo/coverage")
    assert response.status_code == 200
    data = response.json()
    
    assert "success" in data
    assert data["success"] is True
    assert "coverage" in data
    assert "parameters" in data


def test_services_status_endpoint():
    """Test services status endpoint"""
    response = client.get("/api/v1/services/status")
    assert response.status_code == 200
    data = response.json()
    
    assert "success" in data
    assert data["success"] is True
    assert "services" in data
    assert "timestamp" in data


def test_cache_clear_endpoint():
    """Test cache clear endpoint"""
    response = client.post("/api/v1/cache/clear")
    assert response.status_code == 200
    data = response.json()
    
    assert "success" in data
    assert data["success"] is True
    assert "message" in data


if __name__ == "__main__":
    # Run tests manually if executed directly
    test_root_endpoint()
    test_health_endpoint()
    test_api_health_endpoint()
    test_current_air_quality_endpoint()
    test_historical_air_quality_endpoint()
    test_location_search_endpoint()
    test_monitoring_stations_endpoint()
    test_tempo_satellite_endpoint()
    test_tempo_coverage_endpoint()
    test_services_status_endpoint()
    test_cache_clear_endpoint()
    
    print("✅ All frontend integration tests passed!")