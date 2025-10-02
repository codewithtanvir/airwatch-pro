/**
 * Location Context
 * Manages location state across the application
 */

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { apiClient, type LocationSearchResult } from '@/lib/apiClient';
import { config } from '@/lib/config';

export interface LocationState {
  coordinates: {
    lat: number;
    lng: number;
  };
  locationName: string;
  isDetecting: boolean;
  lastUpdated: Date | null;
  error: string | null;
}

export interface LocationContextType {
  location: LocationState;
  setLocation: (coordinates: { lat: number; lng: number }, name?: string) => void;
  detectCurrentLocation: () => Promise<void>;
  searchLocations: (query: string) => Promise<LocationSearchResult[]>;
  clearError: () => void;
  retryLocationDetection: () => Promise<void>;
  isLoading: boolean;
}

const defaultLocation: LocationState = {
  coordinates: config.defaultMapCenter,
  locationName: 'New York, NY, USA',
  isDetecting: false,
  lastUpdated: null,
  error: null,
};

const LocationContext = createContext<LocationContextType | undefined>(undefined);

interface LocationProviderProps {
  children: ReactNode;
}

export const LocationProvider: React.FC<LocationProviderProps> = ({ children }) => {
  const [location, setLocationState] = useState<LocationState>(() => {
    // Try to load from localStorage
    const stored = localStorage.getItem('airwatch-location');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        return {
          ...defaultLocation,
          ...parsed,
          lastUpdated: parsed.lastUpdated ? new Date(parsed.lastUpdated) : null,
        };
      } catch (error) {
        config.log('warn', 'Failed to parse stored location data', error);
      }
    }
    return defaultLocation;
  });

  const [isLoading, setIsLoading] = useState(false);

  // Persist location to localStorage
  useEffect(() => {
    const locationData = {
      coordinates: location.coordinates,
      locationName: location.locationName,
      lastUpdated: location.lastUpdated?.toISOString() || null,
    };
    localStorage.setItem('airwatch-location', JSON.stringify(locationData));
  }, [location]);

  const setLocation = (coordinates: { lat: number; lng: number }, name?: string) => {
    config.log('info', 'Setting location:', coordinates, name);
    
    setLocationState(prev => ({
      ...prev,
      coordinates,
      locationName: name || `${coordinates.lat.toFixed(3)}, ${coordinates.lng.toFixed(3)}`,
      lastUpdated: new Date(),
      error: null,
    }));
  };

  const detectCurrentLocation = async (): Promise<void> => {
    if (!navigator.geolocation) {
      const error = 'Geolocation is not supported by this browser. Please enter your location manually.';
      config.log('error', error);
      setLocationState(prev => ({ ...prev, error, isDetecting: false }));
      return;
    }

    setLocationState(prev => ({ ...prev, isDetecting: true, error: null }));

    try {
      // First, try to get high accuracy location
      let position: GeolocationPosition;
      try {
        position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(
            resolve,
            reject,
            {
              enableHighAccuracy: true,
              timeout: 8000,
              maximumAge: 30000, // Use cached position if less than 30 seconds old
            }
          );
        });
      } catch (highAccuracyError) {
        // If high accuracy fails, try with lower accuracy
        config.log('warn', 'High accuracy location failed, trying low accuracy', highAccuracyError);
        position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(
            resolve,
            reject,
            {
              enableHighAccuracy: false,
              timeout: 15000,
              maximumAge: 60000, // Use cached position if less than 1 minute old
            }
          );
        });
      }

      const coordinates = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      };

      config.log('info', 'Detected current location:', coordinates, `Accuracy: ${position.coords.accuracy}m`);

      // Try to get location name from coordinates using reverse geocoding
      try {
        const locations = await searchLocations(`${coordinates.lat},${coordinates.lng}`);
        const locationName = locations[0]?.name || 
          `Location (${coordinates.lat.toFixed(3)}, ${coordinates.lng.toFixed(3)})`;
        setLocation(coordinates, locationName);
      } catch (searchError) {
        config.log('warn', 'Failed to get location name, using coordinates', searchError);
        setLocation(coordinates, `Current Location (${coordinates.lat.toFixed(3)}, ${coordinates.lng.toFixed(3)})`);
      }
    } catch (error) {
      let errorMessage = 'Failed to detect your current location';
      
      if (error instanceof GeolocationPositionError) {
        switch (error.code) {
          case GeolocationPositionError.PERMISSION_DENIED:
            errorMessage = 'Location access denied. Please enable location permissions in your browser settings.';
            break;
          case GeolocationPositionError.POSITION_UNAVAILABLE:
            errorMessage = 'Your location is currently unavailable. Please check your internet connection or enter your location manually.';
            break;
          case GeolocationPositionError.TIMEOUT:
            errorMessage = 'Location detection timed out. Please try again or enter your location manually.';
            break;
        }
      }

      config.log('error', 'Geolocation error:', error);
      setLocationState(prev => ({ ...prev, error: errorMessage, isDetecting: false }));
      throw new Error(errorMessage);
    } finally {
      setLocationState(prev => ({ ...prev, isDetecting: false }));
    }
  };

  const searchLocations = async (query: string): Promise<LocationSearchResult[]> => {
    setIsLoading(true);
    try {
      config.log('info', 'Searching locations for:', query);
      const response = await apiClient.searchLocations(query, 10);
      
      if (response.success && response.data) {
        config.log('info', 'Found locations:', response.data.length);
        return response.data;
      } else {
        throw new Error(response.error || 'Failed to search locations');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to search locations';
      config.log('error', 'Location search error:', error);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const clearError = () => {
    setLocationState(prev => ({ ...prev, error: null }));
  };

  const retryLocationDetection = async () => {
    clearError();
    await detectCurrentLocation();
  };

  const contextValue: LocationContextType = {
    location,
    setLocation,
    detectCurrentLocation,
    searchLocations,
    clearError,
    retryLocationDetection,
    isLoading,
  };

  return (
    <LocationContext.Provider value={contextValue}>
      {children}
    </LocationContext.Provider>
  );
};

export default LocationContext;