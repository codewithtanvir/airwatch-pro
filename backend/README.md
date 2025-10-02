# AirWatch Pro Backend - Modular Architecture

A modern, modular FastAPI backend for air quality monitoring and prediction.

## Architecture Overview

```
backend/
├── app/                    # Main application package
│   ├── __init__.py
│   ├── main.py            # FastAPI application entry point
│   ├── api/               # API routes and endpoints
│   │   ├── __init__.py
│   │   └── v1/            # API version 1
│   │       ├── __init__.py
│   │       ├── api.py     # Main API router
│   │       └── endpoints/ # Individual endpoint modules
│   │           ├── __init__.py
│   │           ├── air_quality.py
│   │           ├── health.py
│   │           └── locations.py
│   ├── core/              # Core application configuration
│   │   ├── __init__.py
│   │   ├── config.py      # Settings and configuration
│   │   └── logging.py     # Logging setup
│   ├── services/          # External API integrations
│   │   ├── __init__.py
│   │   ├── base_service.py    # Abstract base service
│   │   ├── epa_service.py     # EPA AirNow integration
│   │   ├── openaq_service.py  # OpenAQ integration
│   │   └── service_manager.py # Service orchestration
│   ├── models/            # Data models and schemas
│   │   └── __init__.py
│   ├── utils/             # Utility functions
│   │   └── __init__.py
│   └── db/               # Database configuration
│       └── __init__.py
├── tests/                # Test suite
│   ├── __init__.py
│   └── test_basic.py
├── scripts/              # Utility scripts
├── requirements.txt      # Python dependencies
├── .env.example         # Environment variables template
├── start_server.py      # Server startup script
└── README.md           # This file
```

## Features

- **Modular Design**: Clean separation of concerns with organized modules
- **Multiple Data Sources**: EPA AirNow, OpenAQ integration
- **Async/Await**: Fully asynchronous for better performance
- **Service Manager**: Centralized management of external APIs
- **Health Monitoring**: Comprehensive health checks for all services
- **Environment Configuration**: Flexible configuration via environment variables
- **Logging**: Structured logging with configurable levels
- **Testing**: Comprehensive test suite with pytest

## Quick Start

### 1. Environment Setup

```bash
# Copy environment template
copy .env.example .env

# Edit .env with your configuration
# Required: SUPABASE_URL, SUPABASE_ANON_KEY, EPA_API_EMAIL
```

### 2. Install Dependencies

```bash
# Create virtual environment (recommended)
python -m venv venv
venv\Scripts\activate  # Windows
# source venv/bin/activate  # Linux/Mac

# Install dependencies
pip install -r requirements.txt
```

### 3. Run the Server

```bash
# Using the startup script
python start_server.py

# Or directly with uvicorn
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 4. Test the API

Visit http://localhost:8000 to see the API documentation.

**Available Endpoints:**
- `GET /` - Root endpoint with basic info
- `GET /health` - Simple health check
- `GET /api/v1/health/` - Detailed health check
- `GET /api/v1/air-quality/current` - Current air quality data
- `GET /api/v1/locations/` - Monitoring locations

## API Documentation

Once running, visit:
- **Interactive Docs**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc
- **OpenAPI Schema**: http://localhost:8000/api/v1/openapi.json

## Configuration

Key environment variables:

| Variable | Required | Description |
|----------|----------|-------------|
| `SUPABASE_URL` | Yes | Your Supabase project URL |
| `SUPABASE_ANON_KEY` | Yes | Supabase anonymous key |
| `EPA_API_EMAIL` | Yes | Email for EPA AirNow API |
| `DEBUG` | No | Enable debug mode (default: False) |
| `LOG_LEVEL` | No | Logging level (default: INFO) |

## Development

### Running Tests

```bash
# Install test dependencies
pip install pytest pytest-asyncio

# Run tests
pytest tests/
```

### Code Quality

```bash
# Install development tools
pip install black isort flake8

# Format code
black app/
isort app/

# Lint code
flake8 app/
```

## Service Integration

### EPA AirNow
- **Purpose**: US air quality data and forecasts
- **Authentication**: Email-based API key
- **Coverage**: United States

### OpenAQ
- **Purpose**: Global air quality data
- **Authentication**: None (public API)
- **Coverage**: Worldwide

### Future Services
- NASA TEMPO satellite data
- Additional regional APIs
- Custom data sources

## Deployment

The application is designed for easy deployment on various platforms:

- **Docker**: Containerized deployment
- **Cloud Services**: AWS, GCP, Azure
- **Serverless**: Vercel, Netlify Functions
- **Traditional**: VPS, dedicated servers

## Contributing

1. Follow the modular architecture patterns
2. Add tests for new features
3. Update documentation
4. Use type hints for better code quality
5. Follow the established logging patterns

## License

MIT License - see LICENSE file for details.