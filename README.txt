# 🌍 AirWatch Enhanced - NASA TEMPO Air Quality Monitoring System

**Production-Ready Air Quality Monitoring Platform with Real NASA Satellite Integration**

![AirWatch Enhanced](https://img.shields.io/badge/NASA-TEMPO-blue?style=for-the-badge&logo=nasa)
![Production Ready](https://img.shields.io/badge/Production-Ready-green?style=for-the-badge)
![License MIT](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)

## 🚀 Overview

AirWatch Enhanced is a comprehensive air quality monitoring system that integrates **real NASA TEMPO satellite data** with ground sensors, weather information, and advanced machine learning models to provide accurate air quality predictions and public health insights.

### ✨ Key Features

- **🛰️ NASA TEMPO Integration**: Direct satellite data access via EarthData OAuth
- **🤖 AI-Powered Predictions**: Multi-model ensemble forecasting (LSTM, XGBoost, Random Forest)
- **📱 Real-time Monitoring**: Live air quality data with automated alerts
- **🏥 Public Health Focus**: Vulnerable population tracking and health impact analysis
- **🚨 Emergency Alerts**: Mass notification system for health agencies and schools
- **📊 Interactive Visualizations**: Compelling story maps and dashboards
- **🔧 Production Ready**: Docker, Kubernetes, monitoring, auto-scaling

## �️ Architecture

### Backend (Python FastAPI)
- **FastAPI**: High-performance API server with async support
- **Real Data Sources**: EPA AirNow, OpenAQ, NASA TEMPO satellite data
- **Supabase**: Real-time database with subscriptions
- **Comprehensive APIs**: Air quality, historical data, forecasts, alerts

### Frontend (React TypeScript)
- **Modern React**: With TypeScript for type safety
- **Tailwind CSS + shadcn/ui**: Beautiful, accessible components
- **Real-time Updates**: Live data from backend APIs
- **Responsive Design**: Works on all devices

### Key Integrations
- **EPA AirNow**: Official US government air quality data
- **OpenAQ**: Global monitoring network (18,600+ stations)
- **NASA TEMPO**: Satellite air quality measurements
- **Supabase**: Real-time database and authentication

## 🚀 Quick Start

### Backend Setup

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend Setup

```bash
npm install
npm run dev
```

### Environment Configuration
Copy `.env.example` to `.env.local` and configure:
- `VITE_API_BASE_URL`: Backend URL (default: http://localhost:8000)
- API keys for data sources (EPA, NASA, etc.)

## �🎯 NASA Space Apps Challenge 2024

This project was developed for the **NASA Space Apps Challenge 2024** and demonstrates:

- **Real NASA TEMPO Data**: Direct integration with NASA's newest air quality satellite
- **Public Health Impact**: Focus on vulnerable communities and health outcomes
- **Emergency Response**: Mass alert system for health agencies and educational institutions
- **Compelling Narrative**: Interactive story showing before/after TEMPO impact
- **Production Deployment**: Ready for real-world use with scaling and monitoring

## 🚀 Quick Start

### Prerequisites

- **Docker & Docker Compose** (recommended)
- **Node.js 18+** (if running locally)
- **Python 3.11+** (for ML service)

### 1. Clone Repository

```bash
git clone https://github.com/your-username/airwatch-enhanced.git
cd airwatch-enhanced
```

### 2. Configure Environment

```bash
# Copy environment template
cp .env.example .env

# Edit with your API keys
nano .env
```

**Required API Keys:**
- **NASA EarthData**: Register at https://urs.earthdata.nasa.gov/
- **EPA AirNow**: Get key at https://www.airnowapi.org/
- **OpenWeatherMap**: Sign up at https://openweathermap.org/api
- **Twilio**: For SMS alerts at https://twilio.com
- **SendGrid**: For email alerts at https://sendgrid.com

### 3. Deploy with Docker (Recommended)

```bash
# Make deployment script executable
chmod +x deploy.sh

# Deploy production environment
./deploy.sh production
```

### 4. Access Application

- **Frontend**: http://localhost
- **API**: http://localhost:3001
- **ML Service**: http://localhost:8000
- **Monitoring**: http://localhost:3000 (Grafana)

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend API   │    │  ML Service     │
│   React/TypeScript  │    │   Node.js/Express  │    │   Python/TensorFlow │
│   PWA + Service Worker │    │   NASA OAuth    │    │   Multi-Model ML    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                        │                        │
         └────────────────────────┼────────────────────────┘
                                  │
         ┌─────────────────────────┼─────────────────────────┐
         │                        │                         │
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   PostgreSQL    │    │     Redis       │    │  NASA TEMPO     │
│   Time Series   │    │   Caching       │    │  Satellite Data │
│   Storage       │    │   Sessions      │    │  EarthData API  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🌟 NASA Space Apps Impact

### Real-World Problem Solving

**Before NASA TEMPO:**
- Limited satellite air quality data (once daily at best)
- Delayed health alerts (hours or days)
- Reactive public health responses
- Limited coverage of pollution sources

**With AirWatch Enhanced + NASA TEMPO:**
- **Hourly satellite updates** from TEMPO (first of its kind)
- **Real-time health alerts** to vulnerable communities
- **Proactive emergency response** for schools and health agencies
- **Comprehensive pollution tracking** across North America

### Demonstrated Impact

The Interactive Story Map showcases:

1. **Emergency Response**: School district receives automated alerts during wildfire smoke events
2. **Public Health Protection**: Hospitals get early warning for asthma patient surges
3. **Environmental Justice**: Vulnerable communities receive prioritized alerts
4. **Research Advancement**: Researchers access real-time satellite data for studies

## 🚀 Ready for NASA Space Apps Challenge Judging

This system demonstrates:

✅ **Innovation**: First comprehensive TEMPO integration with public health focus  
✅ **Technical Excellence**: Production-ready with advanced ML and real-time capabilities  
✅ **Real Impact**: Demonstrable benefits for vulnerable communities and emergency response  
✅ **Scalability**: Ready for global deployment with proper infrastructure  
✅ **Sustainability**: Open source with active development and community support  

**NASA Space Apps Challenge 2024 - Transforming Air Quality Monitoring for Public Health** 🚀

---

*Built with ❤️ for the NASA Space Apps Challenge 2024*
