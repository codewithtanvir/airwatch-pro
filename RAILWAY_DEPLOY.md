# Railway Backend Deployment Guide

## Automatic Deployment Steps

### 1. Connect to Railway

1. Go to [Railway](https://railway.app)
2. Sign up/Login with your GitHub account
3. Click "New Project" → "Deploy from GitHub repo"
4. Select your repository: `codewithtanvir/airwatch-pro`

### 2. Configure Railway Service

1. **Service Name**: `airwatch-backend`
2. **Root Directory**: Set to `backend/` (this is important!)
3. **Start Command**: Railway will auto-detect from `Procfile`

### 3. Environment Variables

Add these environment variables in Railway dashboard:

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

### 4. Deploy

Railway will automatically build and deploy your backend!

**Expected URL**: `https://[your-project-name].railway.app`

## Manual Steps

If automatic deployment doesn't work:

1. Set **Root Directory** to `backend`
2. Set **Build Command** to `pip install -r requirements.txt`
3. Set **Start Command** to `python start_server.py`

## Health Check

Once deployed, test: `https://[your-url].railway.app/health`