# 🚀 AirWatch Pro - Complete Deployment Guide

## 📋 Overview
Deploy your NASA hackathon project using:
- **Backend**: Railway (FastAPI + Python)
- **Frontend**: Vercel (React + TypeScript)
- **Database**: Supabase (PostgreSQL)

---

## 🔧 Step 1: Deploy Backend to Railway

### Option A: Automatic Deployment (Recommended)

1. **Go to Railway**: [https://railway.app](https://railway.app)

2. **Login**: Use your GitHub account

3. **New Project**: 
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose: `codewithtanvir/airwatch-pro`

4. **Configure Service**:
   - **Service Name**: `airwatch-backend`
   - **Root Directory**: Leave empty (Railway will auto-detect)
   - Railway will automatically use the `Procfile` and `railway.json`

5. **Environment Variables**: Add these in Railway dashboard:
   ```bash
   DEBUG=False
   SECRET_KEY=N6sTPQQ6fsiy-j3Q00ZwRjH0B9g3vzP4S8PCrU2n_S47-z4b8-r73EOk6FQ4rFu_aB3WfelAX18nFvs-S-6mpg
   HOST=0.0.0.0
   PORT=8000
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
   ALLOWED_HOSTS=https://airwatch-pro.vercel.app,https://*.vercel.app
   ```

6. **Deploy**: Railway will automatically build and deploy!

7. **Get URL**: Copy your Railway URL (e.g., `https://airwatch-backend-production-xxx.railway.app`)

---

## 🌐 Step 2: Deploy Frontend to Vercel

### Option A: Automatic Deployment (Recommended)

1. **Go to Vercel**: [https://vercel.com](https://vercel.com)

2. **Login**: Use your GitHub account

3. **New Project**:
   - Click "New Project"
   - Import `codewithtanvir/airwatch-pro`

4. **Configure Project**:
   - **Project Name**: `airwatch-pro`
   - **Framework Preset**: Vite
   - **Root Directory**: Leave as `/` (root)
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

5. **Environment Variables**: Add these in Vercel dashboard:
   ```bash
   VITE_API_BASE_URL=https://[YOUR-RAILWAY-URL].railway.app
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

6. **Deploy**: Vercel will automatically build and deploy!

7. **Custom Domain** (Optional): Set up `airwatch-pro.vercel.app`

---

## 🔄 Step 3: Update CORS Settings

After getting your Vercel URL, update the Railway backend environment variables:

1. **Go to Railway Dashboard** → Your backend service → Variables
2. **Update ALLOWED_HOSTS**:
   ```bash
   ALLOWED_HOSTS=https://airwatch-pro.vercel.app,https://[your-vercel-url].vercel.app
   ```
3. **Redeploy**: Railway will automatically redeploy with new settings

---

## ✅ Step 4: Test Your Deployment

### Backend Health Check:
```bash
curl https://[your-railway-url].railway.app/health
```

### Frontend Access:
Visit: `https://airwatch-pro.vercel.app`

### Full Integration Test:
1. Open your frontend URL
2. Search for a location (e.g., "New York")
3. Check if air quality data loads
4. Verify satellite data appears
5. Test historical trends

---

## 🐛 Troubleshooting

### Railway Issues:
- **Build Fails**: Check if `requirements.txt` is in `/backend/` directory
- **Start Fails**: Verify `Procfile` command is correct
- **503 Error**: Check environment variables are set correctly

### Vercel Issues:
- **Build Fails**: Ensure `package.json` is in root directory
- **Blank Page**: Check console for CORS errors
- **API Errors**: Verify `VITE_API_BASE_URL` points to Railway URL

### CORS Issues:
- Make sure Railway `ALLOWED_HOSTS` includes your Vercel URL
- Check that both HTTP and HTTPS protocols are allowed

---

## 🎯 Expected URLs:

- **Backend API**: `https://[project-name].railway.app`
- **Frontend**: `https://airwatch-pro.vercel.app`
- **Health Check**: `https://[project-name].railway.app/health`
- **API Docs**: `https://[project-name].railway.app/docs`

---

## 🚀 Quick Commands:

```bash
# Test backend locally
cd backend && python start_server.py

# Test frontend locally  
npm run dev

# Build for production
npm run build

# Test production build
npm run preview
```

---

## 📊 Monitoring:

- **Railway**: Built-in logs and metrics
- **Vercel**: Analytics and performance insights
- **Supabase**: Database monitoring and logs

Your NASA hackathon project is now live! 🛰️🌍