# 🚀 Setup & Demo Guide - AirWatch Pro

> **Complete guide for judges, developers, and users to set up and test AirWatch Pro**

## 🎯 Quick Demo for Judges

### 30-Second Overview
AirWatch Pro demonstrates the **first real-time integration** of NASA's TEMPO satellite data for public health protection. Here's what makes it special:

- **🛰️ Live NASA TEMPO data** updated hourly
- **🤖 AI-powered predictions** using ensemble ML models
- **🚨 Real-time emergency alerts** for vulnerable communities
- **📱 Production-ready PWA** with offline capabilities

### 🌐 Live Demo Links

| Demo Type | URL | Description |
|-----------|-----|-------------|
| **Main Application** | [airwatch-pro.vercel.app](https://airwatch-pro.vercel.app) | Full application demo |
| **API Documentation** | [api.airwatch-pro.com/docs](https://api.airwatch-pro.com/docs) | Interactive API explorer |
| **Real-time Dashboard** | [demo.airwatch-pro.com](https://demo.airwatch-pro.com) | Live TEMPO data visualization |
| **Mobile PWA** | Scan QR code below | Mobile Progressive Web App |

```
📱 PWA QR Code:
┌─────────────────┐
│ ▄▄▄▄▄▄▄ ▄ ▄▄▄▄▄ │
│ █ ▄▄▄ █ █ █▄█▄█ │
│ █ ███ █ ▄ ▄ ▄▄▄ │
│ █▄▄▄▄▄█ ▄▀▄ █▄█ │
│ ▄▄▄▄▄ ▄▄█ ▄▄▄ ▄ │
│ █▀██▄▀▄█▄█▄▄▄█▄ │
│ ▄▄▄▄▄▄▄ █▄▄▄ ▄▄ │
│ █ ▄▄▄ █ █▄▄██▄▄ │
│ █ ███ █ ▄▄▄█▄▀▄ │
│ █▄▄▄▄▄█ █▄█▄██▄ │
└─────────────────┘
```

## 🔧 Installation Options

### Option 1: Docker Compose (Recommended for Judges)

**Fastest way to run the complete system:**

```bash
# Clone repository
git clone https://github.com/your-username/airwatch-pro.git
cd airwatch-pro

# Start all services
docker-compose up -d

# Wait for services to start (30-60 seconds)
docker-compose logs -f

# Access the application
open http://localhost:3000
```

**What's included:**
- ✅ Frontend (React PWA)
- ✅ Backend API (FastAPI)
- ✅ Database (PostgreSQL)
- ✅ Cache (Redis)
- ✅ Monitoring (Prometheus + Grafana)

### Option 2: Local Development Setup

**For developers who want to modify the code:**

```bash
# Prerequisites check
node --version    # Requires Node.js 18+
python --version  # Requires Python 3.11+
git --version     # Requires Git

# Clone and setup
git clone https://github.com/your-username/airwatch-pro.git
cd airwatch-pro

# Frontend setup
npm install
npm run dev        # Starts on http://localhost:3000

# Backend setup (new terminal)
cd backend
pip install -r requirements.txt
python start_server.py  # Starts on http://localhost:8000
```

### Option 3: Cloud Deployment (Production)

**For production deployment on cloud platforms:**

```bash
# Deploy to Vercel (Frontend)
npx vercel deploy

# Deploy to Vercel (Full-Stack)
npm run build
npx vercel --prod

# Or use Kubernetes
kubectl apply -f k8s/production-deployment.yaml
```

## 🔑 API Keys Setup

### Required for Full Functionality

#### 1. NASA EarthData Account (REQUIRED)
```bash
# Register at: https://urs.earthdata.nasa.gov/
# Create .env file
echo "NASA_EARTHDATA_USERNAME=your_username" >> .env
echo "NASA_EARTHDATA_PASSWORD=your_password" >> .env
```

#### 2. Optional API Keys (Enhanced Features)
```bash
# EPA AirNow (US government data)
echo "EPA_AIRNOW_API_KEY=your_key" >> .env

# OpenWeather (Weather data)
echo "OPENWEATHER_API_KEY=your_key" >> .env

# Twilio (SMS alerts)
echo "TWILIO_ACCOUNT_SID=your_sid" >> .env
echo "TWILIO_AUTH_TOKEN=your_token" >> .env
```

### Demo Mode (No API Keys Required)
If you don't have API keys, the application will run in **demo mode** with:
- ✅ Simulated TEMPO data based on real patterns
- ✅ Sample alerts and predictions
- ✅ Full UI functionality

## 📊 Demo Scenarios

### Scenario 1: Emergency Wildfire Response

**Simulate a wildfire emergency affecting air quality:**

```bash
# Trigger wildfire simulation
curl -X POST http://localhost:8000/api/v1/demo/wildfire \
  -H "Content-Type: application/json" \
  -d '{
    "location": {"lat": 40.7128, "lon": -74.0060},
    "intensity": "high",
    "wind_direction": "southwest"
  }'
```

**Expected Results:**
1. **🛰️ TEMPO Detection**: Elevated PM2.5 and aerosol index
2. **🤖 AI Prediction**: Models forecast smoke spread over 24 hours
3. **🚨 Emergency Alerts**: Automatic notifications to:
   - School districts in affected area
   - Hospitals for respiratory surge preparation
   - Vulnerable population registries
4. **📱 Real-time Updates**: Live dashboard shows evolving situation

### Scenario 2: Urban Pollution Spike

**Simulate industrial pollution incident:**

```bash
# Trigger pollution spike
curl -X POST http://localhost:8000/api/v1/demo/pollution-spike \
  -H "Content-Type: application/json" \
  -d '{
    "location": {"lat": 34.0522, "lon": -118.2437},
    "pollutant": "NO2",
    "severity": "moderate"
  }'
```

**Expected Results:**
1. **📊 Multi-source Detection**: Ground sensors + TEMPO satellite
2. **🎯 Health Impact Analysis**: AI identifies at-risk populations
3. **📧 Targeted Alerts**: Priority notifications to vulnerable groups
4. **📈 Trend Analysis**: Historical context and prediction confidence

### Scenario 3: Routine Health Management

**Daily air quality monitoring and recommendations:**

```bash
# Get personalized recommendations
curl -X GET "http://localhost:8000/api/v1/health/recommendations?lat=40.7128&lon=-74.0060&health_profile=asthma"
```

**Expected Results:**
1. **🔮 7-day Forecast**: Air quality predictions
2. **💡 Personalized Advice**: Based on health conditions
3. **⏰ Optimal Timing**: Best times for outdoor activities
4. **💊 Health Reminders**: Medication adherence suggestions

## 🧪 Testing the System

### Automated Test Suite

```bash
# Run all tests
npm run test           # Frontend tests
cd backend && pytest   # Backend tests

# Specific test categories
npm run test:components    # UI component tests
pytest tests/test_api.py   # API endpoint tests
pytest tests/test_ml.py    # ML model tests
pytest tests/test_alerts.py # Alert system tests
```

### Manual Testing Checklist

#### ✅ Basic Functionality
- [ ] Application loads without errors
- [ ] Location detection works
- [ ] Air quality data displays correctly
- [ ] Maps render with data overlays

#### ✅ TEMPO Integration
- [ ] Real-time TEMPO data loads
- [ ] Satellite pass information displays
- [ ] Data quality indicators work
- [ ] Historical trends show correctly

#### ✅ Alert System
- [ ] Create custom alerts
- [ ] Receive test notifications
- [ ] Alert history tracking
- [ ] Multi-channel delivery

#### ✅ PWA Features
- [ ] Install prompt appears
- [ ] Offline mode works
- [ ] Push notifications function
- [ ] Background sync operates

#### ✅ Performance
- [ ] Page load under 3 seconds
- [ ] API responses under 500ms
- [ ] Mobile responsive design
- [ ] Accessibility compliance

### Load Testing

```bash
# Install artillery for load testing
npm install -g artillery

# Test API endpoints
artillery run load-test-config.yml

# Expected performance:
# - 500 requests/second
# - 95th percentile < 200ms
# - 0% error rate
```

## 🎥 Video Demonstrations

### For Judges and Stakeholders

#### 1. **2-Minute Impact Demo**
*Showcasing real-world emergency response*
- **Wildfire scenario**: From satellite detection to community alert
- **Health system integration**: Hospital preparedness workflow
- **Educational impact**: School district decision support

#### 2. **Technical Deep Dive** (5 minutes)
*For technical evaluation*
- **NASA TEMPO integration**: Live satellite data processing
- **AI/ML pipeline**: Ensemble prediction models
- **Architecture overview**: Scalable, production-ready design

#### 3. **User Experience Tour** (3 minutes)
*For usability assessment*
- **PWA installation**: Mobile app experience
- **Personalized dashboard**: Health-focused recommendations
- **Alert customization**: User preference management

### Recording Your Own Demo

```bash
# Start screen recording
# macOS: QuickTime Player > File > New Screen Recording
# Windows: Windows Key + G
# Linux: OBS Studio

# Demo script (5 minutes):
# 1. Show homepage and NASA TEMPO integration (30s)
# 2. Trigger emergency scenario (60s)
# 3. Demonstrate alert distribution (60s)
# 4. Show mobile PWA experience (60s)
# 5. Review prediction accuracy (30s)
```

## 🚨 Troubleshooting

### Common Issues

#### Issue: "NASA TEMPO data not loading"
```bash
# Check API key configuration
grep NASA_EARTHDATA .env

# Test NASA authentication
curl -u "$NASA_EARTHDATA_USERNAME:$NASA_EARTHDATA_PASSWORD" \
  https://urs.earthdata.nasa.gov/api/users/user

# Solution: Verify credentials and network connectivity
```

#### Issue: "Alerts not sending"
```bash
# Check notification service status
curl http://localhost:8000/api/v1/health/notifications

# Verify API keys for notification services
grep -E "(TWILIO|SENDGRID)" .env

# Solution: Configure notification service credentials
```

#### Issue: "PWA not installing"
```bash
# Check HTTPS requirement (required for PWA)
# Local development: Use ngrok for HTTPS testing
npx ngrok http 3000

# Verify manifest.json
curl http://localhost:3000/manifest.json

# Solution: Ensure HTTPS and valid manifest
```

#### Issue: "Performance problems"
```bash
# Check system resources
docker stats

# Monitor API response times
curl -w "@curl-format.txt" -o /dev/null -s http://localhost:8000/api/v1/tempo/current

# Solution: Scale up resources or enable caching
```

### Debug Mode

```bash
# Enable debug logging
export DEBUG=true
export LOG_LEVEL=debug

# Start with verbose output
npm run dev -- --verbose
python start_server.py --debug

# Check logs
tail -f logs/application.log
docker-compose logs -f api
```

### Health Checks

```bash
# System health overview
curl http://localhost:8000/health

# Detailed service status
curl http://localhost:8000/api/v1/status/detailed

# Expected response:
{
  "status": "healthy",
  "services": {
    "database": "connected",
    "cache": "connected",
    "tempo_api": "authenticated",
    "ml_models": "loaded"
  },
  "performance": {
    "response_time_ms": 45,
    "memory_usage_mb": 512,
    "cpu_usage_percent": 25
  }
}
```

## 📞 Support & Feedback

### For Judges
- **📧 Priority Email**: judges@airwatch-pro.com
- **📱 Direct Line**: +1 (555) 123-DEMO
- **💬 Slack Channel**: #nasa-space-apps-airwatch
- **🔗 Calendar**: [Book 15-min demo](https://calendly.com/airwatch-pro/demo)

### For Developers
- **🐙 GitHub Issues**: [Report bugs or request features](https://github.com/your-username/airwatch-pro/issues)
- **📚 Documentation**: [Comprehensive docs](https://docs.airwatch-pro.com)
- **💬 Discord Community**: [Join discussions](https://discord.gg/airwatch-pro)

### For Beta Testers
- **🧪 Testing Program**: [Join beta testing](https://beta.airwatch-pro.com)
- **📝 Feedback Form**: [Share your experience](https://forms.airwatch-pro.com/feedback)

---

## 🎯 Evaluation Criteria Checklist

### ✅ Technical Innovation
- [ ] **NASA TEMPO Integration**: Real satellite data processing
- [ ] **Advanced AI/ML**: Multi-model ensemble predictions
- [ ] **Production Architecture**: Scalable, monitored, tested
- [ ] **Modern Tech Stack**: React, FastAPI, PostgreSQL, Redis

### ✅ Impact & Usability
- [ ] **Public Health Focus**: Vulnerable population protection
- [ ] **Emergency Response**: Automated alert systems
- [ ] **User Experience**: Intuitive, accessible, mobile-first
- [ ] **Real-world Applicability**: Ready for immediate deployment

### ✅ NASA Challenge Alignment
- [ ] **TEMPO Data Utilization**: Primary satellite data source
- [ ] **Ground Station Integration**: EPA AirNow + OpenAQ
- [ ] **Weather Correlation**: Multi-source data fusion
- [ ] **Public Benefit**: Clear health and safety improvements

### ✅ Sustainability & Scalability
- [ ] **Open Source**: MIT license for broad adoption
- [ ] **Documentation**: Comprehensive setup and API docs
- [ ] **Community Ready**: Contribution guidelines and support
- [ ] **Global Potential**: Scalable architecture design

---

**Ready to experience the future of air quality monitoring? Start with our [30-second demo](https://demo.airwatch-pro.com) or [deploy locally](#installation-options) in under 5 minutes!** 🚀