/**
 * AirWatch Pro Service Worker
 * Enhanced PWA service worker with comprehensive offline support, 
 * background sync, push notifications, and caching strategies
 */

const CACHE_NAME = 'airwatch-pro-v1.0.0';
const RUNTIME_CACHE = 'airwatch-runtime';
const DATA_CACHE_NAME = 'airwatch-data-v1';
const STATIC_CACHE = 'airwatch-static';

// Static assets to cache immediately
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/image/favicon.svg',
  // Vite build assets (will be available after build)
  '/assets/index.css',
  '/assets/index.js'
];

// API endpoints that should be cached with specific strategies
const API_CACHE_PATTERNS = [
  /\/api\/v1\/air-quality/,
  /\/api\/v1\/weather/,
  /\/api\/v1\/locations/,
  /\/api\/v1\/alerts/
];

// Install event - cache resources with improved error handling
self.addEventListener('install', (event) => {
  console.log('[SW] Installing AirWatch Pro service worker...');
  
  event.waitUntil(
    Promise.all([
      // Cache static assets
      caches.open(STATIC_CACHE)
        .then((cache) => {
          console.log('[SW] Caching static assets');
          return cache.addAll(urlsToCache.filter(url => !url.includes('/assets/')));
        }),
      // Pre-cache essential assets
      caches.open(CACHE_NAME)
        .then((cache) => {
          console.log('[SW] Pre-caching essential resources');
          return cache.addAll(['/']);
        })
    ]).then(() => {
      console.log('[SW] Static assets cached successfully');
      return self.skipWaiting();
    }).catch((error) => {
      console.error('[SW] Failed to cache static assets:', error);
    })
  );
});

// Activate event - clean up old caches and claim clients
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating AirWatch Pro service worker...');
  
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (![CACHE_NAME, DATA_CACHE_NAME, RUNTIME_CACHE, STATIC_CACHE].includes(cacheName)) {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      // Claim all clients
      self.clients.claim()
    ]).then(() => {
      console.log('[SW] Service worker activated and ready');
    })
  );
});

// Push notification event with enhanced data handling
self.addEventListener('push', (event) => {
  console.log('[SW] Push notification received:', event);
  
  let notificationData = {
    title: 'AirWatch Pro Alert',
    body: 'New air quality information available',
    icon: '/icon-192x192.png',
    badge: '/icon-72x72.png',
    tag: 'airwatch-alert',
    requireInteraction: true,
    actions: [
      {
        action: 'view',
        title: 'View Details',
        icon: '/icon-view.png'
      },
      {
        action: 'dismiss',
        title: 'Dismiss',
        icon: '/icon-dismiss.png'
      }
    ],
    data: {
      url: '/?from=notification',
      timestamp: Date.now()
    },
    vibrate: [200, 100, 200]
  };

  if (event.data) {
    try {
      const payload = event.data.json();
      notificationData = { 
        ...notificationData, 
        ...payload,
        data: { ...notificationData.data, ...payload.data }
      };
    } catch (e) {
      console.error('[SW] Error parsing push notification data:', e);
      notificationData.body = event.data.text() || notificationData.body;
    }
  }

  event.waitUntil(
    self.registration.showNotification(notificationData.title, notificationData)
  );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event);
  
  event.notification.close();

  if (event.action === 'dismiss') {
    return;
  }

  // Default action or 'view' action
  const urlToOpen = event.notification.data?.url || '/';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Check if app is already open
        for (const client of clientList) {
          if (client.url === urlToOpen && 'focus' in client) {
            return client.focus();
          }
        }
        
        // Open new window if app not open
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

// Background sync for enhanced data updates
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync triggered:', event.tag);
  
  switch (event.tag) {
    case 'airwatch-data-sync':
    case 'background-air-quality-sync':
      event.waitUntil(syncAirQualityData());
      break;
    case 'background-location-sync':
      event.waitUntil(syncLocationData());
      break;
    case 'background-alerts-sync':
      event.waitUntil(syncAlertsData());
      break;
    default:
      console.log('[SW] Unknown sync tag:', event.tag);
  }
});

// Fetch event - comprehensive caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Handle API requests with network-first strategy
  if (isApiRequest(url)) {
    event.respondWith(handleApiRequest(request));
    return;
  }

  // Handle static assets with cache-first strategy
  if (isStaticAsset(url)) {
    event.respondWith(handleStaticAsset(request));
    return;
  }

  // Handle navigation requests with network-first, fallback to cache
  if (isNavigationRequest(request)) {
    event.respondWith(handleNavigationRequest(request));
    return;
  }

  // Default strategy: network first with cache fallback
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.status === 200 && response.type === 'basic') {
          const responseClone = response.clone();
          caches.open(RUNTIME_CACHE).then((cache) => {
            cache.put(request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        return caches.match(request);
      })
  );
});

// Helper functions for request classification
function isApiRequest(url) {
  return API_CACHE_PATTERNS.some(pattern => pattern.test(url.pathname)) || 
         url.pathname.startsWith('/api/');
}

function isStaticAsset(url) {
  return url.pathname.match(/\.(js|css|png|jpg|jpeg|svg|woff|woff2|ttf|eot|ico|webp)$/);
}

function isNavigationRequest(request) {
  return request.mode === 'navigate' || 
         (request.method === 'GET' && request.headers.get('accept').includes('text/html'));
}

// Network-first strategy for API requests with offline fallback
async function handleApiRequest(request) {
  try {
    console.log('[SW] Fetching API data from network:', request.url);
    const response = await fetch(request);
    
    if (response.status === 200) {
      const cache = await caches.open(DATA_CACHE_NAME);
      cache.put(request, response.clone());
      console.log('[SW] API data cached:', request.url);
    }
    
    return response;
  } catch (error) {
    console.log('[SW] Network failed, trying cache:', request.url);
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      console.log('[SW] Serving from cache:', request.url);
      // Add offline indicator header
      const headers = new Headers(cachedResponse.headers);
      headers.set('X-Served-By', 'ServiceWorker-Cache');
      
      return new Response(cachedResponse.body, {
        status: cachedResponse.status,
        statusText: cachedResponse.statusText,
        headers: headers
      });
    }
    
    // Return offline response for air quality data
    if (request.url.includes('/air-quality/')) {
      return new Response(JSON.stringify({
        location: 'Offline',
        aqi: 0,
        level: 'Unknown',
        pollutants: { pm25: 0, pm10: 0, o3: 0, no2: 0, so2: 0, co: 0 },
        timestamp: new Date().toISOString(),
        offline: true,
        message: 'This data is not available offline. Please check your internet connection.'
      }), {
        headers: { 
          'Content-Type': 'application/json',
          'X-Served-By': 'ServiceWorker-Offline'
        }
      });
    }
    
    throw error;
  }
}

// Cache-first strategy for static assets
async function handleStaticAsset(request) {
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    console.log('[SW] Serving static asset from cache:', request.url);
    return cachedResponse;
  }
  
  try {
    console.log('[SW] Fetching static asset from network:', request.url);
    const response = await fetch(request);
    
    if (response.status === 200) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    console.error('[SW] Failed to fetch static asset:', request.url, error);
    throw error;
  }
}

// Network-first strategy for navigation requests
async function handleNavigationRequest(request) {
  try {
    console.log('[SW] Fetching navigation request from network');
    return await fetch(request);
  } catch (error) {
    console.log('[SW] Network failed for navigation, serving from cache');
    const cachedResponse = await caches.match('/index.html') || 
                          await caches.match('/');
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Fallback offline page
    return new Response(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>AirWatch Pro - Offline</title>
          <meta name="viewport" content="width=device-width,initial-scale=1">
          <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
            .offline { color: #666; }
          </style>
        </head>
        <body>
          <div class="offline">
            <h1>🌐 You're Offline</h1>
            <p>AirWatch Pro is not available right now. Please check your internet connection.</p>
            <button onclick="window.location.reload()">Try Again</button>
          </div>
        </body>
      </html>
    `, {
      headers: { 'Content-Type': 'text/html' }
    });
  }
}

// Enhanced background data sync function
async function syncAirQualityData() {
  try {
    console.log('[SW] Syncing air quality data in background...');
    
    // Get user's stored location preferences
    const userPrefs = await getUserPreferences();
    const location = userPrefs?.location || { lat: 40.7128, lng: -74.0060 }; // Default NYC
    
    // Fetch current air quality data
    const response = await fetch(`/api/air-quality/current?lat=${location.lat}&lng=${location.lng}`);
    
    if (response.ok) {
      const data = await response.json();
      
      // Store in cache
      const cache = await caches.open(DATA_CACHE_NAME);
      await cache.put(`/api/air-quality/current?lat=${location.lat}&lng=${location.lng}`, 
                      new Response(JSON.stringify(data)));
      
      console.log('[SW] Background sync completed successfully');
      
      // Notify all clients about the update
      const clients = await self.clients.matchAll();
      clients.forEach(client => {
        client.postMessage({
          type: 'BACKGROUND_SYNC_SUCCESS',
          data: data,
          timestamp: Date.now()
        });
      });
      
      // Check if alert notification is needed
      await checkForAlerts(data, userPrefs);
    }
  } catch (error) {
    console.error('[SW] Background sync failed:', error);
    
    // Notify clients about sync failure
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage({
        type: 'BACKGROUND_SYNC_FAILED',
        error: error.message,
        timestamp: Date.now()
      });
    });
  }
}

// New location sync function
async function syncLocationData() {
  try {
    console.log('[SW] Syncing location data in background...');
    
    const userPrefs = await getUserPreferences();
    if (userPrefs?.location) {
      // Sync location-based data like nearby monitoring stations
      const response = await fetch(`/api/locations/nearby?lat=${userPrefs.location.lat}&lng=${userPrefs.location.lng}&radius=50`);
      
      if (response.ok) {
        const locationData = await response.json();
        
        // Cache location data
        const cache = await caches.open(DATA_CACHE_NAME);
        await cache.put(`/api/locations/nearby?lat=${userPrefs.location.lat}&lng=${userPrefs.location.lng}&radius=50`,
                        new Response(JSON.stringify(locationData)));
        
        console.log('[SW] Location sync completed successfully');
      }
    }
  } catch (error) {
    console.error('[SW] Location sync failed:', error);
  }
}

// New alerts sync function
async function syncAlertsData() {
  try {
    console.log('[SW] Syncing alerts data in background...');
    
    const userPrefs = await getUserPreferences();
    if (userPrefs?.location) {
      const response = await fetch(`/api/alerts/active?lat=${userPrefs.location.lat}&lng=${userPrefs.location.lng}`);
      
      if (response.ok) {
        const alertsData = await response.json();
        
        // Cache alerts data
        const cache = await caches.open(DATA_CACHE_NAME);
        await cache.put(`/api/alerts/active?lat=${userPrefs.location.lat}&lng=${userPrefs.location.lng}`,
                        new Response(JSON.stringify(alertsData)));
        
        // Process any new alerts
        await processNewAlerts(alertsData, userPrefs);
        
        console.log('[SW] Alerts sync completed successfully');
      }
    }
  } catch (error) {
    console.error('[SW] Alerts sync failed:', error);
  }
}

// Process new alerts for notifications
async function processNewAlerts(alertsData, userPrefs) {
  if (!userPrefs.alertsEnabled || !alertsData.alerts) {
    return;
  }

  const lastNotificationTime = await getLastNotificationTime();
  const currentTime = Date.now();
  
  // Only send notifications if it's been at least 30 minutes since last one
  if (currentTime - lastNotificationTime < 30 * 60 * 1000) {
    return;
  }

  const urgentAlerts = alertsData.alerts.filter(alert => 
    alert.severity === 'high' || alert.severity === 'critical'
  );

  if (urgentAlerts.length > 0) {
    await sendAlertNotification(urgentAlerts[0], userPrefs);
    await setLastNotificationTime(currentTime);
  }
}

// Check if alerts should be sent
async function checkForAlerts(airQualityData) {
  try {
    // Get user preferences from IndexedDB (simplified)
    const userPrefs = await getUserPreferences();
    
    if (!userPrefs || !userPrefs.alertsEnabled) {
      return;
    }

    const aqi = airQualityData.aqi || 50;
    const threshold = userPrefs.alertThreshold || 100;
    
    if (aqi > threshold) {
      await sendAlertNotification(airQualityData, userPrefs);
    }
  } catch (error) {
    console.error('Error checking for alerts:', error);
  }
}

// Send alert notification
async function sendAlertNotification(data, userPrefs) {
  const severity = getAlertSeverity(data.aqi);
  const healthProfile = userPrefs.healthProfile || 'general';
  
  const notification = {
    title: `🚨 Air Quality Alert - ${severity}`,
    body: `AQI: ${data.aqi} in your area. ${getHealthRecommendation(healthProfile, data.aqi)}`,
    icon: '/icon-192x192.png',
    badge: '/badge-72x72.png',
    tag: 'airwatch-alert',
    requireInteraction: true,
    data: {
      url: '/?alert=true',
      aqi: data.aqi,
      severity: severity,
      timestamp: Date.now()
    },
    actions: [
      {
        action: 'view',
        title: 'View Details'
      },
      {
        action: 'dismiss',
        title: 'Dismiss'
      }
    ]
  };

  await self.registration.showNotification(notification.title, notification);
}

// Helper functions
function getAlertSeverity(aqi) {
  if (aqi <= 50) return 'Good';
  if (aqi <= 100) return 'Moderate';
  if (aqi <= 150) return 'Unhealthy for Sensitive Groups';
  if (aqi <= 200) return 'Unhealthy';
  if (aqi <= 300) return 'Very Unhealthy';
  return 'Hazardous';
}

function getHealthRecommendation(healthProfile, aqi) {
  const recommendations = {
    asthma: {
      100: 'Consider limiting outdoor activities.',
      150: 'Avoid outdoor activities. Keep rescue inhaler ready.',
      200: 'Stay indoors. Monitor symptoms closely.'
    },
    heart: {
      100: 'Limit strenuous outdoor exercise.',
      150: 'Avoid outdoor activities.',
      200: 'Stay indoors and rest.'
    },
    children: {
      80: 'Limit playground time.',
      120: 'Keep children indoors.',
      150: 'Ensure children stay indoors.'
    },
    elderly: {
      100: 'Reduce outdoor activities.',
      150: 'Stay indoors when possible.',
      200: 'Remain indoors.'
    },
    general: {
      100: 'Sensitive groups should limit outdoor activities.',
      150: 'Everyone should reduce outdoor activities.',
      200: 'Avoid outdoor activities.'
    }
  };

  const profileRecommendations = recommendations[healthProfile] || recommendations.general;
  
  for (const [threshold, recommendation] of Object.entries(profileRecommendations)) {
    if (aqi >= parseInt(threshold)) {
      return recommendation;
    }
  }
  
  return 'Air quality is acceptable for outdoor activities.';
}

// Get user preferences (enhanced with better defaults and error handling)
async function getUserPreferences() {
  try {
    // In a real implementation, this would read from IndexedDB
    // For now, return sensible defaults that work with our app structure
    return {
      alertsEnabled: true,
      alertThreshold: 100, // AQI threshold for alerts
      healthProfile: 'general', // general, asthma, heart, children, elderly
      notificationTypes: ['push'],
      location: { 
        lat: 40.7128, 
        lng: -74.0060,
        name: 'New York City' // Default location
      },
      updateFrequency: 30, // minutes
      quietHours: {
        enabled: false,
        start: '22:00',
        end: '07:00'
      }
    };
  } catch (error) {
    console.error('[SW] Error getting user preferences:', error);
    return null;
  }
}

console.log('[SW] AirWatch Pro Service Worker v1.0.0 loaded successfully');

// Enhanced message handler for communication with main thread
self.addEventListener('message', (event) => {
  console.log('[SW] Service worker received message:', event.data);
  
  if (!event.data || !event.data.type) {
    return;
  }
  
  switch (event.data.type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
      
    case 'UPDATE_PREFERENCES':
      // Handle preference updates (stored in IndexedDB in real implementation)
      updateUserPreferences(event.data.payload);
      break;
      
    case 'FORCE_SYNC':
      // Force immediate data sync
      syncAirQualityData();
      break;
      
    case 'CACHE_NEW_ROUTE':
      // Cache a new route
      const url = event.data.payload;
      caches.open(RUNTIME_CACHE).then(cache => {
        cache.add(url);
      });
      break;
      
    case 'CLEAR_CACHE':
      // Clear all caches
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => caches.delete(cacheName))
        );
      }).then(() => {
        console.log('[SW] All caches cleared');
        event.ports[0]?.postMessage({ success: true });
      });
      break;
      
    case 'GET_CACHE_STATUS':
      // Return cache status information
      getCacheStatus().then(status => {
        event.ports[0]?.postMessage(status);
      });
      break;
      
    case 'REGISTER_BACKGROUND_SYNC':
      // Register background sync
      const tag = event.data.payload?.tag || 'airwatch-data-sync';
      self.registration.sync.register(tag).then(() => {
        console.log('[SW] Background sync registered:', tag);
      }).catch(error => {
        console.error('[SW] Failed to register background sync:', error);
      });
      break;
      
    default:
      console.log('[SW] Unknown message type:', event.data.type);
  }
});

// Get comprehensive cache status
async function getCacheStatus() {
  const cacheNames = await caches.keys();
  const cacheStatus = {};
  
  for (const cacheName of cacheNames) {
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();
    cacheStatus[cacheName] = {
      size: keys.length,
      urls: keys.map(request => request.url)
    };
  }
  
  return {
    caches: cacheStatus,
    totalCaches: cacheNames.length,
    timestamp: Date.now()
  };
}

// Update user preferences (simplified - real implementation would use IndexedDB)
async function updateUserPreferences(preferences) {
  try {
    // In production, this would update IndexedDB
    console.log('[SW] Updating user preferences:', preferences);
    
    // Trigger sync if location changed
    if (preferences.location) {
      await syncAirQualityData();
    }
  } catch (error) {
    console.error('[SW] Failed to update preferences:', error);
  }
}

// Storage helpers for notification timing
async function getLastNotificationTime() {
  try {
    // In production, use IndexedDB
    return parseInt(localStorage.getItem('lastNotificationTime') || '0');
  } catch {
    return 0;
  }
}

async function setLastNotificationTime(timestamp) {
  try {
    // In production, use IndexedDB
    localStorage.setItem('lastNotificationTime', timestamp.toString());
  } catch (error) {
    console.error('[SW] Failed to set notification time:', error);
  }
}