# 🚀 Vercel Full-Stack Deployment Guide

## Deploy Both Frontend & Backend on Vercel

### 📋 Overview
Deploy your complete NASA hackathon project on Vercel:
- **Frontend**: React + Vite (root directory)
- **Backend**: FastAPI as Vercel Functions (API routes)
- **Database**: Supabase (already configured)

---

## 🔧 Step 1: Restructure for Vercel Functions

### Create API Directory Structure:
```
/
├── api/                    # Vercel Functions (Backend)
│   ├── health.py
│   ├── air-quality.py
│   └── weather.py
├── src/                    # Frontend (React)
├── public/
├── package.json
└── vercel.json
```

### Benefits of Vercel Full-Stack:
✅ **Single Domain**: No CORS issues
✅ **Serverless**: Auto-scaling backend functions
✅ **Edge Network**: Global CDN for both frontend and API
✅ **Free Tier**: Generous limits for hackathon projects
✅ **Easy Deployment**: Single `vercel` command
✅ **Environment Variables**: Unified configuration

---

## 🛠️ Step 2: Convert Backend to Vercel Functions

### Create API Functions:

**api/health.py** (Health Check):
```python
from fastapi import FastAPI
from fastapi.responses import JSONResponse

app = FastAPI()

@app.get("/api/health")
def health_check():
    return {"status": "healthy", "service": "airwatch-pro"}

# Vercel handler
def handler(request):
    return app(request)
```

**api/air-quality.py** (Air Quality Data):
```python
from fastapi import FastAPI, Query
from fastapi.responses import JSONResponse
import os
import httpx
from typing import Optional

app = FastAPI()

@app.get("/api/air-quality")
async def get_air_quality(
    lat: float = Query(...),
    lon: float = Query(...),
    radius: Optional[int] = Query(50)
):
    # Your existing air quality logic here
    openaq_key = os.getenv("OPENAQ_API_KEY")
    epa_key = os.getenv("EPA_AIRNOW_API_KEY")
    
    # Example API call
    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"https://api.openaq.org/v3/locations",
            headers={"X-API-Key": openaq_key},
            params={
                "coordinates": f"{lat},{lon}",
                "radius": radius
            }
        )
    
    return response.json()

def handler(request):
    return app(request)
```

---

## 🔄 Step 3: Update Vercel Configuration

### vercel.json:
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "vite",
  "functions": {
    "api/**/*.py": {
      "runtime": "python3.9"
    }
  },
  "rewrites": [
    {
      "source": "/api/(.*)",
      "destination": "/api/$1"
    },
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ],
  "env": {
    "VITE_API_BASE_URL": "https://airwatch-pro.vercel.app"
  }
}
```

### requirements.txt (for Vercel Functions):
```txt
fastapi==0.104.1
httpx==0.25.2
supabase==2.3.0
python-dotenv==1.0.0
pydantic==2.5.2
```

---

## 🌐 Step 4: Frontend Configuration

### Update API Client:
```typescript
// src/lib/apiClient.ts
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

export const apiClient = {
  async getAirQuality(lat: number, lon: number) {
    const response = await fetch(`${API_BASE_URL}/api/air-quality?lat=${lat}&lon=${lon}`);
    return response.json();
  },

  async getHealth() {
    const response = await fetch(`${API_BASE_URL}/api/health`);
    return response.json();
  }
};
```

---

## 🚀 Step 5: Deploy to Vercel

### Option A: CLI Deployment
```bash
# Install Vercel CLI (if not already installed)
npm install -g vercel

# Login to Vercel
vercel login

# Deploy
vercel --prod
```

### Option B: GitHub Integration
1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Import your repository: `codewithtanvir/airwatch-pro`
4. Vercel auto-detects Vite + Python functions
5. Deploy automatically

---

## ⚙️ Step 6: Environment Variables

### Add in Vercel Dashboard:
```bash
# Backend API Keys
OPENAQ_API_KEY=7518a57ecff6293f98b968e804662a5718b47506eaa64aabaa2a4c0fd71ce6e9
EPA_AIRNOW_API_KEY=055D7D82-F63A-4DC6-8790-5082D00DF5D9
OPENWEATHER_API_KEY=eda4999edd5e34f2f3e2ede581b63ef7
VISUAL_CROSSING_API_KEY=VU2WJHX5AXKXTAWLZKAMW6YJD
NASA_USERNAME=tanvirrahman
NASA_PASSWORD=-YdQYkJXUdBpt9:
NASA_TEMPO_COLLECTION_ID=C2915230001-LARC_CLOUD

# Supabase
SUPABASE_URL=https://jdzvftcxdeejouopupox.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpkenZmdGN4ZGVlam91b3B1cG94Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxNDMyMjgsImV4cCI6MjA3NDcxOTIyOH0.XFSlvb-1pHZ4sI9I_SaskdBgfloqBxiKB2JOkVLkkCc
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpkenZmdGN4ZGVlam91b3B1cG94Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTE0MzIyOCwiZXhwIjoyMDc0NzE5MjI4fQ.f57zWJcAeQMuOhH3dN8gvNFSNi9jL0G-9OKLBYFZSdU

# Frontend
VITE_API_BASE_URL=https://airwatch-pro.vercel.app
VITE_ENABLE_SATELLITE_DATA=true
VITE_ENABLE_HISTORICAL_DATA=true
VITE_ENABLE_FORECASTS=true
VITE_ENABLE_ALERTS=true
```

---

## ✅ Step 7: Test Full-Stack Deployment

### Expected URLs:
- **Frontend**: `https://airwatch-pro.vercel.app`
- **Backend Health**: `https://airwatch-pro.vercel.app/api/health`
- **Air Quality API**: `https://airwatch-pro.vercel.app/api/air-quality?lat=40.7128&lon=-74.0060`

### Test Endpoints:
1. **Health Check**: `curl https://airwatch-pro.vercel.app/api/health`
2. **Frontend**: Visit `https://airwatch-pro.vercel.app`
3. **Integration**: Search for locations and verify data loads

---

## 🎯 Advantages of Vercel Full-Stack:

✅ **Unified Platform**: Frontend + Backend in one deployment
✅ **No CORS Issues**: Same domain for API and frontend
✅ **Serverless Functions**: Auto-scaling, pay-per-use
✅ **Global Edge Network**: Fast worldwide performance
✅ **Zero Configuration**: Automatic optimization
✅ **Real-time Logs**: Built-in monitoring and debugging
✅ **Custom Domains**: Easy to set up custom domain
✅ **Preview Deployments**: Every git push gets preview URL

---

## 🚀 Quick Start Commands:

```bash
# 1. Create API functions
mkdir api
# Copy your backend logic to API functions

# 2. Update vercel.json configuration

# 3. Deploy
vercel --prod

# 4. Your app is live! 🎉
```

---

Your complete NASA hackathon project will be live on Vercel with a single deployment! 🛰️🌍