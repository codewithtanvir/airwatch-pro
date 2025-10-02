"""
Service Worker Integration Guide for AirWatch Pro
Simple implementation for PWA offline functionality using the new database endpoints
"""

# Service Worker Integration for Frontend

## Overview
The backend now provides essential database endpoints that your frontend service worker can use for:
- Historical trends caching
- User preferences persistence  
- Offline data availability
- Performance optimization

## Key Endpoints for Service Worker

### 1. Historical Data for Offline Charts
```javascript
// In your service worker or frontend app
const getHistoricalData = async (lat, lng, days = 7) => {
  try {
    const response = await fetch(`/api/v1/database/historical/trends?latitude=${lat}&longitude=${lng}&days=${days}`);
    const data = await response.json();
    
    // Cache this data for offline use
    await caches.open('airwatch-historical').then(cache => {
      cache.put(`historical-${lat}-${lng}-${days}`, new Response(JSON.stringify(data)));
    });
    
    return data;
  } catch (error) {
    // Fallback to cached data if offline
    const cache = await caches.open('airwatch-historical');
    const cached = await cache.match(`historical-${lat}-${lng}-${days}`);
    return cached ? await cached.json() : null;
  }
};
```

### 2. User Preferences Persistence
```javascript
// Save user preferences across sessions
const saveUserPreferences = async (preferences) => {
  try {
    const response = await fetch('/api/v1/database/preferences', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(preferences)
    });
    return await response.json();
  } catch (error) {
    console.error('Failed to save preferences:', error);
  }
};

// Load user preferences on app start
const loadUserPreferences = async () => {
  try {
    const response = await fetch('/api/v1/database/preferences');
    const data = await response.json();
    return data.preferences;
  } catch (error) {
    // Return defaults if offline
    return {
      favorite_locations: [],
      alert_threshold: 100,
      notifications_enabled: true,
      preferred_units: 'metric',
      theme_preference: 'auto'
    };
  }
};
```

### 3. Offline Cache Preparation
```javascript
// Prepare data for offline mode
const prepareOfflineCache = async (locations) => {
  try {
    const response = await fetch('/api/v1/database/cache/prepare', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(locations)
    });
    
    const { cache_data } = await response.json();
    
    // Store in service worker cache
    const cache = await caches.open('airwatch-offline');
    await cache.put('offline-data', new Response(JSON.stringify(cache_data)));
    
    return cache_data;
  } catch (error) {
    console.error('Failed to prepare offline cache:', error);
  }
};
```

### 4. Performance Optimization with Nearby Data
```javascript
// Check for nearby cached data before making API calls
const getNearbyData = async (lat, lng, radius = 10) => {
  try {
    const response = await fetch(`/api/v1/database/cached/nearby?latitude=${lat}&longitude=${lng}&radius=${radius}`);
    const data = await response.json();
    
    if (data.cached_data && data.cached_data.length > 0) {
      // Use recent cached data instead of fresh API call
      return data.cached_data[0]; // Most recent
    }
    
    return null; // No nearby data, need fresh API call
  } catch (error) {
    return null;
  }
};
```

## Frontend Component Integration

### HistoricalTrends Component
```typescript
// In your HistoricalTrends.tsx component
const fetchHistoricalData = async (location: {lat: number, lng: number}, days: number) => {
  try {
    const response = await fetch(`/api/v1/database/historical/trends?latitude=${location.lat}&longitude=${location.lng}&days=${days}`);
    const data = await response.json();
    
    // Update your chart with data.data_points
    setChartData(data.data_points);
  } catch (error) {
    console.error('Failed to load historical data:', error);
  }
};
```

### LocationSettings Component
```typescript
// In your LocationSettings.tsx component
const saveSettings = async (settings: UserSettings) => {
  try {
    await fetch('/api/v1/database/preferences', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(settings)
    });
    
    toast.success('Settings saved successfully');
  } catch (error) {
    toast.error('Failed to save settings');
  }
};

const loadSettings = async () => {
  try {
    const response = await fetch('/api/v1/database/preferences');
    const data = await response.json();
    setUserSettings(data.preferences);
  } catch (error) {
    // Use defaults
    setUserSettings(defaultSettings);
  }
};
```

## Implementation Steps

1. **Add to your existing API client** (likely in src/lib/ somewhere):
   - Historical data fetching functions
   - User preferences management  
   - Offline cache preparation

2. **Update your service worker** (if you have one):
   - Cache historical data for offline charts
   - Store user preferences locally
   - Implement cache-first strategies for better performance

3. **Enhance components**:
   - HistoricalTrends: Use `/historical/trends` endpoint
   - LocationSettings: Use `/preferences` endpoints
   - Dashboard: Use nearby cached data for faster loading

4. **Add background sync** (optional):
   - Automatically cache data for favorite locations
   - Sync preferences when coming back online
   - Update cached data in background

## Benefits

✅ **Historical Trends**: 7-90 day charts work offline
✅ **User Preferences**: Settings persist across sessions  
✅ **Performance**: Reduced API calls with smart caching
✅ **Offline Support**: Core functionality works without internet
✅ **PWA Ready**: Essential data always available

## Next Steps

The backend is ready! Now you can:
1. Update your frontend to use these new endpoints
2. Implement the service worker caching strategies
3. Test offline functionality
4. Add background sync for automatic updates

All the essential database features are now available through simple REST API calls that integrate seamlessly with your existing React frontend.