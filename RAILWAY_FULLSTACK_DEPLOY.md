# 🚀 Railway Full-Stack Deployment Guide

## Deploy Both Frontend & Backend on Railway

### 📋 Overview
Deploy your complete NASA hackathon project on Railway:
- **Backend Service**: FastAPI + Python (from `/backend` directory)
- **Frontend Service**: React + Vite (from root directory)
- **Database**: Supabase (already configured)

---

## 🔧 Step 1: Deploy Backend Service

### Manual Setup in Railway Dashboard:

1. **Go to Railway**: https://railway.com/project/066d711b-65d5-4348-86fd-64b588e175ee

2. **Delete Current Service** (if it exists and has issues):
   - Click on current service → Settings → Delete Service

3. **Add Backend Service**:
   - Click **"+ Add Service"**
   - Select **"GitHub Repo"** 
   - Choose: `codewithtanvir/airwatch-pro`
   - **Service Name**: `airwatch-backend`
   - **CRITICAL**: Set **Root Directory** to `backend`

4. **Environment Variables** (Backend):
   ```bash
   DEBUG=False
   HOST=0.0.0.0
   PORT=8000
   SECRET_KEY=N6sTPQQ6fsiy-j3Q00ZwRjH0B9g3vzP4S8PCrU2n_S47-z4b8-r73EOk6FQ4rFu_aB3WfelAX18nFvs-S-6mpg
   SUPABASE_URL=https://jdzvftcxdeejouopupox.supabase.co
   SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpkenZmdGN4ZGVlam91b3B1cG94Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxNDMyMjgsImV4cCI6MjA3NDcxOTIyOH0.XFSlvb-1pHZ4sI9I_SaskdBgfloqBxiKB2JOkVLkkCc
   SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpkenZmdGN4ZGVlam91b3B1cG94Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTE0MzIyOCwiZXhwIjoyMDc0NzE5MjI4fQ.f57zWJcAeQMuOhH3dN8gvNFSNi9jL0G-9OKLBYFZSdU
   NASA_USERNAME=tanvirrahman
   NASA_PASSWORD=-YdQYkJXUdBpt9:
   NASA_TEMPO_COLLECTION_ID=C2915230001-LARC_CLOUD
   EPA_AIRNOW_API_KEY=055D7D82-F63A-4DC6-8790-5082D00DF5D9
   OPENWEATHER_API_KEY=eda4999edd5e34f2f3e2ede581b63ef7
   VISUAL_CROSSING_API_KEY=VU2WJHX5AXKXTAWLZKAMW6YJD
   OPENAQ_API_KEY=7518a57ecff6293f98b968e804662a5718b47506eaa64aabaa2a4c0fd71ce6e9
   ALLOWED_HOSTS=https://airwatch-frontend-production.railway.app,https://*.railway.app
   ```

5. **Deploy Backend**: Railway will auto-build and deploy

---

## 🌐 Step 2: Deploy Frontend Service

### Add Frontend Service:

1. **In Same Railway Project**:
   - Click **"+ Add Service"** again
   - Select **"GitHub Repo"**
   - Choose: `codewithtanvir/airwatch-pro` 
   - **Service Name**: `airwatch-frontend`
   - **Root Directory**: Leave empty (uses root directory)

2. **Environment Variables** (Frontend):
   ```bash
   VITE_API_BASE_URL=https://[BACKEND-URL].railway.app
   VITE_API_TIMEOUT=30000
   VITE_ENABLE_SATELLITE_DATA=true
   VITE_ENABLE_HISTORICAL_DATA=true
   VITE_ENABLE_FORECASTS=true
   VITE_ENABLE_ALERTS=true
   VITE_DEBUG_MODE=false
   VITE_LOG_LEVEL=warn
   VITE_DEFAULT_MAP_CENTER_LAT=40.7128
   VITE_DEFAULT_MAP_CENTER_LNG=-74.0060
   VITE_DEFAULT_MAP_ZOOM=10
   VITE_CURRENT_DATA_REFRESH_INTERVAL=300
   VITE_HISTORICAL_DATA_REFRESH_INTERVAL=3600
   VITE_LOCATIONS_CACHE_DURATION=1800
   VITE_MAX_HISTORICAL_HOURS=168
   VITE_DEFAULT_SEARCH_RADIUS_KM=50
   VITE_MAX_MONITORING_STATIONS=100
   ```

3. **Deploy Frontend**: Railway will auto-build and deploy

---

## 🔄 Step 3: Update Cross-References

### Update Backend CORS:
1. Go to **Backend Service** → Variables
2. Update `ALLOWED_HOSTS`:
   ```bash
   ALLOWED_HOSTS=https://[FRONTEND-URL].railway.app,https://*.railway.app
   ```

### Update Frontend API URL:
1. Go to **Frontend Service** → Variables  
2. Update `VITE_API_BASE_URL`:
   ```bash
   VITE_API_BASE_URL=https://[BACKEND-URL].railway.app
   ```

---

## ✅ Step 4: Test Full Deployment

### Expected URLs:
- **Backend API**: `https://airwatch-backend-production-[hash].railway.app`
- **Frontend**: `https://airwatch-frontend-production-[hash].railway.app`

### Test Endpoints:
1. **Backend Health**: `https://[backend-url]/health`
2. **Backend API Docs**: `https://[backend-url]/docs`
3. **Frontend Dashboard**: `https://[frontend-url]/`
4. **Full Integration**: Search for locations and verify data loads

---

## 🎯 Benefits of Railway Full-Stack:

✅ **Single Platform**: Everything in one Railway project  
✅ **No CORS Issues**: Both services on same domain  
✅ **Automatic HTTPS**: Built-in SSL certificates  
✅ **Auto-Deploy**: GitHub integration for both services  
✅ **Monitoring**: Unified logs and metrics  
✅ **Cost Effective**: Railway's free tier covers both services  

---

## 🚀 CLI Alternative:

If you prefer CLI deployment:

```bash
# Deploy Backend
cd backend
npx @railway/cli up

# Deploy Frontend (new service)
cd ..
npx @railway/cli add
# Select "Empty Service" → Name: "frontend"
npx @railway/cli up
```

---

Your complete NASA hackathon project will be live on Railway! 🛰️🌍