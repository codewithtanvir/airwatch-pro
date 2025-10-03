# AirWatch Pro Backend – Modular FastAPI Service

[![FastAPI](https://img.shields.io/badge/FastAPI-0.103+-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![Python](https://img.shields.io/badge/Python-3.11+-3776AB?logo=python&logoColor=white)](https://www.python.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](../LICENSE)
[![Tests](https://img.shields.io/badge/Tests-Pytest-blue)](./tests)

A modern, modular FastAPI backend powering air quality monitoring, multi‑source data ingestion, and health intelligence services for AirWatch Pro.

---
## Table of Contents
- [Architecture Overview](#architecture-overview)
- [Features](#features)
- [Quick Start](#quick-start)
- [Configuration](#configuration)
- [API Documentation](#api-documentation)
- [API Examples](#api-examples)
- [Development](#development)
- [Service Integration](#service-integration)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)

---
## Architecture Overview
```text
backend/
├── app/
│   ├── __init__.py
│   ├── main.py                 # FastAPI application entry
│   ├── api/
│   │   ├── __init__.py
│   │   └── v1/
│   │       ├── __init__.py
│   │       ├── api.py          # Root API router
│   │       └── endpoints/
│   │           ├── __init__.py
│   │           ├── air_quality.py
│   │           ├── health.py
│   │           └── locations.py
│   ├── core/                   # Config & logging
│   │   ├── __init__.py
│   │   ├── config.py
│   │   └── logging.py
│   ├── services/               # External API integrations
│   │   ├── __init__.py
│   │   ├── base_service.py
│   │   ├── epa_service.py
│   │   ├── openaq_service.py
│   │   └── service_manager.py
│   ├── models/
│   │   └── __init__.py
│   ├── utils/
│   │   └── __init__.py
│   └── db/
│       └── __init__.py
├── tests/
│   ├── __init__.py
│   └── test_basic.py
├── scripts/
├── requirements.txt
├── .env.example
├── start_server.py
└── README.md
```

## Features
- **Modular Design** – Clear separation of concerns
- **Async I/O** – Non‑blocking FastAPI + HTTP clients
- **Multi‑Source Data** – EPA AirNow + OpenAQ (extensible)
- **Service Manager** – Central orchestration of provider services
- **Health Monitoring** – Aggregate and per‑service health endpoints
- **Structured Logging** – Configurable levels & formats
- **Environment Driven** – `.env` / environment variable configuration
- **Test Coverage** – Pytest suite for core endpoints & services

---
## Quick Start
### 1. Environment Setup
```bash
# Windows (PowerShell)
copy .env.example .env
# macOS / Linux
cp .env.example .env

# Edit .env and set required values (see table below)
```

### 2. Create & Activate Virtual Environment
```bash
python -m venv venv
# Windows
venv\Scripts\activate
# macOS/Linux
# source venv/bin/activate
```

### 3. Install Dependencies
```bash
pip install --upgrade pip
pip install -r requirements.txt
```

### 4. Run the Server (Development)
```bash
# Option A: helper script
python start_server.py

# Option B: direct uvicorn
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 5. Verify
Open: http://localhost:8000/docs

---
## Configuration
Create `.env` (or export env vars in deployment). Required keys marked Yes.

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `SUPABASE_URL` | Yes | — | Supabase project URL |
| `SUPABASE_ANON_KEY` | Yes | — | Supabase anonymous key |
| `SUPABASE_SERVICE_KEY` | No | — | Service role key (admin ops) |
| `EPA_API_EMAIL` | Yes | — | Email registered for EPA AirNow API |
| `NASA_API_KEY` | No | — | Future NASA TEMPO integration |
| `DEBUG` | No | `False` | Enable debug mode |
| `LOG_LEVEL` | No | `INFO` | Logging verbosity |
| `CACHE_TTL` | No | `300` | Cache time (seconds) |
| `RATE_LIMIT_PER_MINUTE` | No | `60` | Simple in‑memory rate limit |

### Example `.env` Snippet
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=optional-service-role
EPA_API_EMAIL=you@example.com
NASA_API_KEY=optional-nasa-key
DEBUG=False
LOG_LEVEL=INFO
CACHE_TTL=300
RATE_LIMIT_PER_MINUTE=60
```

---
## API Documentation
Available automatically when running:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc
- OpenAPI JSON: http://localhost:8000/api/v1/openapi.json

Root & health:
- `GET /` – Root metadata
- `GET /health` – Basic liveness
- `GET /api/v1/health/` – Detailed service health

Domain endpoints:
- `GET /api/v1/air-quality/current` – Current aggregated AQ data
- `GET /api/v1/locations/` – List available monitoring locations

---
## API Examples
### Get Current Air Quality
```bash
curl -s http://localhost:8000/api/v1/air-quality/current | jq
```
Example (truncated):
```json
{
  "status": "ok",
  "timestamp": "2025-10-03T12:30:00Z",
  "sources": [
    {"provider": "epa_airnow", "aqi": 42, "pm25": 8.1},
    {"provider": "openaq", "aqi": 45, "pm25": 7.9}
  ],
  "composite": { "aqi": 43, "category": "Good" }
}
```

### Service Health
```bash
curl -s http://localhost:8000/api/v1/health/ | jq
```
```json
{
  "status": "healthy",
  "services": {
    "epa_airnow": "ok",
    "openaq": "ok"
  }
}
```

### Locations
```bash
curl -s "http://localhost:8000/api/v1/locations/" | jq
```
```json
[
  {"id": "nyc", "name": "New York City", "country": "US"},
  {"id": "la", "name": "Los Angeles", "country": "US"}
]
```

---
## Development
### Tests
```bash
pip install pytest pytest-asyncio
pytest -q
```

### Code Quality & Formatting
```bash
pip install black isort flake8
black app/
isort app/
flake8 app/
```

### Run with Auto-Reload & Log Level
```bash
LOG_LEVEL=DEBUG uvicorn app.main:app --reload
```
(Windows PowerShell)
```powershell
$env:LOG_LEVEL='DEBUG'; uvicorn app.main:app --reload
```

---
## Service Integration
### EPA AirNow
- Purpose: US air quality data & forecasts
- Auth: Email-based key
- Coverage: United States

### OpenAQ
- Purpose: Global community air quality data
- Auth: Public (no key)
- Coverage: Worldwide

### Planned / Extensible
- NASA TEMPO satellite (processing pipeline integration)
- Additional regional pollutant networks
- Custom research data feeds

---
## Deployment
### Production Uvicorn / Gunicorn Example
```bash
pip install gunicorn uvicorn
# Simple (Linux)
uvicorn app.main:app --host 0.0.0.0 --port 8000
# Gunicorn workers (example)
gunicorn -k uvicorn.workers.UvicornWorker app.main:app -w 4 -b 0.0.0.0:8000
```

### (Optional) Minimal Dockerfile (pseudo)
```dockerfile
# syntax=docker/dockerfile:1
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY app ./app
EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Health / Readiness
- Liveness: `GET /health`
- Readiness: `GET /api/v1/health/`

---
## Contributing
1. Follow modular patterns (services keep provider logic isolated)
2. Add or update tests for all new functionality
3. Maintain type hints & docstrings
4. Keep logging structured & meaningful
5. Update README / docs for new env vars or endpoints

---
## License
MIT License – see [LICENSE](../LICENSE) for details.

---
> Part of the broader **AirWatch Pro** platform (frontend PWA + satellite data integration). Future roadmap: NASA TEMPO ingestion, predictive modeling, advanced caching.