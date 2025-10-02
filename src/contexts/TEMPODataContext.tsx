import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { TempoData } from '@/types/airQuality';
import { apiClient } from '@/lib/apiClient';
import { config } from '@/lib/config';
import { useLocation } from '@/hooks/useLocation';

interface TEMPODataCache {
  data: TempoData;
  timestamp: number;
  coordinates: { lat: number; lng: number };
}

interface TEMPODataContextType {
  tempoData: TempoData | null;
  loading: boolean;
  error: string | null;
  lastUpdate: Date | null;
  nextUpdate: Date | null;
  isStale: boolean;
  refreshTEMPOData: () => Promise<void>;
  getCachedData: (lat: number, lng: number) => TempoData | null;
}

const TEMPODataContext = createContext<TEMPODataContextType | undefined>(undefined);

const CACHE_DURATION = 60 * 60 * 1000; // 1 hour in milliseconds
const UPDATE_INTERVAL = 60 * 60 * 1000; // 1 hour in milliseconds
const LOCATION_TOLERANCE = 0.01; // ~1km tolerance for cache location matching

export const TEMPODataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { location } = useLocation();
  const [tempoData, setTEMPOData] = useState<TempoData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [nextUpdate, setNextUpdate] = useState<Date | null>(null);
  const [cache, setCache] = useState<TEMPODataCache[]>([]);

  // Check if cached data is valid for given coordinates
  const getCachedData = useCallback((lat: number, lng: number): TempoData | null => {
    const now = Date.now();
    
    for (const cached of cache) {
      const latDiff = Math.abs(cached.coordinates.lat - lat);
      const lngDiff = Math.abs(cached.coordinates.lng - lng);
      const isWithinBounds = latDiff <= LOCATION_TOLERANCE && lngDiff <= LOCATION_TOLERANCE;
      const isNotExpired = (now - cached.timestamp) < CACHE_DURATION;
      
      if (isWithinBounds && isNotExpired) {
        config.log('info', 'Using cached TEMPO data', { lat, lng, age: now - cached.timestamp });
        return cached.data;
      }
    }
    
    return null;
  }, [cache]);

  // Add data to cache
  const addToCache = useCallback((data: TempoData, lat: number, lng: number) => {
    const now = Date.now();
    
    setCache(prevCache => {
      // Remove expired entries and duplicates
      const filteredCache = prevCache.filter(cached => {
        const isNotExpired = (now - cached.timestamp) < CACHE_DURATION;
        const latDiff = Math.abs(cached.coordinates.lat - lat);
        const lngDiff = Math.abs(cached.coordinates.lng - lng);
        const isDifferentLocation = latDiff > LOCATION_TOLERANCE || lngDiff > LOCATION_TOLERANCE;
        
        return isNotExpired && isDifferentLocation;
      });
      
      // Add new entry
      const newEntry: TEMPODataCache = {
        data,
        timestamp: now,
        coordinates: { lat, lng }
      };
      
      return [...filteredCache, newEntry].slice(-10); // Keep only last 10 entries
    });
  }, []);

  // Fetch TEMPO data from API
  const fetchTEMPOData = useCallback(async (lat: number, lng: number, useCache = true): Promise<TempoData | null> => {
    // Check cache first
    if (useCache) {
      const cachedData = getCachedData(lat, lng);
      if (cachedData) {
        return cachedData;
      }
    }

    try {
      config.log('info', 'Fetching TEMPO data from API', { lat, lng });
      
      const response = await apiClient.getTEMPOSatelliteData(lat, lng);
      
      if (response.success && response.data) {
        const data = response.data as TempoData;
        
        // Add to cache
        addToCache(data, lat, lng);
        
        config.log('info', 'Successfully fetched TEMPO data');
        return data;
      } else {
        config.log('warn', 'TEMPO API returned unsuccessful response');
        return null;
      }
    } catch (error) {
      config.log('error', 'Failed to fetch TEMPO data', error);
      throw error;
    }
  }, [getCachedData, addToCache]);

  // Refresh TEMPO data
  const refreshTEMPOData = useCallback(async () => {
    if (!location.coordinates) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await fetchTEMPOData(
        location.coordinates.lat,
        location.coordinates.lng,
        false // Force fresh data on manual refresh
      );
      
      setTEMPOData(data);
      setLastUpdate(new Date());
      
      // Calculate next update time
      const next = new Date();
      next.setHours(next.getHours() + 1);
      next.setMinutes(0);
      next.setSeconds(0);
      next.setMilliseconds(0);
      setNextUpdate(next);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch TEMPO data';
      setError(errorMessage);
      config.log('error', 'TEMPO data refresh failed', error);
    } finally {
      setLoading(false);
    }
  }, [location.coordinates, fetchTEMPOData]);

  // Auto-fetch data when location changes
  useEffect(() => {
    if (!location.coordinates) {
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        const data = await fetchTEMPOData(
          location.coordinates.lat,
          location.coordinates.lng
        );
        
        setTEMPOData(data);
        setLastUpdate(new Date());
        
        // Calculate next update time
        const next = new Date();
        next.setHours(next.getHours() + 1);
        next.setMinutes(0);
        next.setSeconds(0);
        next.setMilliseconds(0);
        setNextUpdate(next);
        
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to fetch TEMPO data';
        setError(errorMessage);
        config.log('error', 'TEMPO data fetch failed', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [location.coordinates, fetchTEMPOData]);

  // Set up automatic updates
  useEffect(() => {
    if (!location.coordinates || !tempoData) {
      return;
    }

    const updateInterval = setInterval(() => {
      config.log('info', 'Auto-refreshing TEMPO data');
      refreshTEMPOData();
    }, UPDATE_INTERVAL);

    return () => {
      clearInterval(updateInterval);
    };
  }, [location.coordinates, tempoData, refreshTEMPOData]);

  // Calculate if data is stale
  const isStale = lastUpdate ? (Date.now() - lastUpdate.getTime()) > CACHE_DURATION : true;

  const value: TEMPODataContextType = {
    tempoData,
    loading,
    error,
    lastUpdate,
    nextUpdate,
    isStale,
    refreshTEMPOData,
    getCachedData
  };

  return (
    <TEMPODataContext.Provider value={value}>
      {children}
    </TEMPODataContext.Provider>
  );
};

export const useTEMPOData = (): TEMPODataContextType => {
  const context = useContext(TEMPODataContext);
  
  if (context === undefined) {
    throw new Error('useTEMPOData must be used within a TEMPODataProvider');
  }
  
  return context;
};