/**
 * Frontend Configuration
 * Manages environment variables and app settings
 */

export interface AppConfig {
  // API Configuration
  apiBaseUrl: string;
  apiTimeout: number;

  // Feature Flags
  enableSatelliteData: boolean;
  enableHistoricalData: boolean;
  enableForecasts: boolean;
  enableAlerts: boolean;

  // Development Settings
  debugMode: boolean;
  logLevel: 'error' | 'warn' | 'info' | 'debug';

  // Map Configuration
  defaultMapCenter: {
    lat: number;
    lng: number;
  };
  defaultMapZoom: number;

  // Data Refresh Intervals (in milliseconds)
  currentDataRefreshInterval: number;
  historicalDataRefreshInterval: number;
  locationsCacheDuration: number;

  // UI Configuration
  maxHistoricalHours: number;
  defaultSearchRadiusKm: number;
  maxMonitoringStations: number;
}

class ConfigManager {
  private config: AppConfig;

  constructor() {
    this.config = this.loadConfig();
  }

  private loadConfig(): AppConfig {
    return {
      // API Configuration
      apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000',
      apiTimeout: Number(import.meta.env.VITE_API_TIMEOUT) || 30000,

      // Feature Flags
      enableSatelliteData: import.meta.env.VITE_ENABLE_SATELLITE_DATA === 'true',
      enableHistoricalData: import.meta.env.VITE_ENABLE_HISTORICAL_DATA === 'true',
      enableForecasts: import.meta.env.VITE_ENABLE_FORECASTS === 'true',
      enableAlerts: import.meta.env.VITE_ENABLE_ALERTS === 'true',

      // Development Settings
      debugMode: import.meta.env.VITE_DEBUG_MODE === 'true' || import.meta.env.DEV,
      logLevel: (import.meta.env.VITE_LOG_LEVEL as AppConfig['logLevel']) || 'warn',

      // Map Configuration
      defaultMapCenter: {
        lat: Number(import.meta.env.VITE_DEFAULT_MAP_CENTER_LAT) || 40.7128,
        lng: Number(import.meta.env.VITE_DEFAULT_MAP_CENTER_LNG) || -74.0060,
      },
      defaultMapZoom: Number(import.meta.env.VITE_DEFAULT_MAP_ZOOM) || 10,

      // Data Refresh Intervals (convert seconds to milliseconds)
      currentDataRefreshInterval: (Number(import.meta.env.VITE_CURRENT_DATA_REFRESH_INTERVAL) || 300) * 1000,
      historicalDataRefreshInterval: (Number(import.meta.env.VITE_HISTORICAL_DATA_REFRESH_INTERVAL) || 3600) * 1000,
      locationsCacheDuration: (Number(import.meta.env.VITE_LOCATIONS_CACHE_DURATION) || 1800) * 1000,

      // UI Configuration
      maxHistoricalHours: Number(import.meta.env.VITE_MAX_HISTORICAL_HOURS) || 168,
      defaultSearchRadiusKm: Number(import.meta.env.VITE_DEFAULT_SEARCH_RADIUS_KM) || 50,
      maxMonitoringStations: Number(import.meta.env.VITE_MAX_MONITORING_STATIONS) || 100,
    };
  }

  // Getters for configuration values
  get apiBaseUrl(): string {
    return this.config.apiBaseUrl;
  }

  get apiTimeout(): number {
    return this.config.apiTimeout;
  }

  get enableSatelliteData(): boolean {
    return this.config.enableSatelliteData;
  }

  get enableHistoricalData(): boolean {
    return this.config.enableHistoricalData;
  }

  get enableForecasts(): boolean {
    return this.config.enableForecasts;
  }

  get enableAlerts(): boolean {
    return this.config.enableAlerts;
  }

  get debugMode(): boolean {
    return this.config.debugMode;
  }

  get logLevel(): AppConfig['logLevel'] {
    return this.config.logLevel;
  }

  get defaultMapCenter(): { lat: number; lng: number } {
    return this.config.defaultMapCenter;
  }

  get defaultMapZoom(): number {
    return this.config.defaultMapZoom;
  }

  get currentDataRefreshInterval(): number {
    return this.config.currentDataRefreshInterval;
  }

  get historicalDataRefreshInterval(): number {
    return this.config.historicalDataRefreshInterval;
  }

  get locationsCacheDuration(): number {
    return this.config.locationsCacheDuration;
  }

  get maxHistoricalHours(): number {
    return this.config.maxHistoricalHours;
  }

  get defaultSearchRadiusKm(): number {
    return this.config.defaultSearchRadiusKm;
  }

  get maxMonitoringStations(): number {
    return this.config.maxMonitoringStations;
  }

  // Get all configuration
  getConfig(): AppConfig {
    return { ...this.config };
  }

  // Update API base URL (useful for switching environments)
  updateApiBaseUrl(url: string): void {
    this.config.apiBaseUrl = url;
  }

  // Utility methods
  isDevelopment(): boolean {
    return import.meta.env.DEV;
  }

  isProduction(): boolean {
    return import.meta.env.PROD;
  }

  // Logging utility
  log(level: AppConfig['logLevel'], message: string, ...args: unknown[]): void {
    if (!this.shouldLog(level)) return;

    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level.toUpperCase()}]`;

    switch (level) {
      case 'error':
        console.error(prefix, message, ...args);
        break;
      case 'warn':
        console.warn(prefix, message, ...args);
        break;
      case 'info':
        console.info(prefix, message, ...args);
        break;
      case 'debug':
        console.debug(prefix, message, ...args);
        break;
    }
  }

  private shouldLog(level: AppConfig['logLevel']): boolean {
    const levels = ['error', 'warn', 'info', 'debug'];
    const currentLevelIndex = levels.indexOf(this.config.logLevel);
    const messageLevelIndex = levels.indexOf(level);
    return messageLevelIndex <= currentLevelIndex;
  }

  // Environment info
  getEnvironmentInfo(): Record<string, unknown> {
    return {
      mode: import.meta.env.MODE,
      dev: import.meta.env.DEV,
      prod: import.meta.env.PROD,
      baseUrl: import.meta.env.BASE_URL,
      apiBaseUrl: this.config.apiBaseUrl,
      debugMode: this.config.debugMode,
      logLevel: this.config.logLevel,
    };
  }
}

// Create and export singleton instance
export const config = new ConfigManager();

// Export the class for testing
export default ConfigManager;