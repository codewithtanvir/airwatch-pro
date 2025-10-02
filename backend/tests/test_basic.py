"""
Basic tests for the new modular backend structure
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
    assert "status" in data


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
    assert data["service"] == "airwatch-pro"


def test_air_quality_current_endpoint():
    """Test the current air quality endpoint"""
    response = client.get("/api/v1/air-quality/current")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)


def test_locations_endpoint():
    """Test the locations endpoint"""
    response = client.get("/api/v1/locations/")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)