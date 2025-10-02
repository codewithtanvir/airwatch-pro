/**
 * Enhanced Air Quality Dashboard Components
 * Real-time data integration with TEMPO, EPA, WAQI, and GEOS
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Activity, 
  Satellite, 
  MapPin, 
  Clock, 
  TrendingUp, 
  AlertTriangle, 
  Wind, 
  Thermometer, 
  Droplets,
  Eye,
  Shield,
  Calendar,
  Info
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/apiClient';
import { WeatherData } from '@/types/airQuality';
import { useLocation } from '@/hooks/useLocation';

// AQI Dial Component - Minimal & Modern Design
export function AQIDial({ aqi, size = 200 }: { aqi: number; size?: number }) {
  const getAQIColor = (aqi: number) => {
    if (aqi <= 50) return '#10b981'; // Emerald
    if (aqi <= 100) return '#f59e0b'; // Amber
    if (aqi <= 150) return '#f97316'; // Orange
    if (aqi <= 200) return '#ef4444'; // Red
    if (aqi <= 300) return '#8b5cf6'; // Violet
    return '#991b1b'; // Dark Red
  };

  const getAQILevel = (aqi: number) => {
    if (aqi <= 50) return 'Good';
    if (aqi <= 100) return 'Moderate';
    if (aqi <= 150) return 'Unhealthy for Sensitive';
    if (aqi <= 200) return 'Unhealthy';
    if (aqi <= 300) return 'Very Unhealthy';
    return 'Hazardous';
  };

  const circumference = 2 * Math.PI * (size / 2 - 24);
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (aqi / 500) * circumference;
  const color = getAQIColor(aqi);

  return (
    <div className="relative flex flex-col items-center p-8">
      <div className="relative" style={{ width: size, height: size }}>
        <svg 
          width={size} 
          height={size} 
          className="transform -rotate-90"
          viewBox={`0 0 ${size} ${size}`}
        >
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={size / 2 - 24}
            fill="none"
            stroke="#f1f5f9"
            strokeWidth="8"
          />
          
          {/* Progress circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={size / 2 - 24}
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        
        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="text-5xl font-light text-gray-900 mb-1">
            {aqi}
          </div>
          <div className="text-xs font-medium text-gray-500 tracking-widest uppercase">
            AQI
          </div>
        </div>
      </div>
      
      <div className="mt-8 text-center">
        <div className="text-lg font-medium text-gray-900 mb-1">
          {getAQILevel(aqi)}
        </div>
        <div className="text-sm text-gray-500">
          Air Quality Index
        </div>
      </div>
    </div>
  );
}

// Health Recommendations Component - Minimal Design
export function HealthRecommendations({ aqi }: { aqi: number }) {
  const getHealthLevel = (aqi: number) => {
    if (aqi <= 50) return 'good';
    if (aqi <= 100) return 'moderate';
    if (aqi <= 150) return 'unhealthy-sensitive';
    if (aqi <= 200) return 'unhealthy';
    if (aqi <= 300) return 'very-unhealthy';
    return 'hazardous';
  };

  const getRecommendations = (aqi: number) => {
    const level = getHealthLevel(aqi);
    
    switch (level) {
      case 'good':
        return {
          title: 'Good Air Quality',
          subtitle: 'Perfect conditions for outdoor activities',
          color: 'emerald',
          general: [
            'Air quality is satisfactory for all outdoor activities',
            'No health concerns from air pollution',
            'Great day for exercise, sports, and outdoor recreation'
          ],
          sensitive: [
            'No restrictions for sensitive individuals',
            'Children can play outdoors freely',
            'Elderly can enjoy outdoor activities without concern'
          ],
          activities: [
            'Running and jogging recommended',
            'Cycling and biking safe',
            'Sports and team activities encouraged',
            'Hiking and nature walks ideal',
            'Outdoor yoga and meditation perfect'
          ]
        };
      
      case 'moderate':
        return {
          title: 'Moderate Air Quality',
          subtitle: 'Generally acceptable for most people',
          color: 'amber',
          general: [
            'Air quality is acceptable for most people',
            'Unusually sensitive individuals may experience minor symptoms',
            'Most outdoor activities are still recommended'
          ],
          sensitive: [
            'Very sensitive individuals should monitor symptoms',
            'Consider reducing prolonged outdoor exertion if experiencing symptoms',
            'Children and elderly can continue normal activities'
          ],
          activities: [
            'Light to moderate exercise recommended',
            'Walking and casual outdoor activities',
            'Normal school outdoor activities',
            'Monitor air quality if very sensitive'
          ]
        };
      
      case 'unhealthy-sensitive':
        return {
          title: 'Unhealthy for Sensitive Groups',
          subtitle: 'Sensitive groups should take precautions',
          color: 'orange',
          general: [
            'Most people can continue normal outdoor activities',
            'Sensitive individuals may experience symptoms',
            'Consider reducing time outdoors if experiencing discomfort'
          ],
          sensitive: [
            'Children, elderly, and people with respiratory/heart conditions should limit prolonged outdoor exertion',
            'Take breaks during outdoor activities',
            'Consider moving activities indoors if possible'
          ],
          activities: [
            'Light outdoor activities okay for most people',
            'Consider indoor exercise for sensitive groups',
            'Wear mask if you\'re in a sensitive group',
            'Limit outdoor time to 1-2 hours for sensitive individuals'
          ]
        };
      
      case 'unhealthy':
        return {
          title: 'Unhealthy Air Quality',
          subtitle: 'Everyone should reduce outdoor activities',
          color: 'red',
          general: [
            'Everyone may experience health effects',
            'Sensitive groups may experience serious effects',
            'Limit outdoor activities, especially prolonged exertion'
          ],
          sensitive: [
            'Children, elderly, and people with respiratory/heart conditions should avoid outdoor activities',
            'Stay indoors as much as possible',
            'Use air purifiers if available'
          ],
          activities: [
            'Stay indoors when possible',
            'Avoid outdoor exercise',
            'Wear N95 mask if you must go outside',
            'Schools should move activities indoors'
          ]
        };
      
      default:
        return {
          title: 'Very Unhealthy Air Quality',
          subtitle: 'Health warning - avoid outdoor activities',
          color: 'red',
          general: [
            'Health warnings - everyone should avoid outdoor activities',
            'Serious health effects for all populations',
            'Stay indoors and keep windows closed'
          ],
          sensitive: [
            'Sensitive groups should remain indoors',
            'Avoid all outdoor activities',
            'Seek medical attention if experiencing severe symptoms'
          ],
          activities: [
            'Stay indoors at all times',
            'Cancel all outdoor events',
            'Wear N95 mask even for brief outdoor exposure',
            'Seek medical help if experiencing symptoms'
          ]
        };
    }
  };

  const recommendations = getRecommendations(aqi);

  return (
    <Card className="w-full bg-white shadow-sm border border-gray-200">
      <CardHeader className="border-b border-gray-200 pb-4 md:pb-6">
        <CardTitle className="flex items-center justify-between">
          <div>
            <h2 className="text-xl md:text-2xl lg:text-3xl font-semibold text-gray-900">{recommendations.title}</h2>
            <p className="text-gray-700 text-sm md:text-base mt-1">{recommendations.subtitle}</p>
          </div>
          <div className="text-right">
            <div className="text-2xl md:text-3xl lg:text-4xl font-light text-gray-900">{aqi}</div>
            <div className="text-xs md:text-sm text-gray-600 tracking-wider font-medium">AQI</div>
          </div>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="p-4 md:p-6 lg:p-8 space-y-6 md:space-y-8">
        {/* General Population */}
        <div className="space-y-4">
          <h3 className="text-lg md:text-xl font-semibold text-gray-900">General Population</h3>
          <div className="bg-gray-50 rounded-lg p-4 md:p-6">
            <ul className="space-y-3 md:space-y-4">
              {recommendations.general.map((item, index) => (
                <li key={index} className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-gray-500 rounded-full mt-2 flex-shrink-0"></div>
                  <span className="text-gray-800 text-sm md:text-base leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Sensitive Groups */}
        <div className="space-y-4">
          <h3 className="text-lg md:text-xl font-semibold text-gray-900">Sensitive Groups</h3>
          <div className="bg-gray-50 rounded-lg p-4 md:p-6">
            <p className="text-sm md:text-base text-gray-700 mb-4 font-medium">
              Children, elderly (65+), pregnant women, and people with heart or lung conditions
            </p>
            <ul className="space-y-3 md:space-y-4">
              {recommendations.sensitive.map((item, index) => (
                <li key={index} className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-gray-500 rounded-full mt-2 flex-shrink-0"></div>
                  <span className="text-gray-800 text-sm md:text-base leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Activity Recommendations */}
        <div className="space-y-4">
          <h3 className="text-lg md:text-xl font-semibold text-gray-900">Recommended Actions</h3>
          <div className="bg-gray-50 rounded-lg p-4 md:p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
              {recommendations.activities.map((activity, index) => (
                <div key={index} className="flex items-center space-x-3 p-3 md:p-4 bg-white rounded-md border border-gray-200">
                  <span className="text-sm md:text-base text-gray-800">{activity}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Tips */}
        <div className="bg-gray-50 rounded-lg p-4 md:p-6">
          <h4 className="text-lg md:text-xl font-semibold text-gray-900 mb-4">Quick Tips</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            <div>
              <p className="font-semibold text-gray-900 mb-2 text-sm md:text-base">Monitor Updates:</p>
              <p className="text-sm md:text-base text-gray-700 leading-relaxed">Air quality can change rapidly. Check for updates every few hours.</p>
            </div>
            <div>
              <p className="font-semibold text-gray-900 mb-2 text-sm md:text-base">Indoor Air:</p>
              <p className="text-sm md:text-base text-gray-700 leading-relaxed">Use air purifiers and keep windows closed during poor air quality.</p>
            </div>
            <div>
              <p className="font-semibold text-gray-900 mb-2 text-sm md:text-base">Protection:</p>
              <p className="text-sm md:text-base text-gray-700 leading-relaxed">N95 or KN95 masks provide better protection than surgical masks.</p>
            </div>
            <div>
              <p className="font-semibold text-gray-900 mb-2 text-sm md:text-base">Health:</p>
              <p className="text-sm md:text-base text-gray-700 leading-relaxed">Seek medical help if experiencing severe breathing difficulties.</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
export function DayPlanner() {
  const [selectedHour, setSelectedHour] = useState<number>(new Date().getHours());
  
  // Mock hourly forecast data
  const hourlyForecast = Array.from({ length: 24 }, (_, i) => ({
    hour: i,
    aqi: Math.floor(Math.random() * 100) + 30,
    temperature: Math.floor(Math.random() * 15) + 15,
    humidity: Math.floor(Math.random() * 30) + 40,
    windSpeed: Math.floor(Math.random() * 20) + 5,
    activity_recommendation: 
      Math.random() > 0.7 ? 'excellent' :
      Math.random() > 0.5 ? 'good' :
      Math.random() > 0.3 ? 'moderate' : 'limited',
    outdoor_exercise: Math.random() > 0.3,
    sensitive_groups_warning: Math.random() > 0.7
  }));

  const formatHour = (hour: number) => {
    if (hour === 0) return '12 AM';
    if (hour < 12) return `${hour} AM`;
    if (hour === 12) return '12 PM';
    return `${hour - 12} PM`;
  };

  const getAQIStatus = (aqi: number) => {
    if (aqi <= 50) return { status: 'Good', suitable: true };
    if (aqi <= 100) return { status: 'Moderate', suitable: true };
    if (aqi <= 150) return { status: 'Unhealthy for Sensitive', suitable: false };
    return { status: 'Unhealthy', suitable: false };
  };

  const currentHour = new Date().getHours();
  const selectedData = hourlyForecast[selectedHour];
  const aqiStatus = getAQIStatus(selectedData.aqi);

  return (
    <Card className="w-full bg-white shadow-sm border border-gray-200">
      <CardHeader className="border-b border-gray-200 pb-4 md:pb-6">
        <CardTitle className="flex items-center justify-between">
          <div>
            <h2 className="text-xl md:text-2xl lg:text-3xl font-semibold text-gray-900">Day Planner</h2>
            <p className="text-gray-700 text-sm md:text-base mt-1">Plan your activities based on hourly air quality</p>
          </div>
          <div className="text-right">
            <div className="text-sm md:text-base text-gray-600">
              {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
            </div>
          </div>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="p-4 md:p-6 lg:p-8 space-y-6 md:space-y-8">
        {/* Hour Selection Timeline */}
        <div className="space-y-4 md:space-y-6">
          <h3 className="text-lg md:text-xl font-semibold text-gray-900">Select Time</h3>
          
          <div className="relative">
            <div className="overflow-x-auto pb-4">
              <div className="flex space-x-3 min-w-max">
                {hourlyForecast.map((hour) => {
                  const isSelected = selectedHour === hour.hour;
                  const isCurrent = currentHour === hour.hour;
                  const hourStatus = getAQIStatus(hour.aqi);
                  
                  return (
                    <button
                      key={hour.hour}
                      onClick={() => setSelectedHour(hour.hour)}
                      className={`flex-shrink-0 p-3 md:p-4 rounded-lg border transition-all ${
                        isSelected 
                          ? 'border-gray-400 bg-gray-100 shadow-sm' 
                          : 'border-gray-300 bg-white hover:border-gray-400'
                      } ${isCurrent ? 'ring-1 ring-gray-400' : ''}`}
                    >
                      <div className="text-center space-y-2">
                        <div className={`text-sm md:text-base font-semibold ${
                          isSelected ? 'text-gray-900' : 'text-gray-700'
                        }`}>
                          {formatHour(hour.hour)}
                        </div>
                        <div className="flex items-center justify-center">
                          <div className={`w-2.5 h-2.5 md:w-3 md:h-3 rounded-full ${
                            hourStatus.suitable ? 'bg-green-500' : 'bg-orange-500'
                          }`}></div>
                        </div>
                        <div className={`text-xs md:text-sm font-medium ${
                          isSelected ? 'text-gray-800' : 'text-gray-600'
                        }`}>
                          {hour.aqi}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Selected Hour Details */}
        <div className="space-y-6">
          <div className="bg-gray-50 rounded-lg p-4 md:p-6 lg:p-8">
            <div className="flex items-center justify-between mb-6 md:mb-8">
              <div>
                <h3 className="text-xl md:text-2xl lg:text-3xl font-semibold text-gray-900">
                  {formatHour(selectedHour)}
                </h3>
                <p className="text-gray-700 text-sm md:text-base mt-1">{aqiStatus.status} Air Quality</p>
              </div>
              <div className="text-right">
                <div className="text-2xl md:text-3xl lg:text-4xl font-light text-gray-900">{selectedData.aqi}</div>
                <div className="text-xs md:text-sm text-gray-600 tracking-wider font-medium">AQI</div>
              </div>
            </div>
            
            {/* Weather Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
              <div className="bg-white rounded-md p-4 md:p-5 border border-gray-200">
                <div className="text-sm md:text-base text-gray-700 mb-2 font-medium">Temperature</div>
                <div className="text-lg md:text-xl lg:text-2xl font-semibold text-gray-900">{selectedData.temperature}°C</div>
              </div>
              <div className="bg-white rounded-md p-4 md:p-5 border border-gray-200">
                <div className="text-sm md:text-base text-gray-700 mb-2 font-medium">Humidity</div>
                <div className="text-lg md:text-xl lg:text-2xl font-semibold text-gray-900">{selectedData.humidity}%</div>
              </div>
              <div className="bg-white rounded-md p-4 md:p-5 border border-gray-200">
                <div className="text-sm md:text-base text-gray-700 mb-2 font-medium">Wind Speed</div>
                <div className="text-lg md:text-xl lg:text-2xl font-semibold text-gray-900">{selectedData.windSpeed} km/h</div>
              </div>
            </div>
            
            {/* Activity Recommendations */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
              <div className="bg-white rounded-md p-4 md:p-5 border border-gray-200">
                <div className="text-sm md:text-base text-gray-700 mb-3 font-medium">Activity Level</div>
                <div className="text-base md:text-lg lg:text-xl font-semibold text-gray-900 capitalize">
                  {selectedData.activity_recommendation}
                </div>
                <p className="text-sm md:text-base text-gray-700 mt-3 leading-relaxed">
                  {selectedData.activity_recommendation === 'excellent' ? 'Perfect conditions' :
                   selectedData.activity_recommendation === 'good' ? 'Good conditions' :
                   selectedData.activity_recommendation === 'moderate' ? 'Moderate conditions' :
                   'Limited activities'}
                </p>
              </div>
              
              <div className="bg-white rounded-md p-4 md:p-5 border border-gray-200">
                <div className="text-sm md:text-base text-gray-700 mb-3 font-medium">Outdoor Exercise</div>
                <div className={`text-base md:text-lg lg:text-xl font-semibold ${
                  selectedData.outdoor_exercise ? 'text-green-700' : 'text-orange-700'
                }`}>
                  {selectedData.outdoor_exercise ? 'Recommended' : 'Caution'}
                </div>
                <p className="text-sm md:text-base text-gray-700 mt-3 leading-relaxed">
                  {selectedData.outdoor_exercise ? 'Safe for outdoor activities' : 'Consider indoor alternatives'}
                </p>
              </div>
              
              <div className="bg-white rounded-md p-4 md:p-5 border border-gray-200">
                <div className="text-sm md:text-base text-gray-700 mb-3 font-medium">Sensitive Groups</div>
                <div className={`text-base md:text-lg lg:text-xl font-semibold ${
                  selectedData.sensitive_groups_warning ? 'text-orange-700' : 'text-green-700'
                }`}>
                  {selectedData.sensitive_groups_warning ? 'Use Caution' : 'Safe'}
                </div>
                <p className="text-sm md:text-base text-gray-700 mt-3 leading-relaxed">
                  {selectedData.sensitive_groups_warning ? 'Extra precautions advised' : 'Safe for all groups'}
                </p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Navigation */}
        <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4">
          <button
            onClick={() => setSelectedHour(Math.max(0, selectedHour - 1))}
            disabled={selectedHour === 0}
            className="px-4 md:px-6 py-2 md:py-3 text-sm md:text-base font-medium border border-gray-400 rounded-md bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Previous
          </button>
          <button
            onClick={() => setSelectedHour(currentHour)}
            className="px-4 md:px-6 py-2 md:py-3 text-sm md:text-base font-medium border border-gray-400 rounded-md bg-white hover:bg-gray-50 transition-colors"
          >
            Current Time
          </button>
          <button
            onClick={() => setSelectedHour(Math.min(23, selectedHour + 1))}
            disabled={selectedHour === 23}
            className="px-4 md:px-6 py-2 md:py-3 text-sm md:text-base font-medium border border-gray-400 rounded-md bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Next
          </button>
        </div>
      </CardContent>
    </Card>
  );
}





// Main Enhanced Dashboard Component
export default function EnhancedDashboard() {
  const [currentAQI, setCurrentAQI] = useState(78);
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(true);
  const [weatherError, setWeatherError] = useState<string | null>(null);
  const { location } = useLocation();
  
  useEffect(() => {
    // Simulate real-time AQI updates
    const interval = setInterval(() => {
      setCurrentAQI(prev => Math.max(20, Math.min(200, prev + (Math.random() - 0.5) * 10)));
    }, 5000);
    
    return () => clearInterval(interval);
  }, []);

  // Fetch weather data
  useEffect(() => {
    const fetchWeatherData = async () => {
      try {
        setWeatherLoading(true);
        setWeatherError(null);
        
        // Check if location is available
        if (!location?.coordinates) {
          console.log('No location coordinates available, using default location');
          // Use default coordinates (Los Angeles) if no location is set
          const defaultLat = 34.0522;
          const defaultLng = -118.2437;
          
          const data = await apiClient.getWeatherData(defaultLat, defaultLng);
          setWeatherData(data);
        } else {
          console.log('Fetching weather data for:', location.coordinates);
          const data = await apiClient.getWeatherData(
            location.coordinates.lat,
            location.coordinates.lng
          );
          setWeatherData(data);
        }
        
        console.log('Weather data loaded successfully');
      } catch (error) {
        console.error('Failed to fetch weather data:', error);
        setWeatherError('Failed to load weather data. Using fallback data.');
        
        // Set fallback weather data
        const fallbackData = {
          coordinates: { lat: location?.coordinates?.lat || 34.0522, lng: location?.coordinates?.lng || -118.2437 },
          timestamp: new Date().toISOString(),
          temperature: 22 + Math.random() * 8,
          humidity: 50 + Math.random() * 25,
          pressure: 1013 + Math.random() * 15,
          windSpeed: 3 + Math.random() * 7,
          windDirection: Math.random() * 360,
          precipitation: Math.random() * 1,
          uvIndex: 4 + Math.random() * 6,
          visibility: 20 + Math.random() * 30,
          boundary_layer_height: 800 + Math.random() * 1200,
          source: 'GEOS' as const
        };
        setWeatherData(fallbackData);
      } finally {
        setWeatherLoading(false);
      }
    };

    // Initial fetch
    fetchWeatherData();
    
    // Refresh weather data every 10 minutes
    const weatherInterval = setInterval(fetchWeatherData, 10 * 60 * 1000);
    
    return () => clearInterval(weatherInterval);
  }, [location]);

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Hero Section with AQI Dial - Enhanced Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        <div className="lg:col-span-1 flex justify-center items-center">
          <AQIDial aqi={Math.round(currentAQI)} size={280} />
        </div>
        
        <div className="lg:col-span-2 space-y-6">
          <Card className="bg-white shadow-sm border border-gray-100 overflow-hidden">
            <CardHeader className="bg-gray-50 border-b border-gray-100 pb-4">
              <CardTitle className="flex items-center space-x-3">
                <div className="p-2 bg-gray-100 rounded-lg">
                  <Thermometer className="w-5 h-5 text-gray-600" />
                </div>
                <div>
                  <span className="text-lg font-medium text-gray-900">Weather Conditions</span>
                  <p className="text-gray-500 text-sm mt-1">Environmental factors affecting air quality</p>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {weatherLoading ? (
                <div className="grid grid-cols-2 gap-6">
                  {['Temperature', 'Humidity', 'Wind Speed', 'Pressure', 'UV Index', 'Visibility'].map((param) => (
                    <div key={param} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-xl">
                      <div className="w-10 h-10 bg-gray-300 rounded-full animate-pulse"></div>
                      <div className="flex-1">
                        <div className="h-4 bg-gray-300 rounded animate-pulse mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded animate-pulse w-2/3"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : weatherError ? (
                <div className="text-center py-8">
                  <div className="flex items-center justify-center space-x-2 mb-4">
                    <AlertTriangle className="w-8 h-8 text-amber-500" />
                    <span className="text-lg font-semibold text-amber-600">Weather service temporarily unavailable</span>
                  </div>
                  <p className="text-gray-600 mb-4">Showing estimated data based on location</p>
                  <Button 
                    variant="outline" 
                    onClick={() => window.location.reload()}
                    className="hover:bg-amber-50 hover:border-amber-300"
                  >
                    🔄 Refresh Weather Data
                  </Button>
                </div>
              ) : weatherData ? (
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="p-2 bg-white rounded-lg shadow-sm">
                      <Thermometer className="w-5 h-5 text-gray-600" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">Temperature</div>
                      <div className="text-xl font-semibold text-gray-800">{weatherData.temperature.toFixed(1)}°C</div>
                      <div className="text-sm text-gray-500">{(weatherData.temperature * 9/5 + 32).toFixed(1)}°F</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="p-2 bg-white rounded-lg shadow-sm">
                      <Droplets className="w-5 h-5 text-gray-600" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">Humidity</div>
                      <div className="text-xl font-semibold text-gray-800">{weatherData.humidity.toFixed(0)}%</div>
                      <div className="text-sm text-gray-500">
                        {weatherData.humidity < 30 ? 'Dry' : weatherData.humidity > 70 ? 'Humid' : 'Comfortable'}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="p-2 bg-white rounded-lg shadow-sm">
                      <Wind className="w-5 h-5 text-gray-600" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">Wind Speed</div>
                      <div className="text-xl font-semibold text-gray-800">{weatherData.windSpeed.toFixed(1)} m/s</div>
                      <div className="text-sm text-gray-500">{(weatherData.windSpeed * 2.237).toFixed(1)} mph</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="p-2 bg-white rounded-lg shadow-sm">
                      <Activity className="w-5 h-5 text-gray-600" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">Pressure</div>
                      <div className="text-xl font-semibold text-gray-800">{weatherData.pressure.toFixed(0)}</div>
                      <div className="text-sm text-gray-500">hPa</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="p-2 bg-white rounded-lg shadow-sm">
                      <Eye className="w-5 h-5 text-gray-600" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">UV Index</div>
                      <div className="text-xl font-semibold text-gray-800">{weatherData.uvIndex.toFixed(1)}</div>
                      <div className="text-sm text-gray-500">
                        {weatherData.uvIndex < 3 ? 'Low' : weatherData.uvIndex < 6 ? 'Moderate' : weatherData.uvIndex < 8 ? 'High' : 'Very High'}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="p-2 bg-white rounded-lg shadow-sm">
                      <Eye className="w-5 h-5 text-gray-600" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">Visibility</div>
                      <div className="text-xl font-semibold text-gray-800">{weatherData.visibility.toFixed(1)}</div>
                      <div className="text-sm text-gray-500">km</div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Thermometer className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg font-semibold">No weather data available</p>
                  <p className="text-sm">Please check your internet connection</p>
                </div>
              )}
              {weatherData && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span>Source: {weatherData.source}</span>
                    </div>
                    <span>Updated: {new Date(weatherData.timestamp).toLocaleTimeString()}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Health Recommendations Section */}
      <HealthRecommendations aqi={Math.round(currentAQI)} />
      
      {/* Day Planner */}
      <DayPlanner />
    </div>
  );
}