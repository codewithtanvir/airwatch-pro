import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Wind, Droplets, Thermometer, Eye, AlertTriangle, RefreshCw, TrendingUp, TrendingDown, Bell, MapPin, Satellite, Signal, BarChart3 } from 'lucide-react';
import { apiClient } from '@/lib/apiClient';
import { config } from '@/lib/config';
import { getAQIColor, getAQIBgColor, getHealthRecommendation } from '@/lib/apiClient';
import { useLocation } from '@/hooks/useLocation';
import LocationSearch from '@/components/LocationSearch';
import { useState, useEffect } from 'react';
import { AirQualityData, ForecastData, WeatherData, TempoData } from '@/types/airQuality';
import { useTEMPOData } from '@/hooks/useTEMPOData';

export default function Dashboard() {
  const { location } = useLocation();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [currentData, setCurrentData] = useState<AirQualityData | null>(null);
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [forecast, setForecast] = useState<unknown[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showComparison, setShowComparison] = useState(false);
  
  // Use TEMPO data context for real-time updates and caching
  const { 
    tempoData, 
    loading: tempoLoading, 
    error: tempoError,
    lastUpdate: tempoLastUpdate,
    nextUpdate: tempoNextUpdate,
    isStale: tempoIsStale,
    refreshTEMPOData 
  } = useTEMPOData();

  // Fetch real data from backend API
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        config.log('info', 'Fetching dashboard data', location.coordinates);
        
        // Get current air quality data from backend
        const response = await apiClient.getCurrentAirQuality(
          location.coordinates.lat, 
          location.coordinates.lng
        );
        
        setCurrentData(response);
        config.log('info', 'Successfully fetched current air quality data');
        
        // Get weather data (with fallback handling)
        try {
          const weatherResponse = await apiClient.getWeatherData(
            location.coordinates.lat, 
            location.coordinates.lng
          );
          setWeatherData(weatherResponse);
          config.log('info', 'Successfully fetched weather data');
        } catch (weatherError) {
          config.log('warn', 'Weather data not available, using fallback or skipping', weatherError);
          // Weather data will remain null, component will handle gracefully
        }
        
        // Get forecast data if enabled
        if (config.enableForecasts) {
          const forecastResponse = await apiClient.getForecast(
            location.coordinates.lat, 
            location.coordinates.lng,
            3
          );
          setForecast(forecastResponse);
        }
        
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        config.log('error', 'Error fetching dashboard data:', error);
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
    
    // Set up real-time updates
    const interval = setInterval(fetchData, config.currentDataRefreshInterval);
    return () => clearInterval(interval);
  }, [location.coordinates]); // Re-fetch when location changes

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setError(null);
    try {
      config.log('info', 'Manual refresh triggered');
      
      const response = await apiClient.getCurrentAirQuality(
        location.coordinates.lat, 
        location.coordinates.lng
      );
      
      setCurrentData(response);
      
      // Also refresh weather data (with fallback handling)
      try {
        const weatherResponse = await apiClient.getWeatherData(
          location.coordinates.lat, 
          location.coordinates.lng
        );
        setWeatherData(weatherResponse);
      } catch (weatherError) {
        config.log('warn', 'Weather refresh failed, keeping existing data', weatherError);
      }
      
      // Refresh TEMPO data using context
      refreshTEMPOData();
      
      config.log('info', 'Manual refresh successful');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Refresh failed';
      setError(errorMessage);
      config.log('error', 'Manual refresh failed:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  if (loading || !currentData) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Air Quality Dashboard</h1>
          <Button onClick={handleRefresh} disabled={true}>
            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
            Loading...
          </Button>
        </div>
        
        {error && (
          <Alert className="border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {error}. Attempting to load fallback data...
            </AlertDescription>
          </Alert>
        )}
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-full"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Pollutant data for cards
  const pollutants = [
    { key: 'pm25', name: 'PM2.5', value: currentData.pollutants.pm25, unit: 'μg/m³', color: 'bg-red-500', trend: 'up' },
    { key: 'pm10', name: 'PM10', value: currentData.pollutants.pm10, unit: 'μg/m³', color: 'bg-orange-500', trend: 'down' },
    { key: 'o3', name: 'O₃', value: currentData.pollutants.o3, unit: 'ppm', color: 'bg-blue-500', trend: 'stable' },
    { key: 'no2', name: 'NO₂', value: currentData.pollutants.no2, unit: 'ppb', color: 'bg-green-500', trend: 'down' },
    { key: 'so2', name: 'SO₂', value: currentData.pollutants.so2, unit: 'ppb', color: 'bg-purple-500', trend: 'up' },
    { key: 'co', name: 'CO', value: currentData.pollutants.co, unit: 'ppm', color: 'bg-gray-500', trend: 'stable' },
  ];

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2 flex-wrap">
            <h1 className="text-3xl font-bold">Air Quality Dashboard</h1>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 border border-primary/20 rounded-lg">
              <MapPin className="h-4 w-4 text-primary flex-shrink-0" />
              <span className="font-semibold text-primary text-sm truncate max-w-xs" title={location.locationName}>
                {location.locationName || 'No location selected'}
              </span>
            </div>
          </div>
          <p className="text-muted-foreground">
            Real-time air quality monitoring and health recommendations
          </p>
        </div>
        <div className="flex items-center gap-3">
          <LocationSearch compact />
          <Button onClick={handleRefresh} disabled={isRefreshing} variant="outline">
            <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert className="border-yellow-200 bg-yellow-50">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {error}. Data may be from cache or fallback sources.
          </AlertDescription>
        </Alert>
      )}

      {/* Main AQI Card */}
      <Card className={`p-6 ${getAQIBgColor(currentData.aqi)}`}>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">
              Air Quality Index
            </h2>
            <div className="flex items-center gap-4">
              <span className="text-5xl font-bold text-white">
                {currentData.aqi}
              </span>
              <div>
                <Badge 
                  variant="secondary" 
                  className={`${getAQIColor(currentData.aqi)} text-white mb-2`}
                >
                  {currentData.level}
                </Badge>
                <p className="text-white/90 text-sm">
                  {/* Dominant pollutant calculation would need to be added */}
                </p>
              </div>
            </div>
          </div>
          <div className="text-right text-white">
            <p className="text-sm opacity-90">Last Updated</p>
            <p className="font-medium">
              {new Date(currentData.timestamp).toLocaleTimeString()}
            </p>
            <p className="text-xs opacity-75">
              Source: {currentData.source}
            </p>
          </div>
        </div>
      </Card>

      {/* Health Recommendation */}
      <Alert className="border-blue-200 bg-blue-50">
        <Bell className="h-4 w-4" />
        <AlertDescription>
          <strong>Health Recommendation:</strong> {getHealthRecommendation(currentData.aqi, currentData.level)}
        </AlertDescription>
      </Alert>

      {/* Pollutant Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {pollutants.map((pollutant) => (
          <Card key={pollutant.key}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center justify-between">
                {pollutant.name}
                {pollutant.trend === 'up' && <TrendingUp className="h-4 w-4 text-red-500" />}
                {pollutant.trend === 'down' && <TrendingDown className="h-4 w-4 text-green-500" />}
                {pollutant.trend === 'stable' && <Wind className="h-4 w-4 text-gray-500" />}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {typeof pollutant.value === 'number' ? pollutant.value.toFixed(1) : pollutant.value}
              </div>
              <p className="text-xs text-muted-foreground">
                {pollutant.unit}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Forecast Section */}
      {config.enableForecasts && forecast.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              24-Hour Forecast
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              {forecast.map((item: Record<string, unknown>, index) => (
                <div key={index} className="text-center p-4 border rounded-lg">
                  <p className="font-medium">
                    {new Date(Date.now() + (index + 1) * 8 * 60 * 60 * 1000).toLocaleDateString()}
                  </p>
                  <p className="text-2xl font-bold mt-2">
                    {(item as { aqi?: number }).aqi || 'N/A'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {(item as { condition?: string }).condition || 'Moderate'}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Satellite vs Ground Data Comparison */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Satellite vs Ground Station Comparison
              {tempoData && (
                <div className="flex items-center gap-2 ml-4">
                  <div className={`w-2 h-2 rounded-full ${tempoIsStale ? 'bg-yellow-500' : 'bg-green-500'}`}></div>
                  <span className="text-xs text-gray-500">
                    {tempoIsStale ? 'Data may be stale' : 'Real-time data'}
                  </span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              {tempoData && tempoNextUpdate && (
                <span className="text-xs text-gray-500 mr-2">
                  Next update: {tempoNextUpdate.toLocaleTimeString()}
                </span>
              )}
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowComparison(!showComparison)}
                className="flex items-center gap-2"
              >
                <Satellite className="h-4 w-4" />
                {showComparison ? 'Hide' : 'Show'} Comparison
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        {showComparison && (
          <CardContent>
            {tempoLoading ? (
              <div className="flex items-center justify-center p-8">
                <RefreshCw className="w-6 h-6 animate-spin mr-2" />
                <span>Loading satellite data...</span>
              </div>
            ) : tempoData ? (
              <div className="space-y-6">
                {/* Comparison Overview */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h4 className="font-semibold text-blue-800 mb-3 flex items-center gap-2">
                      <Signal className="w-4 h-4" />
                      Ground Station Data
                    </h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">AQI</span>
                        <span className="font-medium">{currentData.aqi}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">NO₂</span>
                        <span className="font-medium">{currentData.pollutants.no2.toFixed(1)} ppb</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Coverage</span>
                        <span className="text-xs text-gray-600">Point measurement</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Update</span>
                        <span className="text-xs text-gray-600">Every 1-3 hours</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                    <h4 className="font-semibold text-purple-800 mb-3 flex items-center gap-2">
                      <Satellite className="w-4 h-4" />
                      TEMPO Satellite Data
                    </h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">NO₂ Column</span>
                        <span className="font-medium">{(tempoData.no2_column / 1e15).toFixed(1)} ×10¹⁵</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">HCHO Column</span>
                        <span className="font-medium">{(tempoData.hcho_column / 1e15).toFixed(1)} ×10¹⁵</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Coverage</span>
                        <span className="text-xs text-gray-600">8.4 km × 4.4 km</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Update</span>
                        <span className="text-xs text-gray-600">Hourly (daylight)</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Data Quality Comparison */}
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-semibold mb-3">Data Quality & Uncertainty</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-lg font-bold text-blue-600">Ground Station</div>
                      <div className="text-sm text-gray-600 mt-1">High precision</div>
                      <div className="text-xs text-gray-500">±5% uncertainty</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-purple-600">TEMPO Satellite</div>
                      <div className="text-sm text-gray-600 mt-1">
                        {tempoData.quality_flag === 'good' ? 'High quality' : 
                         tempoData.quality_flag === 'moderate' ? 'Moderate quality' : 'Lower quality'}
                      </div>
                      <div className="text-xs text-gray-500">
                        ±{(tempoData.uncertainty.no2 * 100).toFixed(0)}% NO₂ uncertainty
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-green-600">Combined</div>
                      <div className="text-sm text-gray-600 mt-1">Enhanced accuracy</div>
                      <div className="text-xs text-gray-500">Best of both sources</div>
                    </div>
                  </div>
                </div>

                {/* Advantages Comparison */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <h4 className="font-semibold text-blue-800">Ground Station Advantages</h4>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-start gap-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5 flex-shrink-0"></div>
                        <span>High precision at measurement point</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5 flex-shrink-0"></div>
                        <span>Continuous 24/7 monitoring</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5 flex-shrink-0"></div>
                        <span>Well-established calibration methods</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5 flex-shrink-0"></div>
                        <span>Direct surface-level measurements</span>
                      </li>
                    </ul>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-semibold text-purple-800">TEMPO Satellite Advantages</h4>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-start gap-2">
                        <div className="w-2 h-2 bg-purple-500 rounded-full mt-1.5 flex-shrink-0"></div>
                        <span>Wide spatial coverage (8km resolution)</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="w-2 h-2 bg-purple-500 rounded-full mt-1.5 flex-shrink-0"></div>
                        <span>Detects pollution transport & sources</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="w-2 h-2 bg-purple-500 rounded-full mt-1.5 flex-shrink-0"></div>
                        <span>Atmospheric chemistry insights</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="w-2 h-2 bg-purple-500 rounded-full mt-1.5 flex-shrink-0"></div>
                        <span>Covers areas without ground stations</span>
                      </li>
                    </ul>
                  </div>
                </div>

                {/* Combined Benefits */}
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <h4 className="font-semibold text-green-800 mb-3">Why AirWatch Uses Both</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="font-medium text-green-700 mb-2">Enhanced Accuracy</div>
                      <p className="text-gray-700">
                        Ground stations provide precise local measurements while TEMPO reveals regional 
                        patterns and pollution transport that affect your area.
                      </p>
                    </div>
                    <div>
                      <div className="font-medium text-green-700 mb-2">Early Warning</div>
                      <p className="text-gray-700">
                        Satellite data helps predict pollution arrival hours before it reaches 
                        ground monitoring stations, giving you time to prepare.
                      </p>
                    </div>
                    <div>
                      <div className="font-medium text-green-700 mb-2">Source Identification</div>
                      <p className="text-gray-700">
                        TEMPO's atmospheric chemistry data identifies whether pollution comes from 
                        traffic, wildfires, or industrial sources.
                      </p>
                    </div>
                    <div>
                      <div className="font-medium text-green-700 mb-2">Complete Coverage</div>
                      <p className="text-gray-700">
                        Even in areas with sparse ground monitoring, TEMPO provides comprehensive 
                        air quality insights across entire regions.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center p-8 text-gray-500">
                <Satellite className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>TEMPO satellite data not available for this location</p>
                <p className="text-sm mt-2">Ground station data provides reliable local measurements</p>
              </div>
            )}
          </CardContent>
        )}
      </Card>

      {/* Additional Info */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Thermometer className="h-5 w-5" />
              Environmental Conditions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {weatherData ? (
              <>
                <div className="flex justify-between">
                  <span>Temperature</span>
                  <span>{Math.round(weatherData.temperature * 9/5 + 32)}°F ({weatherData.temperature.toFixed(1)}°C)</span>
                </div>
                <div className="flex justify-between">
                  <span>Humidity</span>
                  <span>{weatherData.humidity}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Wind Speed</span>
                  <span>{(weatherData.windSpeed * 2.237).toFixed(1)} mph ({weatherData.windSpeed.toFixed(1)} m/s)</span>
                </div>
                <div className="flex justify-between">
                  <span>Pressure</span>
                  <span>{weatherData.pressure} hPa</span>
                </div>
                {weatherData.uvIndex !== undefined && (
                  <div className="flex justify-between">
                    <span>UV Index</span>
                    <span>{weatherData.uvIndex}</span>
                  </div>
                )}
                {weatherData.visibility !== undefined && (
                  <div className="flex justify-between">
                    <span>Visibility</span>
                    <span>{weatherData.visibility.toFixed(1)} km</span>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center text-muted-foreground py-4">
                Loading weather data...
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Data Sources
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span>Primary Source</span>
              <Badge variant="outline">{currentData.source}</Badge>
            </div>
            <div className="flex justify-between">
              <span>Coordinates</span>
              <span>
                {currentData.coordinates.lat.toFixed(3)}, {currentData.coordinates.lng.toFixed(3)}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Measurement Time</span>
              <span>
                {new Date(currentData.timestamp).toLocaleString()}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}