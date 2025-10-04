export interface AirQualityData {
  location: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  aqi: number;
  level: 'Good' | 'Moderate' | 'Unhealthy for Sensitive Groups' | 'Unhealthy' | 'Very Unhealthy' | 'Hazardous';
  pollutants: {
    pm25: number;
    pm10: number;
    o3: number;
    no2: number;
    so2: number;
    co: number;
  };
  timestamp: string;
  source: 'OpenAQ' | 'Ground Station' | 'Weather API' | 'EPA_AIRNOW' | 'WAQI' | 'FUSED_DATA' | 'GEOS';
}

export interface ForecastData {
  date: string;
  aqi: number;
  level: 'Good' | 'Moderate' | 'Unhealthy for Sensitive Groups' | 'Unhealthy' | 'Very Unhealthy' | 'Hazardous';
  temperature: number;
  humidity: number;
  windSpeed: number;
}

export interface Alert {
  id: string;
  type: 'health' | 'pollution' | 'weather';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  timestamp: string;
  location: string;
  isActive?: boolean;
}

export interface UserPreferences {
  location: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  healthSensitivity: 'low' | 'moderate' | 'high';
  alertTypes: string[];
  units: 'metric' | 'imperial';
}

export interface HistoricalData {
  date: string;
  aqi: number;
  pm25: number;
  o3: number;
  temperature: number;
}

// New types for enhanced data integration
export interface WeatherData {
  coordinates: {
    lat: number;
    lng: number;
  };
  timestamp: string;
  temperature: number; // °C
  humidity: number; // %
  pressure: number; // hPa
  windSpeed: number; // m/s
  windDirection: number; // degrees
  precipitation: number; // mm/hr
  uvIndex: number; // 0-11
  visibility: number; // km
  boundary_layer_height: number; // meters
  source: 'GEOS' | 'GEOS_FORECAST' | 'OpenWeather' | 'NOAA';
}

export interface PersonalizedAlert {
  id: string;
  userId?: string;
  timestamp: Date;
  location: string;
  severity: 'low' | 'medium' | 'high';
  parameter: string;
  value: number;
  threshold: number;
  message: string;
  recommendations: string[];
  duration: string;
  uncertainty: number;
  coordinates?: {
    lat: number;
    lng: number;
  };
  sensitiveGroup?: 'children' | 'elderly' | 'asthma' | 'heart_disease' | 'pregnancy' | 'general';
  alertThreshold?: number; // AQI threshold
  isEnabled?: boolean;
  notificationMethod?: 'push' | 'email' | 'sms';
  createdAt?: string;
  lastTriggered?: string;
}

export interface UncertaintyModel {
  aqi_uncertainty: {
    no2: number;
    hcho: number;
  };
  confidence_interval: [number, number]; // [lower, upper] AQI bounds
  data_quality: 'High' | 'Medium' | 'Low';
  model_performance?: {
    bias: number;
    rmse: number;
    correlation: number;
  };
}

export interface FusedDataResponse {
  current: AirQualityData;
  forecast: ForecastData[];
  uncertainty: UncertaintyModel;
  sources: string[];
}

export interface DayPlannerData {
  hourlyForecast: {
    hour: number;
    aqi: number;
    level: string;
    activity_recommendation: 'excellent' | 'good' | 'moderate' | 'limited' | 'avoid';
    outdoor_exercise: boolean;
    sensitive_groups_warning: boolean;
  }[];
  dailySummary: {
    peak_aqi: number;
    peak_time: string;
    best_air_time: string;
    worst_air_time: string;
    overall_recommendation: string;
  };
}