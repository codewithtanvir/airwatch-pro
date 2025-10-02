# 🛗 AirWatch Pro - API Documentation

## 📋 Overview

AirWatch Pro provides a RESTful API for accessing real-time air quality data integrated from NASA TEMPO satellite observations, ground-based monitoring stations, and weather data. All endpoints return JSON responses and follow standard HTTP status codes.

**Base URL:** `https://airwatchprov1-fc9iucydc-tanvirrahman38s-projects.vercel.app/api`

## 🔐 Authentication

Currently, the API is publicly accessible for demonstration purposes. Future versions will implement API key authentication.

```javascript
// No authentication required for current version
fetch('https://airwatchprov1-fc9iucydc-tanvirrahman38s-projects.vercel.app/api/health')
```

## 📡 Endpoints

### Health Check

**GET** `/api/health`

Returns the current status of the API and connected services.

#### Response
```json
{
  "status": "operational",
  "timestamp": "2025-01-08T10:30:00Z",
  "version": "1.0.0",
  "services": {
    "nasa_tempo": "connected",
    "openweather": "connected",
    "database": "operational"
  },
  "uptime": "99.9%"
}
```

#### Status Codes
- `200 OK` - API is operational
- `503 Service Unavailable` - API is down or experiencing issues

---

### Air Quality Data

**GET** `/api/air-quality`

Retrieves comprehensive air quality data for a specific location, including current conditions, forecasts, and health recommendations.

#### Parameters

| Parameter | Type | Required | Description | Example |
|-----------|------|----------|-------------|---------|
| `lat` | number | Yes | Latitude coordinate | `40.7128` |
| `lon` | number | Yes | Longitude coordinate | `-74.0060` |
| `units` | string | No | Unit system (`metric`, `imperial`) | `metric` |
| `forecast` | boolean | No | Include 24-hour forecast | `true` |

#### Example Request
```bash
curl "https://airwatchprov1-fc9iucydc-tanvirrahman38s-projects.vercel.app/api/air-quality?lat=40.7128&lon=-74.0060&forecast=true"
```

#### Success Response (200 OK)
```json
{
  "location": {
    "latitude": 40.7128,
    "longitude": -74.0060,
    "city": "New York",
    "state": "NY",
    "country": "US",
    "timezone": "America/New_York"
  },
  "current": {
    "timestamp": "2025-01-08T10:30:00Z",
    "aqi": 85,
    "category": "Moderate",
    "color": "#FFFF00",
    "description": "Air quality is acceptable for most people. However, sensitive groups may experience minor health effects.",
    "pollutants": {
      "no2": {
        "value": 42.5,
        "unit": "µg/m³",
        "source": "TEMPO"
      },
      "pm25": {
        "value": 18.3,
        "unit": "µg/m³",
        "source": "ground_station"
      },
      "pm10": {
        "value": 28.7,
        "unit": "µg/m³",
        "source": "ground_station"
      },
      "o3": {
        "value": 67.8,
        "unit": "µg/m³",
        "source": "TEMPO"
      },
      "co": {
        "value": 0.8,
        "unit": "mg/m³",
        "source": "ground_station"
      },
      "so2": {
        "value": 5.2,
        "unit": "µg/m³",
        "source": "ground_station"
      }
    },
    "weather": {
      "temperature": 22.5,
      "humidity": 65,
      "wind_speed": 3.2,
      "wind_direction": 180,
      "pressure": 1013.25
    }
  },
  "forecast": [
    {
      "timestamp": "2025-01-08T11:00:00Z",
      "aqi": 88,
      "category": "Moderate",
      "confidence": 0.85
    },
    // ... 23 more hourly forecasts
  ],
  "health_recommendations": {
    "general_public": "Air quality is acceptable. Enjoy outdoor activities.",
    "sensitive_groups": "Consider reducing prolonged outdoor exertion if experiencing symptoms.",
    "vulnerable_populations": "Limit outdoor activities if experiencing breathing difficulties."
  },
  "data_sources": {
    "satellite": ["NASA TEMPO", "MODIS"],
    "ground_stations": ["EPA AirNow", "OpenAQ"],
    "weather": ["OpenWeather API"]
  },
  "last_updated": "2025-01-08T10:30:00Z"
}
```

#### Error Response (400 Bad Request)
```json
{
  "error": "invalid_parameters",
  "message": "Invalid latitude or longitude coordinates",
  "details": {
    "latitude": "Must be between -90 and 90",
    "longitude": "Must be between -180 and 180"
  }
}
```

#### Error Response (404 Not Found)
```json
{
  "error": "location_not_found",
  "message": "No air quality data available for this location",
  "details": {
    "latitude": 40.7128,
    "longitude": -74.0060,
    "reason": "Location outside TEMPO satellite coverage area"
  }
}
```

---

### Historical Data

**GET** `/api/air-quality/historical`

Retrieves historical air quality data for trend analysis and comparison.

#### Parameters

| Parameter | Type | Required | Description | Example |
|-----------|------|----------|-------------|---------|
| `lat` | number | Yes | Latitude coordinate | `40.7128` |
| `lon` | number | Yes | Longitude coordinate | `-74.0060` |
| `start_date` | string | Yes | Start date (ISO 8601) | `2025-01-01T00:00:00Z` |
| `end_date` | string | Yes | End date (ISO 8601) | `2025-01-07T23:59:59Z` |
| `interval` | string | No | Data interval (`hourly`, `daily`) | `daily` |

#### Example Request
```bash
curl "https://airwatchprov1-fc9iucydc-tanvirrahman38s-projects.vercel.app/api/air-quality/historical?lat=40.7128&lon=-74.0060&start_date=2025-01-01T00:00:00Z&end_date=2025-01-07T23:59:59Z"
```

#### Success Response (200 OK)
```json
{
  "location": {
    "latitude": 40.7128,
    "longitude": -74.0060,
    "city": "New York"
  },
  "period": {
    "start": "2025-01-01T00:00:00Z",
    "end": "2025-01-07T23:59:59Z",
    "interval": "daily"
  },
  "data": [
    {
      "date": "2025-01-01",
      "aqi": 67,
      "category": "Moderate",
      "pollutants": {
        "no2": 38.2,
        "pm25": 15.7,
        "o3": 72.1
      }
    },
    // ... more daily records
  ],
  "statistics": {
    "average_aqi": 73.2,
    "max_aqi": 95,
    "min_aqi": 52,
    "days_unhealthy": 0,
    "trend": "improving"
  }
}
```

---

### Alerts & Notifications

**GET** `/api/alerts`

Retrieves active air quality alerts for a specific location.

#### Parameters

| Parameter | Type | Required | Description | Example |
|-----------|------|----------|-------------|---------|
| `lat` | number | Yes | Latitude coordinate | `40.7128` |
| `lon` | number | Yes | Longitude coordinate | `-74.0060` |
| `radius` | number | No | Alert radius in km | `25` |

#### Success Response (200 OK)
```json
{
  "location": {
    "latitude": 40.7128,
    "longitude": -74.0060
  },
  "active_alerts": [
    {
      "id": "alert_123456",
      "type": "air_quality_advisory",
      "severity": "moderate",
      "title": "Air Quality Advisory",
      "description": "Elevated ozone levels expected this afternoon",
      "start_time": "2025-01-08T14:00:00Z",
      "end_time": "2025-01-08T20:00:00Z",
      "affected_area": {
        "center": [40.7128, -74.0060],
        "radius_km": 50
      },
      "recommendations": [
        "Limit prolonged outdoor activities",
        "Keep windows closed during peak hours",
        "Use air purifiers indoors"
      ]
    }
  ],
  "count": 1
}
```

---

## 📊 Data Models

### AQI Categories

| AQI Range | Category | Color | Description |
|-----------|----------|-------|-------------|
| 0-50 | Good | Green | Air quality is satisfactory |
| 51-100 | Moderate | Yellow | Acceptable for most people |
| 101-150 | Unhealthy for Sensitive Groups | Orange | Sensitive groups may experience health effects |
| 151-200 | Unhealthy | Red | Everyone may experience health effects |
| 201-300 | Very Unhealthy | Purple | Health warnings of emergency conditions |
| 301+ | Hazardous | Maroon | Health alert: everyone may experience serious effects |

### Pollutant Standards

| Pollutant | Full Name | WHO Guideline | Unit |
|-----------|-----------|---------------|------|
| NO₂ | Nitrogen Dioxide | 25 µg/m³ | µg/m³ |
| PM2.5 | Fine Particulate Matter | 15 µg/m³ | µg/m³ |
| PM10 | Particulate Matter | 45 µg/m³ | µg/m³ |
| O₃ | Ozone | 100 µg/m³ | µg/m³ |
| CO | Carbon Monoxide | 30 mg/m³ | mg/m³ |
| SO₂ | Sulfur Dioxide | 40 µg/m³ | µg/m³ |

## 🔧 Error Handling

### Standard Error Response Format
```json
{
  "error": "error_code",
  "message": "Human-readable error description",
  "details": {
    "additional": "context information"
  },
  "timestamp": "2025-01-08T10:30:00Z",
  "request_id": "req_123456789"
}
```

### Common Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `invalid_parameters` | 400 | Invalid request parameters |
| `location_not_found` | 404 | No data available for location |
| `rate_limit_exceeded` | 429 | Too many requests |
| `service_unavailable` | 503 | External service unavailable |
| `internal_error` | 500 | Server error |

## 📈 Rate Limiting

Current limits for public API access:
- **100 requests per hour** per IP address
- **1000 requests per day** per IP address

Rate limit headers included in responses:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 87
X-RateLimit-Reset: 1641654321
```

## 🔄 Data Freshness

| Data Source | Update Frequency | Latency |
|-------------|------------------|---------|
| NASA TEMPO | Hourly | 2-3 hours |
| Ground Stations | 15 minutes | 5-10 minutes |
| Weather Data | 10 minutes | 1-2 minutes |
| Forecasts | 6 hours | N/A |

## 📱 Client Libraries

### JavaScript/TypeScript
```javascript
// Example using fetch API
const getAirQuality = async (lat, lon) => {
  const response = await fetch(
    `https://airwatchprov1-fc9iucydc-tanvirrahman38s-projects.vercel.app/api/air-quality?lat=${lat}&lon=${lon}`
  );
  return await response.json();
};

// Usage
const data = await getAirQuality(40.7128, -74.0060);
console.log(`Current AQI: ${data.current.aqi}`);
```

### Python
```python
import requests

def get_air_quality(lat, lon):
    url = f"https://airwatchprov1-fc9iucydc-tanvirrahman38s-projects.vercel.app/api/air-quality"
    params = {"lat": lat, "lon": lon}
    response = requests.get(url, params=params)
    return response.json()

# Usage
data = get_air_quality(40.7128, -74.0060)
print(f"Current AQI: {data['current']['aqi']}")
```

## 🛡️ Security & Privacy

### Data Protection
- No personal data is stored or logged
- Location data is not persisted beyond request processing
- All communications use HTTPS encryption

### CORS Policy
- Allows all origins for public API access
- Preflight requests supported for complex queries

## 📞 Support & Contact

- **Documentation Issues**: [GitHub Issues](https://github.com/codewithtanvir/airwatch-pro/issues)
- **API Support**: tanvirrahman38@gmail.com
- **Feature Requests**: [GitHub Discussions](https://github.com/codewithtanvir/airwatch-pro/discussions)

---

**🌟 Real-time air quality data powered by NASA TEMPO satellite observations for protecting public health worldwide.**