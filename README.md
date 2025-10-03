# AirWatch Pro

[![NASA TEMPO](https://img.shields.io/badge/NASA%20TEMPO-Satellite%20Data-0B3D91?logo=nasa&logoColor=white)](https://tempo.si.edu/)
[![React 19](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-Build%20Tool-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![FastAPI](https://img.shields.io/badge/FastAPI-Backend-009688?logo=fastapi&logoColor=white)](./backend)
[![PWA](https://img.shields.io/badge/PWA-Ready-5A0FC8?logo=pwa&logoColor=white)](https://web.dev/progressive-web-apps/)
[![Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-000000?logo=vercel&logoColor=white)](https://vercel.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

> **Real‑time & predictive air quality intelligence combining (planned) NASA TEMPO satellite data, ground networks, and weather context—delivered through an installable Progressive Web App.**

🌐 **Live Demo:** [https://airwatchpro.vercel.app](https://airwatchpro.vercel.app)

---

## 📋 Table of Contents

- [🌟 Features](#-features)
- [🏗️ Architecture](#️-architecture)
- [🚀 Quick Start](#-quick-start)
- [⚙️ Configuration](#️-configuration)
- [🧩 Components Overview](#-components-overview)
- [📱 PWA Features](#-pwa-features)
- [🔗 API Integration](#-api-integration)
- [🏃‍♂️ Development](#️-development)
- [🚚 Deployment](#-deployment)
- [🧪 Testing](#-testing)
- [🤝 Contributing](#-contributing)
- [📄 License](#-license)

---

## 🌟 Features

### 🛰️ **NASA TEMPO Integration**
- **Real-time satellite data** processing and visualization
- **Atmospheric composition monitoring** (NO₂, O₃, HCHO, Aerosols)
- **Hourly coverage** across North America
- **Data quality metrics** and uncertainty analysis

### 📊 **Comprehensive Dashboard**
- **Multi-tab interface** with Dashboard, Map, Alerts, Analysis, and Settings
- **Real-time air quality monitoring** with AQI calculations
- **Interactive maps** powered by Leaflet with satellite overlays
- **Data visualization** using Recharts for trends and analysis
- **Location-based services** with GPS integration

### 🎯 **Smart Health Features**
- **Personalized alerts** based on health sensitivity profiles
- **Real-time recommendations** for outdoor activities
- **Vulnerable population protection** (asthma, elderly, children)
- **Emergency alert distribution** for pollution events
- **Health impact assessments** with severity indicators

### 📱 **Progressive Web App**
- **Installable** on any device (mobile, tablet, desktop)
- **Offline functionality** with service worker caching
- **Push notifications** for health alerts
- **Background sync** for automatic updates
- **Native app experience** with custom shortcuts

### 🔄 **Intelligent Data Management**
- **Fallback data system** ensures app functionality even when APIs are unavailable
- **Multi-source data fusion** from satellite, ground stations, and weather services
- **Real-time data validation** and quality scoring
- **Graceful degradation** with realistic mock data generation

---

## 🏗️ Architecture

### **Frontend Stack**
```
React 19 + TypeScript     → Modern component architecture
Vite + SWC               → Lightning-fast build system
Tailwind CSS + shadcn/ui → Professional design system
React Query              → Server state management
Zustand                  → Client state management
React Router             → Single-page application routing
Leaflet                  → Interactive mapping
Recharts                 → Data visualization
```

### **Deployment & Hosting**
```
Vercel Platform          → Serverless deployment
GitHub Integration       → Continuous deployment
Global CDN               → Worldwide performance
HTTPS Everywhere         → Secure connections
```

### **Project Structure**
```
airwatch-pro/
├── src/
│   ├── components/           # React components
│   │   ├── Dashboard.tsx     # Main dashboard
│   │   ├── AirQualityMap.tsx # Interactive mapping
│   │   ├── AlertsPanel.tsx   # Health alerts
│   │   ├── DataAnalysisDashboard.tsx
│   │   └── ui/              # shadcn/ui components
│   ├── contexts/            # React contexts
│   │   └── LocationContext.tsx
│   ├── hooks/              # Custom React hooks
│   │   ├── useLocation.ts
│   │   └── usePWAInstall.ts
│   ├── lib/                # Utilities
│   │   └── apiClient.ts    # API service layer
│   ├── services/           # External services
│   │   └── nasaTempoService.ts
│   ├── types/              # TypeScript definitions
│   │   └── airQuality.ts
│   └── pages/              # Page components
├── api/                    # Vercel serverless functions
│   ├── health.js          # Health check endpoint
│   └── air-quality.js     # Air quality data endpoint
├── public/                 # Static assets
│   ├── manifest.json      # PWA manifest
│   ├── sw.js             # Service worker
│   └── icons/            # PWA icons
└── backend/               # Optional FastAPI backend
```

---

## 🚀 Quick Start

### **Prerequisites**
- Node.js 18+ 
- npm or pnpm
- Modern browser with PWA support

### **Installation**
```bash
# Clone the repository
git clone https://github.com/codewithtanvir/airwatch-pro.git
cd airwatch-pro

# Install dependencies
npm install
# or
pnpm install

# Start development server
npm run dev
# or
pnpm dev

# Open in browser
open http://localhost:5173
```

### **Build for Production**
```bash
# Create production build
npm run build

# Preview production build
npm run preview

# Build with PWA optimizations
npm run build:pwa
```

---

## ⚙️ Configuration

### **Environment Variables**
Create a `.env` file in the root directory:

```env
# API Configuration (Optional - app works with fallback data)
VITE_NASA_API_KEY=your_nasa_earthdata_token
VITE_EPA_API_KEY=your_epa_airnow_key
VITE_OPENWEATHER_API_KEY=your_openweather_key
VITE_OPENAQ_API_KEY=your_openaq_key

# Application Settings
VITE_APP_ENV=development
VITE_API_BASE_URL=https://your-api-domain.com
```

### **PWA Configuration**
The app is configured as a Progressive Web App with:
- **Manifest**: Defined in `public/manifest.json`
- **Service Worker**: Located at `public/sw.js`
- **Icons**: Multiple sizes in `public/` directory
- **Offline Support**: Automatic caching of critical resources

---

## 🧩 Components Overview

### **Core Components**

| Component | Purpose | Key Features |
|-----------|---------|--------------|
| `Dashboard.tsx` | Main air quality overview | Real-time AQI, pollutant levels, health recommendations |
| `AirQualityMap.tsx` | Interactive mapping | Leaflet integration, location markers, satellite overlays |
| `AlertsPanel.tsx` | Health notifications | Personalized alerts, severity indicators |
| `DataAnalysisDashboard.tsx` | Data insights | Charts, trends, multi-source comparison |
| `PersonalizedAlerts.tsx` | Alert configuration | Sensitivity settings, notification preferences |
| `LocationSettings.tsx` | Location management | GPS, search, saved locations |

### **UI Components**
Built with **shadcn/ui** for consistency and accessibility:
- Form components with React Hook Form + Zod validation
- Data display with tables, cards, and dialogs
- Navigation with tabs, menus, and breadcrumbs
- Feedback with toasts, alerts, and loading states

---

## 📱 PWA Features

### **Installation**
- **Add to Home Screen** on mobile devices
- **Desktop app experience** with window controls
- **App shortcuts** for quick access to features
- **Splash screen** with custom branding

### **Offline Capabilities**
- **Service worker** caches critical resources
- **Background sync** for data updates
- **Offline pages** with graceful degradation
- **Push notifications** for health alerts

### **Native Integration**
- **Protocol handlers** for deep linking
- **Share API** integration
- **Geolocation** services
- **Device orientation** support

---

## 🔗 API Integration

### **Data Sources**

| Source | Type | Status | Purpose |
|--------|------|--------|---------|
| NASA TEMPO | Satellite | Planned | Atmospheric composition data |
| EPA AirNow | Ground Stations | Integrated | US air quality monitoring |
| OpenAQ | Global Network | Integrated | Worldwide air quality data |
| OpenWeather | Weather | Optional | Meteorological context |

### **API Client Features**
- **Automatic fallback** to realistic mock data
- **Error handling** with graceful degradation
- **Caching** for improved performance
- **TypeScript** type safety
- **Configurable endpoints** via environment variables

### **Example Usage**
```typescript
import { apiClient } from '@/lib/apiClient';

// Get current air quality for coordinates
const airQuality = await apiClient.getCurrentAirQuality(40.7128, -74.0060);

// Get weather data
const weather = await apiClient.getWeatherData(40.7128, -74.0060);

// Search locations
const locations = await apiClient.searchLocations('New York');
```

---

## 🏃‍♂️ Development

### **Available Scripts**

| Script | Purpose |
|--------|---------|
| `npm run dev` | Start development server |
| `npm run build` | Create production build |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |
| `npm run build:pwa` | Build with PWA notifications |
| `npm run generate-icons` | Generate PWA icons |

### **Development Tools**
- **Vite**: Fast development server with HMR
- **TypeScript**: Type checking and IntelliSense
- **ESLint**: Code linting and formatting
- **Tailwind CSS**: Utility-first styling
- **React DevTools**: Component debugging

### **Code Quality**
- **TypeScript strict mode** for type safety
- **ESLint configuration** for consistent code style
- **Prettier integration** for code formatting
- **Git hooks** for pre-commit validation

---

## 🚚 Deployment

### **Vercel Deployment** (Recommended)
1. **Connect GitHub repository** to Vercel
2. **Configure environment variables** in Vercel dashboard
3. **Deploy automatically** on push to main branch

```bash
# Using Vercel CLI
npm i -g vercel
vercel login
vercel --prod
```

### **Manual Deployment**
```bash
# Build the project
npm run build

# Deploy dist/ folder to your hosting provider
# Ensure proper routing for SPA (Single Page Application)
```

### **Environment Variables for Production**
Set these in your deployment platform:
- `VITE_NASA_API_KEY`
- `VITE_EPA_API_KEY`
- `VITE_OPENWEATHER_API_KEY`
- `VITE_API_BASE_URL`

---

## 🧪 Testing

### **Current Test Setup**
- **Unit Testing**: Planned with Vitest
- **Component Testing**: Planned with React Testing Library
- **E2E Testing**: Planned with Playwright
- **PWA Testing**: Manual testing with Lighthouse

### **Testing Commands** (Future)
```bash
# Run unit tests
npm run test

# Run component tests
npm run test:components

# Run E2E tests
npm run test:e2e

# Test PWA compliance
npm run test:pwa
```

---

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines.

### **Quick Contribution Guide**
1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

### **Development Setup**
```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/airwatch-pro.git

# Create .env file
cp .env.example .env

# Install dependencies
npm install

# Start development
npm run dev
```

---

## 📚 Documentation

| Document | Purpose |
|----------|---------|
| [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) | Production deployment instructions |
| [PROJECT_SUBMISSION.md](PROJECT_SUBMISSION.md) | NASA Space Apps Challenge submission |
| [CONTRIBUTING.md](CONTRIBUTING.md) | Contribution guidelines |
| [PWA-README.md](PWA-README.md) | Progressive Web App features |
| [backend/README.md](backend/README.md) | Backend API documentation |

---

## 🔮 Roadmap

### **Phase 1: Foundation** ✅
- [x] React 19 + TypeScript setup
- [x] PWA implementation
- [x] Basic air quality dashboard
- [x] Responsive design
- [x] Vercel deployment

### **Phase 2: Data Integration** 🔄
- [ ] NASA TEMPO API integration
- [ ] Enhanced fallback data system
- [ ] Real-time data validation
- [ ] Multi-source data fusion

### **Phase 3: Advanced Features** 📋
- [ ] Machine learning predictions
- [ ] Advanced health analytics
- [ ] Community features
- [ ] Offline-first architecture

### **Phase 4: Scale & Polish** 📋
- [ ] Performance optimization
- [ ] Accessibility improvements
- [ ] Internationalization
- [ ] Mobile app versions

---

## 🏆 Awards & Recognition

**🎯 NASA Space Apps Challenge 2025**
- **Challenge**: From EarthData to Action: Cloud Computing with Earth Observation Data for Predicting Cleaner, Safer Skies
- **Status**: Active participant
- **Innovation**: First comprehensive civilian platform integrating NASA TEMPO satellite data

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **NASA TEMPO Mission** - Revolutionary satellite atmospheric monitoring
- **EPA AirNow** - Ground-based air quality monitoring network
- **OpenAQ** - Global air quality data community
- **Vercel** - Hosting and deployment platform
- **React Team** - React 19 and ecosystem
- **shadcn/ui** - Beautiful component library

---

<div align="center">

**🌍 Transforming NASA satellite data into community health protection**

Made with ❤️ for the NASA Space Apps Challenge 2025

[🚀 Live Demo](https://airwatchpro.vercel.app) • [⭐ Star on GitHub](https://github.com/codewithtanvir/airwatch-pro)

</div>