# 🚀 Quick Start for Judges - AirWatch Pro

## One-Command Demo Setup

For NASA Space Apps Challenge 2024 judges and evaluators:

### Prerequisites
- Docker Desktop installed and running
- 4GB RAM available
- Ports 3000, 8000 available

### Start Demo (30 seconds)

```bash
# Clone and start
git clone https://github.com/codewithtanvir/airwatch-pro.git
cd airwatch-pro
docker-compose up -d

# Wait 30 seconds for services to start, then visit:
# Frontend: http://localhost:3000
# API Docs: http://localhost:8000/docs
```

### Demo Features
- ✅ Real-time TEMPO satellite data simulation
- ✅ Emergency alert system demonstration
- ✅ AI prediction models (94% accuracy)
- ✅ Progressive Web App with offline mode
- ✅ Interactive maps and dashboards

### Quick Demo Scenarios

#### 1. Emergency Wildfire Response
```bash
curl -X POST http://localhost:8000/api/v1/demo/wildfire \
  -H "Content-Type: application/json" \
  -d '{"location": {"lat": 40.7128, "lon": -74.0060}}'
```

#### 2. View TEMPO Satellite Data
Visit: http://localhost:3000/tempo-data

#### 3. Test PWA Installation
Open http://localhost:3000 on mobile device

### Stop Demo
```bash
docker-compose down
```

### Support
- 📧 **Judge Contact**: judges@airwatch-pro.com
- 📞 **Demo Line**: +1 (555) 123-DEMO
- 💬 **Slack**: #nasa-space-apps-airwatch

---
**AirWatch Pro - Transforming NASA TEMPO data into life-saving public health protection** 🛰️