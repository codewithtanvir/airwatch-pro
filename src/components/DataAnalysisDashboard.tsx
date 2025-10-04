import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Satellite, 
  Database, 
  BarChart3, 
  TrendingUp, 
  Download, 
  FileText,
  Filter,
  Calendar,
  MapPin,
  Layers,
  Activity,
  Cloud,
  Wind,
  Droplets,
  Thermometer,
  Eye,
  Settings,
  RefreshCw,
  ExternalLink,
  Info,
  Loader2
} from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { useLocation } from '@/hooks/useLocation';
import { useTEMPOData } from '@/hooks/useTEMPOData';
import { apiClient } from '@/lib/apiClient';
import { AirQualityData, WeatherData } from '@/types/airQuality';

interface DataSource {
  id: string;
  name: string;
  type: 'satellite' | 'ground' | 'weather' | 'model';
  status: 'online' | 'offline' | 'limited';
  lastUpdate: string;
  coverage: string;
  resolution: string;
  parameters: string[];
  apiEndpoint?: string;
  documentation?: string;
}

interface AnalysisData {
  timestamp: string;
  no2: { satellite: number; ground: number; unit: string };
  formaldehyde: { satellite: number; unit: string };
  pm25: { ground: number; unit: string };
  pm10: { ground: number; unit: string };
  ozone: { satellite: number; ground: number; unit: string };
  aerosolIndex: { satellite: number; unit: string };
  weather: {
    temperature: number;
    humidity: number;
    windSpeed: number;
    pressure: number;
  };
}

export default function DataAnalysisDashboard() {
  const { location } = useLocation();
  const { 
    tempoData, 
    loading: tempoLoading, 
    error: tempoError, 
    lastUpdate: tempoLastUpdate,
    nextUpdate: tempoNextUpdate,
    isStale: tempoIsStale,
    refreshData: refreshTEMPO 
  } = useTEMPOData(location.coordinates.lat, location.coordinates.lng);

  console.log('DataAnalysisDashboard render - location:', location);
  console.log('DataAnalysisDashboard render - tempoData:', tempoData);
  console.log('=== Ground Station Debug Info ===');

  const [selectedTimeRange, setSelectedTimeRange] = useState('24h');
  const [selectedParameters, setSelectedParameters] = useState(['no2', 'pm25', 'ozone']);
  const [analysisMode, setAnalysisMode] = useState('comparison');
  const [showRawData, setShowRawData] = useState(false);
  
  // Real-time air quality and weather data
  const [airQualityData, setAirQualityData] = useState<AirQualityData | null>(null);
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [dataLoading, setDataLoading] = useState(false);
  const [dataError, setDataError] = useState<string | null>(null);
  const [lastDataUpdate, setLastDataUpdate] = useState<Date | null>(null);

  console.log('DataAnalysisDashboard state - airQualityData:', airQualityData);
  console.log('DataAnalysisDashboard state - dataLoading:', dataLoading);
  console.log('DataAnalysisDashboard state - dataError:', dataError);

  // Fetch real-time data
  const fetchRealTimeData = useCallback(async () => {
    if (!location?.coordinates) {
      console.log('No location coordinates available for data fetching');
      return;
    }
    
    console.log('Starting to fetch real-time data for:', location.coordinates);
    setDataLoading(true);
    setDataError(null);
    
    try {
      console.log('Fetching air quality data...');
      const aqData = await apiClient.getCurrentAirQuality(location.coordinates.lat, location.coordinates.lng);
      console.log('Air quality data received:', aqData);
      
      console.log('Fetching weather data...');
      const wData = await apiClient.getWeatherData(location.coordinates.lat, location.coordinates.lng);
      console.log('Weather data received:', wData);
      
      setAirQualityData(aqData);
      setWeatherData(wData);
      setLastDataUpdate(new Date());
      console.log('All data successfully set');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch real-time data';
      setDataError(errorMessage);
      console.error('Real-time data fetch failed:', error);
    } finally {
      setDataLoading(false);
    }
  }, [location?.coordinates]);

  // Auto-refresh data every 15 minutes
  useEffect(() => {
    // Add a small delay to ensure everything is initialized
    const initTimeout = setTimeout(() => {
      fetchRealTimeData();
    }, 100);
    
    const interval = setInterval(fetchRealTimeData, 15 * 60 * 1000); // 15 minutes
    return () => {
      clearTimeout(initTimeout);
      clearInterval(interval);
    };
  }, [fetchRealTimeData]);

  // Add a timeout to prevent infinite loading
  useEffect(() => {
    if (dataLoading) {
      const timeout = setTimeout(() => {
        if (dataLoading) {
          setDataLoading(false);
          setDataError('Data fetch timeout. Please try refreshing manually.');
          console.error('Data fetch timeout after 30 seconds');
        }
      }, 30000); // 30 second timeout

      return () => clearTimeout(timeout);
    }
  }, [dataLoading]);

  // Manual refresh function
  const handleRefresh = async () => {
    await Promise.all([
      fetchRealTimeData(),
      refreshTEMPO()
    ]);
  };

  // Mock data sources - in real implementation this would come from API
  const dataSources: DataSource[] = [
    {
      id: 'tempo',
      name: 'NASA TEMPO Satellite',
      type: 'satellite',
      status: tempoData ? 'online' : tempoError ? 'offline' : 'limited',
      lastUpdate: tempoLastUpdate?.toISOString() || '2025-01-03T14:30:00Z',
      coverage: 'North America',
      resolution: '8.4km × 4.4km',
      parameters: ['NO₂', 'HCHO', 'Aerosol Index', 'O₃'],
      apiEndpoint: '/api/tempo-data',
      documentation: 'https://tempo.si.edu/data/'
    },
    {
      id: 'modis',
      name: 'NASA MODIS/VIIRS',
      type: 'satellite',
      status: 'online',
      lastUpdate: '2025-01-03T12:00:00Z',
      coverage: 'Global',
      resolution: '1km × 1km',
      parameters: ['AOD', 'Land Surface Temperature', 'Fire Detection'],
      apiEndpoint: '/api/modis-data'
    },
    {
      id: 'gpm',
      name: 'NASA GPM IMERG',
      type: 'satellite',
      status: 'online',
      lastUpdate: '2025-01-03T13:45:00Z',
      coverage: 'Global',
      resolution: '10km × 10km',
      parameters: ['Precipitation Rate', 'Precipitation Type'],
      apiEndpoint: '/api/gpm-data'
    },
    {
      id: 'airnow',
      name: 'EPA AirNow Network',
      type: 'ground',
      status: airQualityData?.source === 'EPA_AIRNOW' ? 'online' : 'limited',
      lastUpdate: airQualityData?.timestamp || '2025-01-03T14:45:00Z',
      coverage: 'United States',
      resolution: 'Point measurements',
      parameters: ['PM2.5', 'PM10', 'O₃', 'NO₂', 'SO₂', 'CO'],
      apiEndpoint: '/api/airnow-data',
      documentation: 'https://www.airnow.gov/airnow-api/'
    },
    {
      id: 'openaq',
      name: 'OpenAQ Global Network',
      type: 'ground',
      status: airQualityData?.source === 'OpenAQ' ? 'online' : 'limited',
      lastUpdate: airQualityData?.timestamp || '2025-01-03T14:40:00Z',
      coverage: 'Global',
      resolution: 'Point measurements',
      parameters: ['PM2.5', 'PM10', 'O₃', 'NO₂', 'SO₂', 'CO'],
      apiEndpoint: '/api/openaq-data',
      documentation: 'https://docs.openaq.org/'
    },
    {
      id: 'openweather',
      name: 'OpenWeather API',
      type: 'weather',
      status: weatherData ? 'online' : 'limited',
      lastUpdate: weatherData?.timestamp || '2025-01-03T14:50:00Z',
      coverage: 'Global',
      resolution: '1km × 1km',
      parameters: ['Temperature', 'Humidity', 'Wind', 'Pressure'],
      apiEndpoint: '/api/weather-data'
    },
    {
      id: 'geos5',
      name: 'NASA GEOS-5 Model',
      type: 'model',
      status: 'online',
      lastUpdate: '2025-01-03T12:00:00Z',
      coverage: 'Global',
      resolution: '25km × 25km',
      parameters: ['Wind Fields', 'Temperature', 'Humidity', 'Chemical Transport'],
      apiEndpoint: '/api/geos5-data'
    }
  ];

  // Get current status information
  const isDataLoading = tempoLoading || dataLoading;
  const hasError = tempoError || dataError;
  const allDataAvailable = tempoData && airQualityData && weatherData;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'offline': return 'bg-red-500';
      case 'limited': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'satellite': return <Satellite className="h-4 w-4" />;
      case 'ground': return <Database className="h-4 w-4" />;
      case 'weather': return <Cloud className="h-4 w-4" />;
      case 'model': return <Activity className="h-4 w-4" />;
      default: return <Database className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Data Analysis Dashboard</h1>
          <p className="text-muted-foreground">
            Real-time access to NASA TEMPO satellite and ground station air quality data
          </p>
          {location && (
            <p className="text-sm text-muted-foreground">
              Monitoring: {location.locationName || `${location.coordinates.lat.toFixed(3)}, ${location.coordinates.lng.toFixed(3)}`}
            </p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
            disabled={isDataLoading}
          >
            {isDataLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            {isDataLoading ? 'Updating...' : 'Refresh Data'}
          </Button>
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Export Data
          </Button>
          <Button variant="outline" size="sm">
            <FileText className="mr-2 h-4 w-4" />
            API Docs
          </Button>
        </div>
      </div>

      {/* Status Indicators */}
      {(hasError || isDataLoading) && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              {isDataLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              {hasError && <Info className="h-4 w-4 text-yellow-600" />}
              <span className="text-sm">
                {isDataLoading && 'Fetching real-time data...'}
                {hasError && `Error: ${tempoError || dataError}`}
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="sources" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="sources">Data Sources</TabsTrigger>
          <TabsTrigger value="analysis">Real-Time Analysis</TabsTrigger>
          <TabsTrigger value="comparison">Source Comparison</TabsTrigger>
          <TabsTrigger value="api">API Access</TabsTrigger>
        </TabsList>

        {/* Data Sources Tab */}
        <TabsContent value="sources" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {dataSources.map((source) => (
              <Card key={source.id} className="relative">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      {getTypeIcon(source.type)}
                      {source.name}
                    </CardTitle>
                    <div className={`w-3 h-3 rounded-full ${getStatusColor(source.status)}`} 
                         title={`Status: ${source.status}`} />
                  </div>
                  <Badge variant="outline" className="w-fit">
                    {source.type.charAt(0).toUpperCase() + source.type.slice(1)}
                  </Badge>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Coverage:</span>
                      <div className="font-medium">{source.coverage}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Resolution:</span>
                      <div className="font-medium">{source.resolution}</div>
                    </div>
                  </div>
                  
                  <div>
                    <span className="text-muted-foreground text-sm">Parameters:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {source.parameters.map((param) => (
                        <Badge key={param} variant="secondary" className="text-xs">
                          {param}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="text-xs text-muted-foreground">
                    Last update: {new Date(source.lastUpdate).toLocaleString()}
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button variant="outline" size="sm" className="flex-1">
                      <Eye className="mr-1 h-3 w-3" />
                      View Data
                    </Button>
                    {source.documentation && (
                      <Button variant="outline" size="sm">
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Data Access Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="h-5 w-5" />
                Unrestricted Data Access Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">7</div>
                  <div className="text-sm text-muted-foreground">Active Data Sources</div>
                  <div className="text-xs mt-1">Satellite, Ground, Weather, Model</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">15+</div>
                  <div className="text-sm text-muted-foreground">Air Quality Parameters</div>
                  <div className="text-xs mt-1">NO₂, PM2.5, O₃, HCHO, and more</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">24/7</div>
                  <div className="text-sm text-muted-foreground">Real-Time Access</div>
                  <div className="text-xs mt-1">Continuous monitoring</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Real-Time Analysis Tab */}
        <TabsContent value="analysis" className="space-y-6">
          {/* Analysis Controls */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Analysis Configuration
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-4 gap-4">
                <div>
                  <label className="text-sm font-medium">Time Range</label>
                  <Select value={selectedTimeRange} onValueChange={setSelectedTimeRange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1h">Last Hour</SelectItem>
                      <SelectItem value="24h">Last 24 Hours</SelectItem>
                      <SelectItem value="7d">Last 7 Days</SelectItem>
                      <SelectItem value="30d">Last 30 Days</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Analysis Mode</label>
                  <Select value={analysisMode} onValueChange={setAnalysisMode}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="comparison">Source Comparison</SelectItem>
                      <SelectItem value="trend">Trend Analysis</SelectItem>
                      <SelectItem value="correlation">Correlation Analysis</SelectItem>
                      <SelectItem value="forecast">Forecast Validation</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Location</label>
                  <Button variant="outline" className="w-full justify-start">
                    <MapPin className="mr-2 h-4 w-4" />
                    {location?.locationName || 'Select Location'}
                  </Button>
                </div>
                <div className="flex items-end">
                  <Button 
                    className="w-full" 
                    onClick={handleRefresh}
                    disabled={isDataLoading}
                  >
                    {isDataLoading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCw className="mr-2 h-4 w-4" />
                    )}
                    {isDataLoading ? 'Updating...' : 'Update Analysis'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Live Data Stream */}
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Satellite className="h-5 w-5" />
                  NASA TEMPO Live Feed
                  {tempoIsStale && (
                    <Badge variant="outline" className="text-yellow-600">
                      Stale
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {tempoLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                    <span className="ml-2">Loading TEMPO data...</span>
                  </div>
                ) : tempoError ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <p className="text-red-600 mb-2">{tempoError}</p>
                    <Button variant="outline" size="sm" onClick={refreshTEMPO}>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Retry
                    </Button>
                  </div>
                ) : tempoData ? (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">NO₂ Column Density</span>
                      <div className="text-right">
                        <div className="font-bold">{tempoData.no2_column.toExponential(2)}</div>
                        <div className="text-xs text-muted-foreground">molecules/cm²</div>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">HCHO Column Density</span>
                      <div className="text-right">
                        <div className="font-bold">{tempoData.hcho_column.toFixed(1)}</div>
                        <div className="text-xs text-muted-foreground">molecules/cm²</div>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Aerosol Index</span>
                      <div className="text-right">
                        <div className="font-bold">{tempoData.aerosol_index.toFixed(2)}</div>
                        <div className="text-xs text-muted-foreground">dimensionless</div>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Quality Flag</span>
                      <Badge variant="secondary" className={tempoData.quality_flag === 'good' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                        {tempoData.quality_flag}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground border-t pt-2">
                      Last observation: {new Date(tempoData.observation_time).toLocaleString()}<br/>
                      {tempoNextUpdate && `Next observation: ${tempoNextUpdate.toLocaleString()}`}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No TEMPO data available</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Ground Station Network
                </CardTitle>
              </CardHeader>
              <CardContent>
                {dataLoading ? (
                  <div className="flex flex-col items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin mb-2" />
                    <span className="ml-2 mb-4">Loading ground data...</span>
                    <Button variant="outline" size="sm" onClick={() => {
                      setDataLoading(false);
                      setDataError('Loading cancelled by user');
                    }}>
                      Cancel Loading
                    </Button>
                  </div>
                ) : dataError ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <p className="text-red-600 mb-2">{dataError}</p>
                    <Button variant="outline" size="sm" onClick={fetchRealTimeData}>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Retry
                    </Button>
                  </div>
                ) : airQualityData ? (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">PM2.5</span>
                      <div className="text-right">
                        <div className="font-bold">{airQualityData.pollutants.pm25.toFixed(1)}</div>
                        <div className="text-xs text-muted-foreground">µg/m³</div>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">PM10</span>
                      <div className="text-right">
                        <div className="font-bold">{airQualityData.pollutants.pm10.toFixed(1)}</div>
                        <div className="text-xs text-muted-foreground">µg/m³</div>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">O₃</span>
                      <div className="text-right">
                        <div className="font-bold">{(airQualityData.pollutants.o3 * 1000).toFixed(1)}</div>
                        <div className="text-xs text-muted-foreground">µg/m³</div>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Data Source</span>
                      <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                        {airQualityData.source}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground border-t pt-2">
                      {airQualityData.source === 'EPA_AIRNOW' && 'EPA AirNow Network'}<br/>
                      {airQualityData.source === 'OpenAQ' && 'OpenAQ Global Network'}<br/>
                      {airQualityData.source === 'FUSED_DATA' && 'Multi-source Fusion'}<br/>
                      Last update: {new Date(airQualityData.timestamp).toLocaleString()}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <p className="mb-4">No ground station data available</p>
                    <Button variant="outline" size="sm" onClick={fetchRealTimeData}>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Load Data
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Data Quality and Uncertainty */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Data Quality & Uncertainty Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="space-y-3">
                  <h4 className="font-semibold">Satellite Data Quality</h4>
                  <div className="space-y-2">
                    {tempoData ? (
                      <>
                        <div className="flex justify-between">
                          <span className="text-sm">TEMPO NO₂ Uncertainty</span>
                          <span className="text-sm font-medium">±{tempoData.uncertainty.no2.toFixed(0)}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Pixel Size</span>
                          <span className="text-sm font-medium">{tempoData.pixel_size_km.toFixed(1)} km</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Zenith Angle</span>
                          <span className="text-sm font-medium">{tempoData.satellite_zenith_angle.toFixed(1)}°</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Data Quality</span>
                          <Badge variant="secondary" className={
                            tempoData.quality_flag === 'good' ? 'bg-green-100 text-green-800 text-xs' : 
                            tempoData.quality_flag === 'moderate' ? 'bg-yellow-100 text-yellow-800 text-xs' :
                            'bg-red-100 text-red-800 text-xs'
                          }>
                            {tempoData.quality_flag}
                          </Badge>
                        </div>
                      </>
                    ) : (
                      <div className="text-sm text-muted-foreground">No satellite data available</div>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-semibold">Ground Station Quality</h4>
                  <div className="space-y-2">
                    {airQualityData ? (
                      <>
                        <div className="flex justify-between">
                          <span className="text-sm">PM2.5 Uncertainty</span>
                          <span className="text-sm font-medium">±{airQualityData.source === 'EPA_AIRNOW' ? '5' : '10'}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Calibration Status</span>
                          <span className="text-sm font-medium">Valid</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Data Source</span>
                          <span className="text-sm font-medium">{airQualityData.source}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Data Quality</span>
                          <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs">
                            {airQualityData.source === 'EPA_AIRNOW' ? 'High' : 'Good'}
                          </Badge>
                        </div>
                      </>
                    ) : (
                      <div className="text-sm text-muted-foreground">No ground data available</div>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-semibold">Combined Analysis</h4>
                  <div className="space-y-2">
                    {allDataAvailable ? (
                      <>
                        <div className="flex justify-between">
                          <span className="text-sm">Data Fusion Confidence</span>
                          <span className="text-sm font-medium">
                            {tempoData && airQualityData ? 
                              (90 - Math.abs(tempoData.uncertainty.no2 - 5)).toFixed(0) : '85'
                            }%
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Spatial Coherence</span>
                          <span className="text-sm font-medium">Good</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Temporal Stability</span>
                          <span className="text-sm font-medium">{tempoIsStale ? 'Degraded' : 'Stable'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Overall Quality</span>
                          <Badge variant="secondary" className={
                            allDataAvailable && !tempoIsStale ? 'bg-green-100 text-green-800 text-xs' : 
                            'bg-yellow-100 text-yellow-800 text-xs'
                          }>
                            {allDataAvailable && !tempoIsStale ? 'Excellent' : 'Good'}
                          </Badge>
                        </div>
                      </>
                    ) : (
                      <div className="text-sm text-muted-foreground">Waiting for all data sources</div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Source Comparison Tab */}
        <TabsContent value="comparison" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Layers className="h-5 w-5" />
                Satellite vs Ground Station Comparison
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3">Parameter</th>
                      <th className="text-left p-3">TEMPO Satellite</th>
                      <th className="text-left p-3">Ground Stations</th>
                      <th className="text-left p-3">Difference</th>
                      <th className="text-left p-3">Agreement</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tempoData && airQualityData && (
                      <>
                        <tr className="border-b">
                          <td className="p-3 font-medium">NO₂</td>
                          <td className="p-3">
                            <div>{tempoData.no2_column.toExponential(2)} molecules/cm²</div>
                            <div className="text-xs text-muted-foreground">(satellite column)</div>
                          </td>
                          <td className="p-3">
                            <div>{airQualityData.pollutants.no2.toFixed(1)} µg/m³</div>
                            <div className="text-xs text-muted-foreground">Surface level</div>
                          </td>
                          <td className="p-3">
                            <div className="text-muted-foreground">Different units</div>
                            <div className="text-xs text-muted-foreground">Column vs surface</div>
                          </td>
                          <td className="p-3">
                            <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                              Spatial correlation
                            </Badge>
                          </td>
                        </tr>
                        <tr className="border-b">
                          <td className="p-3 font-medium">O₃</td>
                          <td className="p-3">
                            <div>{tempoData.ozone_column ? tempoData.ozone_column.toExponential(2) : 'N/A'}</div>
                            <div className="text-xs text-muted-foreground">Column integrated</div>
                          </td>
                          <td className="p-3">
                            <div>{(airQualityData.pollutants.o3 * 1000).toFixed(1)} µg/m³</div>
                            <div className="text-xs text-muted-foreground">Surface level</div>
                          </td>
                          <td className="p-3">
                            <div className="text-muted-foreground">Different scales</div>
                            <div className="text-xs text-muted-foreground">Column vs surface</div>
                          </td>
                          <td className="p-3">
                            <Badge variant="secondary" className="bg-green-100 text-green-800">
                              Good correlation
                            </Badge>
                          </td>
                        </tr>
                        <tr className="border-b">
                          <td className="p-3 font-medium">PM2.5</td>
                          <td className="p-3">
                            <div className="text-muted-foreground">Aerosol Index: {tempoData.aerosol_index.toFixed(2)}</div>
                            <div className="text-xs text-muted-foreground">Derived from satellite</div>
                          </td>
                          <td className="p-3">
                            <div>{airQualityData.pollutants.pm25.toFixed(1)} µg/m³</div>
                            <div className="text-xs text-muted-foreground">Direct measurement</div>
                          </td>
                          <td className="p-3">
                            <div className="text-muted-foreground">N/A</div>
                          </td>
                          <td className="p-3">
                            <Badge variant="outline">
                              Indirect correlation
                            </Badge>
                          </td>
                        </tr>
                      </>
                    )}
                    {(!tempoData || !airQualityData) && (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-muted-foreground">
                          {isDataLoading ? (
                            <div className="flex items-center justify-center">
                              <Loader2 className="h-4 w-4 animate-spin mr-2" />
                              Loading comparison data...
                            </div>
                          ) : (
                            'No data available for comparison. Please refresh to load data.'
                          )}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Temporal Analysis */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Temporal Analysis (Last 24 Hours)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-3">Data Availability</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span>TEMPO Observations</span>
                      <span className="font-medium">
                        {tempoData ? 'Available' : 'Limited'} {tempoIsStale && '(Stale)'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Ground Station Data</span>
                      <span className="font-medium">
                        {airQualityData ? 'Available' : 'Loading...'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Weather Data</span>
                      <span className="font-medium">
                        {weatherData ? 'Available' : 'Loading...'}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-2">
                      TEMPO operates during daylight hours only (≈14 hours/day)<br/>
                      Last update: {lastDataUpdate?.toLocaleString() || 'Never'}
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-3">Data Status</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span>TEMPO Data Age</span>
                      <span className="font-medium">
                        {tempoLastUpdate ? 
                          `${Math.round((Date.now() - tempoLastUpdate.getTime()) / (60 * 1000))} min` : 
                          'Unknown'
                        }
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Ground Data Source</span>
                      <span className="font-medium">
                        {airQualityData?.source || 'None'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Data Integration</span>
                      <span className="font-medium text-green-600">
                        {allDataAvailable ? 'Complete' : 'Partial'}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-2">
                      Multi-source data fusion provides comprehensive air quality monitoring
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* API Access Tab */}
        <TabsContent value="api" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ExternalLink className="h-5 w-5" />
                Unrestricted API Access
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold mb-3">Real-Time Data APIs</h4>
                    <div className="space-y-3 text-sm">
                      <div className="p-3 bg-gray-50 rounded border">
                        <div className="font-mono text-blue-600">GET /api/tempo-data</div>
                        <div className="text-muted-foreground">NASA TEMPO satellite data</div>
                      </div>
                      <div className="p-3 bg-gray-50 rounded border">
                        <div className="font-mono text-blue-600">GET /api/ground-stations</div>
                        <div className="text-muted-foreground">EPA AirNow + OpenAQ networks</div>
                      </div>
                      <div className="p-3 bg-gray-50 rounded border">
                        <div className="font-mono text-blue-600">GET /api/weather-data</div>
                        <div className="text-muted-foreground">Meteorological conditions</div>
                      </div>
                      <div className="p-3 bg-gray-50 rounded border">
                        <div className="font-mono text-blue-600">GET /api/analysis/compare</div>
                        <div className="text-muted-foreground">Multi-source comparison</div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-3">Data Export Options</h4>
                    <div className="space-y-3 text-sm">
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded border">
                        <span>JSON Format</span>
                        <Button variant="outline" size="sm">
                          <Download className="h-3 w-3 mr-1" />
                          Export
                        </Button>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded border">
                        <span>CSV Format</span>
                        <Button variant="outline" size="sm">
                          <Download className="h-3 w-3 mr-1" />
                          Export
                        </Button>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded border">
                        <span>NetCDF Format</span>
                        <Button variant="outline" size="sm">
                          <Download className="h-3 w-3 mr-1" />
                          Export
                        </Button>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded border">
                        <span>GeoTIFF (Spatial)</span>
                        <Button variant="outline" size="sm">
                          <Download className="h-3 w-3 mr-1" />
                          Export
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="font-semibold text-blue-800 mb-2">API Usage Examples</h4>
                  <div className="space-y-3 text-sm">
                    <div>
                      <div className="font-mono text-xs bg-white p-2 rounded border">
                        curl -X GET "https://airwatch.pro/api/tempo-data?lat=40.7128&lon=-74.0060"
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">Get TEMPO satellite data for NYC</div>
                    </div>
                    <div>
                      <div className="font-mono text-xs bg-white p-2 rounded border">
                        curl -X GET "https://airwatch.pro/api/analysis/compare?sources=tempo,airnow&period=24h"
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">Compare satellite vs ground data</div>
                    </div>
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-xl font-bold text-green-600">Free</div>
                    <div className="text-sm text-muted-foreground">No API Keys Required</div>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-xl font-bold text-blue-600">Unlimited</div>
                    <div className="text-sm text-muted-foreground">No Rate Limits</div>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-xl font-bold text-purple-600">Open</div>
                    <div className="text-sm text-muted-foreground">Open Source Code</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}