/**
 * API Client for AirWatch Backend
 * Handles all communication with the Python FastAPI backend
 */

import axios from 'axios';
import { config } from '../lib/config';

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface Pollutants {
  pm25: number;
  pm10: number;
  o3: number;
  no2: number;
  so2: number;
  co: number;
}

export interface AirQualityReading {
  location: string;
  coordinates: Coordinates;
  timestamp: string;
  aqi: number;
  dominant_pollutant: string;
  pollutants: Pollutants;
  aqi_level: 'GOOD' | 'MODERATE' | 'UNHEALTHY_FOR_SENSITIVE' | 'UNHEALTHY' | 'VERY_UNHEALTHY' | 'HAZARDOUS';
  health_message: string;
  data_source: string;
  last_updated: string;
}

export interface AirQualityResponse extends ApiResponse<AirQualityReading> {
  satellite_data?: Record<string, unknown>;
  forecast?: Record<string, unknown>[];
  alerts?: Record<string, unknown>[];
}

export interface HistoricalDataPoint {
  timestamp: string;
  aqi: number;
  pm25: number;
  pm10: number;
  o3: number;
  no2: number;
}

export interface HistoricalDataResponse extends ApiResponse<HistoricalDataPoint[]> {
  location: string;
  coordinates: Coordinates;
  start_date: string;
  end_date: string;
  total_points: number;
}

export interface LocationSearchResult {
  name: string;
  coordinates: Coordinates;
  country: string;
  source_count: number;
  last_updated: string;
}

export interface LocationSearchResponse extends ApiResponse<LocationSearchResult[]> {
  total_results: number;
}

export interface MonitoringStation {
  id: string;
  name: string;
  coordinates: Coordinates;
  agency: string;
  station_type: string;
  pollutants: string[];
  last_updated: string;
  data_source: string;
  distance_km?: number;
}

export interface ServiceStatus {
  service: string;
  status: 'operational' | 'degraded' | 'error';
  coverage?: string;
  stations?: string;
  last_checked: string;
  api_key_configured?: boolean;
  cache_size?: number;
  error?: string;
}

export interface HealthCheckResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  version: string;
  services: Record<string, ServiceStatus>;
  uptime_seconds: number;
}

class ApiClient {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private client: any;
  private baseURL: string;

  constructor(baseURL?: string) {
    this.baseURL = baseURL || config.apiBaseUrl;
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: config.apiTimeout,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor for logging
    this.client.interceptors.request.use(
      (config) => {
        console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        console.error('API Request Error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => {
        console.log(`API Response: ${response.status} ${response.config.url}`);
        return response;
      },
      (error) => {
        console.error('API Response Error:', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          url: error.config?.url,
        });
        return Promise.reject(error);
      }
    );
  }

  // === HEALTH CHECK ===
  async healthCheck(): Promise<HealthCheckResponse> {
    try {
      const response = await this.client.get('/health');
      return response.data;
    } catch (error) {
      console.error('Health check failed:', error);
      throw new Error('Failed to check API health');
    }
  }

  // === AIR QUALITY ENDPOINTS ===
  async getCurrentAirQuality(
    latitude: number,
    longitude: number,
    options: {
      includeSatellite?: boolean;
      includeForecast?: boolean;
      includeAlerts?: boolean;
    } = {}
  ): Promise<AirQualityResponse> {
    try {
      const params = new URLSearchParams({
        latitude: latitude.toString(),
        longitude: longitude.toString(),
        include_satellite: (options.includeSatellite || false).toString(),
        include_forecast: (options.includeForecast || false).toString(),
        include_alerts: (options.includeAlerts !== false).toString(),
      });

      const response = await this.client.get(`/air-quality/current?${params}`);
      return response.data;
    } catch (error: unknown) {
      console.error('Failed to get current air quality:', error);
      const errorMessage = (error as { response?: { data?: { detail?: string } } }).response?.data?.detail || 'Failed to get current air quality data';
      throw new Error(errorMessage);
    }
  }

  async getHistoricalAirQuality(
    latitude: number,
    longitude: number,
    hours: number = 24,
    pollutants: string[] = ['aqi', 'pm25', 'pm10', 'o3', 'no2']
  ): Promise<HistoricalDataResponse> {
    try {
      const params = new URLSearchParams({
        latitude: latitude.toString(),
        longitude: longitude.toString(),
        hours: hours.toString(),
      });

      // Add pollutants as multiple query parameters
      pollutants.forEach(pollutant => {
        params.append('pollutants', pollutant);
      });

      const response = await this.client.get(`/air-quality/historical?${params}`);
      return response.data;
    } catch (error: unknown) {
      console.error('Failed to get historical air quality:', error);
      const errorMessage = (error as { response?: { data?: { detail?: string } } }).response?.data?.detail || 'Failed to get historical air quality data';
      throw new Error(errorMessage);
    }
  }

  // === LOCATION ENDPOINTS ===
  async searchLocations(query: string, limit: number = 10): Promise<LocationSearchResponse> {
    try {
      const params = new URLSearchParams({
        query,
        limit: limit.toString(),
      });

      const response = await this.client.get(`/locations/search?${params}`);
      return response.data;
    } catch (error: unknown) {
      console.error('Failed to search locations:', error);
      const errorMessage = (error as { response?: { data?: { detail?: string } } }).response?.data?.detail || 'Failed to search locations';
      throw new Error(errorMessage);
    }
  }

  async getMonitoringStations(
    latitude?: number,
    longitude?: number,
    radiusKm: number = 50,
    country?: string,
    limit: number = 100
  ): Promise<{ success: boolean; stations: MonitoringStation[]; total_count: number }> {
    try {
      const params = new URLSearchParams({
        radius_km: radiusKm.toString(),
        limit: limit.toString(),
      });

      if (latitude !== undefined && longitude !== undefined) {
        params.append('latitude', latitude.toString());
        params.append('longitude', longitude.toString());
      }

      if (country) {
        params.append('country', country);
      }

      const response = await this.client.get(`/locations/stations?${params}`);
      return response.data as { success: boolean; stations: MonitoringStation[]; total_count: number };
    } catch (error: unknown) {
      console.error('Failed to get monitoring stations:', error);
      const errorMessage = (error as { response?: { data?: { detail?: string } } }).response?.data?.detail || 'Failed to get monitoring stations';
      throw new Error(errorMessage);
    }
  }

  // === SATELLITE DATA ENDPOINTS ===
  async getTempoSatelliteData(latitude: number, longitude: number): Promise<{ success: boolean; data: Record<string, unknown> }> {
    try {
      const params = new URLSearchParams({
        latitude: latitude.toString(),
        longitude: longitude.toString(),
      });

      const response = await this.client.get(`/satellite/tempo?${params}`);
      return response.data as { success: boolean; data: Record<string, unknown> };
    } catch (error: unknown) {
      console.error('Failed to get TEMPO satellite data:', error);
      const errorMessage = (error as { response?: { data?: { detail?: string } } }).response?.data?.detail || 'Failed to get satellite data';
      throw new Error(errorMessage);
    }
  }

  async getTempoCoverage(): Promise<{ success: boolean; coverage: Record<string, unknown>; parameters: Record<string, unknown> }> {
    try {
      const response = await this.client.get('/satellite/tempo/coverage');
      return response.data as { success: boolean; coverage: Record<string, unknown>; parameters: Record<string, unknown> };
    } catch (error: unknown) {
      console.error('Failed to get TEMPO coverage:', error);
      const errorMessage = (error as { response?: { data?: { detail?: string } } }).response?.data?.detail || 'Failed to get TEMPO coverage';
      throw new Error(errorMessage);
    }
  }

  // === SERVICE STATUS ENDPOINTS ===
  async getServicesStatus(): Promise<{ success: boolean; services: Record<string, ServiceStatus>; timestamp: string }> {
    try {
      const response = await this.client.get('/services/status');
      return response.data as { success: boolean; services: Record<string, ServiceStatus>; timestamp: string };
    } catch (error: unknown) {
      console.error('Failed to get services status:', error);
      const errorMessage = (error as { response?: { data?: { detail?: string } } }).response?.data?.detail || 'Failed to get services status';
      throw new Error(errorMessage);
    }
  }

  // === CACHE MANAGEMENT ===
  async clearAllCaches(): Promise<{ success: boolean; message: string; timestamp: string }> {
    try {
      const response = await this.client.post('/cache/clear');
      return response.data as { success: boolean; message: string; timestamp: string };
    } catch (error: unknown) {
      console.error('Failed to clear caches:', error);
      const errorMessage = (error as { response?: { data?: { detail?: string } } }).response?.data?.detail || 'Failed to clear caches';
      throw new Error(errorMessage);
    }
  }

  // === UTILITY METHODS ===
  setBaseURL(baseURL: string): void {
    this.baseURL = baseURL;
    this.client.defaults.baseURL = baseURL;
  }

  getBaseURL(): string {
    return this.baseURL;
  }

  // Test API connectivity
  async testConnection(): Promise<boolean> {
    try {
      const response = await this.client.get('/');
      return response.status === 200;
    } catch (error) {
      console.error('API connection test failed:', error);
      return false;
    }
  }
}

// Create and export singleton instance
export const apiClient = new ApiClient();

// Export the class for custom instances
export default ApiClient;