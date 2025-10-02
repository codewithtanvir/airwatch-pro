# 🚀 AirWatch Pro - Deployment Guide

## 📋 Quick Start

This deployment guide provides step-by-step instructions for setting up AirWatch Pro locally and deploying to production on Vercel.

## 🏗️ Prerequisites

### Required Software
- **Node.js** (v18 or higher)
- **npm** or **pnpm** (package manager)
- **Git** (version control)

### API Keys & Access
- **NASA Earthdata Account**: [Register here](https://urs.earthdata.nasa.gov/)
- **OpenWeather API Key**: [Get free key](https://openweathermap.org/api)
- **Vercel Account**: [Sign up here](https://vercel.com/)

## 🔧 Local Development Setup

### 1. Clone Repository
```bash
git clone https://github.com/codewithtanvir/airwatch-pro.git
cd airwatch-pro
```

### 2. Install Dependencies
```bash
# Using npm
npm install

# Using pnpm (recommended)
pnpm install
```

### 3. Environment Configuration
Create a `.env.local` file in the root directory:

```env
# NASA API Configuration
VITE_NASA_API_KEY=your_nasa_earthdata_token
VITE_NASA_BASE_URL=https://earthdata.nasa.gov/api

# Weather Data
VITE_OPENWEATHER_API_KEY=your_openweather_api_key

# Application Settings
VITE_APP_ENV=development
VITE_API_BASE_URL=http://localhost:3000/api
```

### 4. Start Development Server
```bash
npm run dev
# or
pnpm dev
```

Visit `http://localhost:5173` to see your application running.

## 🌐 Production Deployment (Vercel)

### Option 1: Automatic GitHub Deployment

1. **Connect GitHub Repository**
   - Log in to [Vercel Dashboard](https://vercel.com/dashboard)
   - Click "New Project"
   - Import your GitHub repository

2. **Configure Environment Variables**
   ```
   VITE_NASA_API_KEY=your_production_nasa_token
   VITE_OPENWEATHER_API_KEY=your_openweather_api_key
   VITE_APP_ENV=production
   VITE_API_BASE_URL=https://your-domain.vercel.app/api
   ```

3. **Deploy**
   - Click "Deploy"
   - Vercel automatically builds and deploys your application

### Option 2: Manual Deployment

```bash
# Install Vercel CLI
npm i -g vercel

# Login to your account
vercel login

# Deploy from project directory
vercel

# Follow the prompts to configure your deployment
```

## 🛠️ Build & Production

### Build Process
```bash
# Create production build
npm run build

# Preview production build locally
npm run preview
```

### Build Configuration
The project uses Vite for building with the following optimizations:
- **TypeScript compilation**
- **Asset optimization**
- **Code splitting**
- **PWA service worker generation**

## 📡 API Endpoints

### Health Check
```
GET /api/health
```
Returns server status and API availability.

### Air Quality Data
```
GET /api/air-quality?lat={latitude}&lon={longitude}
```
Returns real-time air quality data for specified coordinates.

**Example Response:**
```json
{
  "location": {
    "lat": 40.7128,
    "lon": -74.0060,
    "city": "New York"
  },
  "current": {
    "aqi": 85,
    "category": "Moderate",
    "pollutants": {
      "no2": 42.5,
      "pm25": 18.3,
      "o3": 67.8
    }
  },
  "forecast": [...],
  "timestamp": "2025-01-08T10:30:00Z"
}
```

## 🔍 Environment Variables Reference

### Required Variables
| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_NASA_API_KEY` | NASA Earthdata access token | `eyJ0eXAiOiJKV1Q...` |
| `VITE_OPENWEATHER_API_KEY` | OpenWeather API key | `a1b2c3d4e5f6...` |

### Optional Variables
| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_APP_ENV` | Application environment | `development` |
| `VITE_API_BASE_URL` | API base URL | `http://localhost:3000/api` |

## 🧪 Testing

### Run Tests
```bash
# Unit tests
npm run test

# Integration tests
npm run test:integration

# End-to-end tests
npm run test:e2e
```

### Test Coverage
```bash
npm run test:coverage
```

## 🔧 Troubleshooting

### Common Issues

#### 1. NASA API Authentication Errors
**Problem:** `401 Unauthorized` when fetching TEMPO data
**Solution:** 
- Verify your NASA Earthdata account is active
- Check that your API token is correctly set in environment variables
- Ensure your token has proper permissions for TEMPO data access

#### 2. Build Failures
**Problem:** TypeScript compilation errors
**Solution:**
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Check TypeScript configuration
npx tsc --noEmit
```

#### 3. API Rate Limiting
**Problem:** Too many requests to external APIs
**Solution:**
- Implement request caching in development
- Use production API keys with higher rate limits
- Add request throttling middleware

#### 4. Vercel Deployment Issues
**Problem:** Function timeout or memory errors
**Solution:**
- Optimize API functions for smaller memory footprint
- Implement proper error handling
- Use Vercel Pro plan for increased limits if needed

### Performance Optimization

#### Frontend Optimizations
- **Code Splitting**: Automatic with Vite
- **Lazy Loading**: Components loaded on demand
- **Service Worker**: Caching for offline functionality
- **Image Optimization**: WebP format with fallbacks

#### API Optimizations
- **Data Caching**: Redis-compatible caching layer
- **Request Batching**: Multiple coordinates in single request
- **Response Compression**: Gzip compression enabled
- **Error Handling**: Graceful degradation for API failures

## 📊 Monitoring & Analytics

### Production Monitoring
- **Vercel Analytics**: Built-in performance monitoring
- **Error Tracking**: Automatic error reporting
- **API Metrics**: Request/response monitoring
- **User Analytics**: Privacy-focused usage tracking

### Custom Monitoring
```javascript
// Add to your analytics setup
const trackAirQualityRequest = (location, responseTime) => {
  // Custom tracking implementation
  analytics.track('air_quality_request', {
    latitude: location.lat,
    longitude: location.lon,
    response_time_ms: responseTime,
    timestamp: new Date().toISOString()
  });
};
```

## 🔒 Security Considerations

### API Security
- **Environment Variables**: Never commit secrets to version control
- **CORS Configuration**: Restrict to production domains
- **Rate Limiting**: Implement API request throttling
- **Input Validation**: Sanitize all user inputs

### Data Privacy
- **No Personal Data Storage**: Location data not persisted
- **HTTPS Only**: All communications encrypted
- **Privacy Policy**: Clear data usage documentation

## 📚 Additional Resources

### Documentation
- [NASA TEMPO Mission](https://tempo.si.edu/)
- [Vercel Documentation](https://vercel.com/docs)
- [React TypeScript Guide](https://react-typescript-cheatsheet.netlify.app/)

### Support
- **GitHub Issues**: [Report bugs and feature requests](https://github.com/codewithtanvir/airwatch-pro/issues)
- **Discussions**: [Community support](https://github.com/codewithtanvir/airwatch-pro/discussions)
- **Email**: tanvirrahman38@gmail.com

---

**🌟 Ready to deploy life-saving air quality monitoring powered by NASA TEMPO satellite data!**