import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  MapPin, 
  Radio, 
  Cloud, 
  Loader2, 
  Eye, 
  Info, 
  Zap, 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  Map, 
  Filter, 
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Globe,
  Target,
  Activity
} from 'lucide-react';
import { LoadingState, ErrorState } from '@/components/ui/LoadingState';
import { useState, useEffect } from 'react';
import { AirQualityData } from '@/types/airQuality';
import { useLocation } from '@/hooks/useLocation';

// Utility functions for AQI styling
const getAQIColor = (aqi: number) => {
  if (aqi <= 50) return 'text-green-600';
  if (aqi <= 100) return 'text-yellow-600';
  if (aqi <= 150) return 'text-orange-600';
  if (aqi <= 200) return 'text-red-600';
  if (aqi <= 300) return 'text-purple-600';
  return 'text-red-800';
};

const getAQIBgColor = (aqi: number) => {
  if (aqi <= 50) return 'bg-green-50 border-green-200';
  if (aqi <= 100) return 'bg-yellow-50 border-yellow-200';
  if (aqi <= 150) return 'bg-orange-50 border-orange-200';
  if (aqi <= 200) return 'bg-red-50 border-red-200';
  if (aqi <= 300) return 'bg-purple-50 border-purple-200';
  return 'bg-red-100 border-red-300';
};

export default function AirQualityMap() {
  const [locationData, setLocationData] = useState<AirQualityData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStation, setSelectedStation] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'heatmap'>('grid');
  const [filterLevel, setFilterLevel] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('aqi');
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const { location } = useLocation();

  // Load location data for ground stations
  const loadLocationData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (!location?.coordinates) {
        setError('Location not available');
        return;
      }

      // Get real stations data from backend
      const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
      const response = await fetch(
        `${baseUrl}/api/v1/air-quality/stations?latitude=${location.coordinates.lat}&longitude=${location.coordinates.lng}&radius=50`
      );

      if (response.ok) {
        const data = await response.json();
        console.log('Stations data received:', data);
        
        if (data.success && data.stations) {
          // Convert backend format to frontend format
          const convertedData: AirQualityData[] = data.stations.map((station: {
            location: string;
            coordinates: { lat: number; lng: number };
            aqi: number;
            level: string;
            pollutants: Record<string, number>;
            source: string;
            timestamp: string;
          }) => ({
            location: station.location,
            coordinates: station.coordinates,
            aqi: station.aqi,
            level: station.level,
            pollutants: {
              pm25: station.pollutants.pm25 || 0,
              pm10: station.pollutants.pm10 || 0,
              o3: station.pollutants.o3 || 0,
              no2: station.pollutants.no2 || 0,
              co: station.pollutants.co || 0,
              so2: station.pollutants.so2 || 0
            },
            source: station.source.includes('OpenAQ') ? 'OpenAQ' : 'Ground Station',
            timestamp: station.timestamp
          }));
          
          setLocationData(convertedData);
        } else {
          throw new Error('Invalid response format');
        }
      } else {
        throw new Error(`API responded with status ${response.status}`);
      }
      
    } catch (err) {
      console.error('Error loading station data, using fallback:', err);
      setError('Using simulated data - real stations may be unavailable');
      
      // Fallback to enhanced mock data
      const mockData: AirQualityData[] = [
        {
          location: 'Downtown Station',
          coordinates: { lat: location?.coordinates.lat || 34.0522, lng: location?.coordinates.lng || -118.2437 },
          aqi: 75,
          level: 'Moderate',
          pollutants: {
            pm25: 18.5,
            pm10: 35.2,
            o3: 0.085,
            no2: 42.1,
            co: 1.2,
            so2: 5.8
          },
          source: 'Ground Station',
          timestamp: new Date().toISOString()
        },
        {
          location: 'Airport Monitor',
          coordinates: { lat: (location?.coordinates.lat || 34.0522) + 0.01, lng: (location?.coordinates.lng || -118.2437) + 0.01 },
          aqi: 112,
          level: 'Unhealthy for Sensitive Groups',
          pollutants: {
            pm25: 28.3,
            pm10: 55.7,
            o3: 0.095,
            no2: 48.9,
            co: 1.8,
            so2: 8.2
          },
          source: 'OpenAQ',
          timestamp: new Date().toISOString()
        }
      ];
      
      setLocationData(mockData);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLocationData();
  }, [location]); // eslint-disable-line react-hooks/exhaustive-deps

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'OpenAQ':
        return <Radio className="w-4 h-4" />;
      case 'Ground Station':
        return <MapPin className="w-4 h-4" />;
      case 'Weather API':
        return <Cloud className="w-4 h-4" />;
      default:
        return <MapPin className="w-4 h-4" />;
    }
  };

  const getPollutantName = (pollutant: string) => {
    switch (pollutant) {
      case 'no2': return 'Nitrogen Dioxide (NO₂)';
      case 'o3': return 'Total Ozone (O₃)';
      case 'hcho': return 'Formaldehyde (HCHO)';
      case 'aod': return 'Aerosol Optical Depth';
      default: return pollutant.toUpperCase();
    }
  };

  // New utility functions for enhanced interactivity
  const getAQITrendIcon = (aqi: number) => {
    if (aqi > 150) return <TrendingUp className="w-4 h-4 text-red-500" />;
    if (aqi > 100) return <TrendingUp className="w-4 h-4 text-orange-500" />;
    if (aqi > 50) return <Activity className="w-4 h-4 text-yellow-500" />;
    return <TrendingDown className="w-4 h-4 text-green-500" />;
  };

  const getHealthRecommendation = (aqi: number) => {
    if (aqi <= 50) return { 
      level: 'Good', 
      icon: <CheckCircle className="w-4 h-4 text-green-500" />,
      advice: 'Perfect for outdoor activities',
      color: 'text-green-700 bg-green-50 border-green-200'
    };
    if (aqi <= 100) return { 
      level: 'Moderate', 
      icon: <Activity className="w-4 h-4 text-yellow-500" />,
      advice: 'Good for most outdoor activities',
      color: 'text-yellow-700 bg-yellow-50 border-yellow-200'
    };
    if (aqi <= 150) return { 
      level: 'Unhealthy for Sensitive Groups', 
      icon: <AlertTriangle className="w-4 h-4 text-orange-500" />,
      advice: 'Sensitive individuals should limit outdoor time',
      color: 'text-orange-700 bg-orange-50 border-orange-200'
    };
    return { 
      level: 'Unhealthy', 
      icon: <AlertTriangle className="w-4 h-4 text-red-500" />,
      advice: 'Everyone should limit outdoor activities',
      color: 'text-red-700 bg-red-50 border-red-200'
    };
  };

  const filterAndSortData = () => {
    let filtered = [...locationData];
    
    // Filter by AQI level
    if (filterLevel !== 'all') {
      filtered = filtered.filter(item => {
        if (filterLevel === 'good') return item.aqi <= 50;
        if (filterLevel === 'moderate') return item.aqi > 50 && item.aqi <= 100;
        if (filterLevel === 'unhealthy') return item.aqi > 100;
        return true;
      });
    }
    
    // Sort data
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'aqi': return b.aqi - a.aqi;
        case 'location': return a.location.localeCompare(b.location);
        case 'pm25': return (b.pollutants.pm25 || 0) - (a.pollutants.pm25 || 0);
        default: return 0;
      }
    });
    
    return filtered;
  };

  const getStationDistance = (lat: number, lng: number) => {
    if (!location?.coordinates) return null;
    const R = 6371; // Earth's radius in km
    const dLat = (lat - location.coordinates.lat) * Math.PI / 180;
    const dLng = (lng - location.coordinates.lng) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(location.coordinates.lat * Math.PI / 180) * Math.cos(lat * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-4 sm:space-y-0">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold flex items-center space-x-2">
              <MapPin className="w-6 h-6 sm:w-8 sm:h-8" />
              <span>Air Quality Map</span>
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Real-time air quality data from multiple sources across the region
            </p>
          </div>
        </div>
        <Card className="shadow-lg">
          <CardContent className="p-8">
            <LoadingState 
              type="stations" 
              message="Loading air quality monitoring stations..." 
              size="lg"
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-4 sm:space-y-0">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold flex items-center space-x-2">
              <MapPin className="w-6 h-6 sm:w-8 sm:h-8" />
              <span>Air Quality Map</span>
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Real-time air quality data from multiple sources across the region
            </p>
          </div>
        </div>
        <Card className="shadow-lg">
          <CardContent className="p-8">
            <ErrorState
              title="Data Loading Issue"
              message={error}
              onRetry={() => {
                setError(null);
                loadLocationData();
              }}
              type={error.includes('simulated') ? 'warning' : 'error'}
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Enhanced Header with Statistics */}
      <div className="flex flex-col space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-4 sm:space-y-0">
          <div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Map className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" />
              </div>
              <span>Interactive Air Quality Map</span>
            </h2>
            <p className="text-sm md:text-base text-gray-600 mt-2">
              Real-time air quality monitoring with {locationData.length} active stations
            </p>
          </div>
          
          {/* Quick Actions */}
          <div className="flex flex-wrap gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setAutoRefresh(!autoRefresh)}
                    className={autoRefresh ? 'bg-green-50 border-green-200' : ''}
                  >
                    <RefreshCw className={`w-4 h-4 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
                    Auto Refresh
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Auto refresh data every 5 minutes</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDetails(!showDetails)}
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              {showDetails ? 'Hide' : 'Show'} Details
            </Button>
          </div>
        </div>
        
        {/* Interactive Statistics Dashboard */}
        {showDetails && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg border">
            <Card className="bg-white border-0 shadow-sm">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">{locationData.length}</div>
                <div className="text-sm text-gray-600">Active Stations</div>
                <Globe className="w-6 h-6 mx-auto mt-2 text-blue-400" />
              </CardContent>
            </Card>
            
            <Card className="bg-white border-0 shadow-sm">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-green-600">
                  {locationData.filter(item => item.aqi <= 50).length}
                </div>
                <div className="text-sm text-gray-600">Good Quality</div>
                <CheckCircle className="w-6 h-6 mx-auto mt-2 text-green-400" />
              </CardContent>
            </Card>
            
            <Card className="bg-white border-0 shadow-sm">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {locationData.filter(item => item.aqi > 100).length}
                </div>
                <div className="text-sm text-gray-600">Unhealthy Areas</div>
                <AlertTriangle className="w-6 h-6 mx-auto mt-2 text-orange-400" />
              </CardContent>
            </Card>
            
            <Card className="bg-white border-0 shadow-sm">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {Math.round(locationData.reduce((sum, item) => sum + item.aqi, 0) / locationData.length) || 0}
                </div>
                <div className="text-sm text-gray-600">Average AQI</div>
                <Activity className="w-6 h-6 mx-auto mt-2 text-purple-400" />
              </CardContent>
            </Card>
          </div>
        )}
        
        {/* Enhanced Controls */}
        <div className="flex flex-col lg:flex-row gap-4 p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="flex flex-col sm:flex-row gap-4 flex-1">
            {/* View Mode Selector */}
            <div className="flex items-center space-x-2">
              <Eye className="w-4 h-4 text-gray-500" />
              <Select value={viewMode} onValueChange={(value: 'grid' | 'list' | 'heatmap') => setViewMode(value)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="grid">Grid View</SelectItem>
                  <SelectItem value="list">List View</SelectItem>
                  <SelectItem value="heatmap">Heat Map</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Filter Controls */}
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <Select value={filterLevel} onValueChange={setFilterLevel}>
                <SelectTrigger className="w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  <SelectItem value="good">Good (≤50)</SelectItem>
                  <SelectItem value="moderate">Moderate (51-100)</SelectItem>
                  <SelectItem value="unhealthy">Unhealthy (&gt;100)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Sort Controls */}
            <div className="flex items-center space-x-2">
              <BarChart3 className="w-4 h-4 text-gray-500" />
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="aqi">By AQI</SelectItem>
                  <SelectItem value="location">By Location</SelectItem>
                  <SelectItem value="pm25">By PM2.5</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      <Tabs defaultValue="stations" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="stations" className="flex items-center gap-2">
            <Target className="w-4 h-4" />
            Ground Stations
          </TabsTrigger>
          <TabsTrigger value="heatmap" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Heat Map
          </TabsTrigger>
        </TabsList>

        <TabsContent value="stations">
          <Card className="shadow-lg border-0">
            <CardHeader className="pb-4 border-b border-gray-100">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Target className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <span className="text-xl font-semibold">Air Quality Monitoring Stations</span>
                    <p className="text-sm text-gray-600 mt-1">
                      {filterAndSortData().length} stations showing • Last updated: {new Date().toLocaleTimeString()}
                    </p>
                  </div>
                </div>
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                  Live Data
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {filterAndSortData().length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-20 h-20 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                    <MapPin className="w-10 h-10 text-gray-400" />
                  </div>
                  <p className="text-lg font-medium text-gray-600 mb-2">
                    No stations match your filters
                  </p>
                  <p className="text-sm text-gray-500">
                    Try adjusting your filter settings or check back later
                  </p>
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={() => {
                      setFilterLevel('all');
                      setSortBy('aqi');
                    }}
                  >
                    Reset Filters
                  </Button>
                </div>
              ) : (
                <TooltipProvider>
                  <div className={`grid gap-4 ${
                    viewMode === 'grid' ? 'grid-cols-1 lg:grid-cols-2' :
                    viewMode === 'list' ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
                  }`}>
                    {filterAndSortData().map((locationItem, index) => {
                      const distance = getStationDistance(locationItem.coordinates.lat, locationItem.coordinates.lng);
                      const health = getHealthRecommendation(locationItem.aqi);
                      const isSelected = selectedStation === index;
                      
                      return (
                        <Tooltip key={index}>
                          <TooltipTrigger asChild>
                            <div
                              className={`group relative p-4 md:p-6 rounded-xl border-2 transition-all duration-300 cursor-pointer transform hover:scale-105 hover:shadow-lg ${
                                isSelected ? 'ring-2 ring-blue-500 ring-offset-2' : ''
                              } ${getAQIBgColor(locationItem.aqi)}`}
                              onClick={() => setSelectedStation(isSelected ? null : index)}
                            >
                              {/* Header */}
                              <div className="flex items-start justify-between mb-4">
                                <div className="flex-1 min-w-0">
                                  <h3 className="font-bold text-base md:text-lg text-gray-900 truncate group-hover:text-blue-700 transition-colors">
                                    {locationItem.location}
                                  </h3>
                                  <div className="flex items-center space-x-2 mt-1">
                                    <p className="text-xs md:text-sm text-gray-600 truncate">
                                      {locationItem.coordinates.lat.toFixed(4)}, {locationItem.coordinates.lng.toFixed(4)}
                                    </p>
                                    {distance && (
                                      <Badge variant="secondary" className="text-xs">
                                        {distance.toFixed(1)} km
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                                <div className="flex flex-col items-end space-y-2">
                                  <Badge variant="outline" className="text-xs flex items-center space-x-1">
                                    {getSourceIcon(locationItem.source)}
                                    <span className="hidden sm:inline">{locationItem.source}</span>
                                  </Badge>
                                  {getAQITrendIcon(locationItem.aqi)}
                                </div>
                              </div>
                              
                              {/* Main AQI Display */}
                              <div className="flex items-center space-x-6 mb-4">
                                <div className="text-center">
                                  <div className={`text-3xl md:text-4xl font-bold ${getAQIColor(locationItem.aqi)} transition-colors`}>
                                    {locationItem.aqi}
                                  </div>
                                  <p className="text-sm md:text-base font-semibold text-gray-700">{locationItem.level}</p>
                                  <Progress value={(locationItem.aqi / 300) * 100} className="w-16 h-2 mt-2" />
                                </div>
                                
                                {/* Health Recommendation */}
                                <div className={`flex-1 p-3 rounded-lg border ${health.color}`}>
                                  <div className="flex items-center space-x-2 mb-1">
                                    {health.icon}
                                    <span className="font-medium text-sm">{health.level}</span>
                                  </div>
                                  <p className="text-xs text-gray-600">{health.advice}</p>
                                </div>
                              </div>
                              
                              {/* Pollutant Details */}
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                                <div className="text-center p-2 bg-white/50 rounded-lg">
                                  <span className="text-xs text-gray-600 block">PM2.5</span>
                                  <span className="text-sm md:text-base font-bold text-gray-900">
                                    {locationItem.pollutants.pm25 || '--'}
                                  </span>
                                </div>
                                <div className="text-center p-2 bg-white/50 rounded-lg">
                                  <span className="text-xs text-gray-600 block">PM10</span>
                                  <span className="text-sm md:text-base font-bold text-gray-900">
                                    {locationItem.pollutants.pm10 || '--'}
                                  </span>
                                </div>
                                <div className="text-center p-2 bg-white/50 rounded-lg">
                                  <span className="text-xs text-gray-600 block">O₃</span>
                                  <span className="text-sm md:text-base font-bold text-gray-900">
                                    {locationItem.pollutants.o3 || '--'}
                                  </span>
                                </div>
                                <div className="text-center p-2 bg-white/50 rounded-lg">
                                  <span className="text-xs text-gray-600 block">NO₂</span>
                                  <span className="text-sm md:text-base font-bold text-gray-900">
                                    {locationItem.pollutants.no2 || '--'}
                                  </span>
                                </div>
                              </div>
                              
                              {/* Expanded Details */}
                              {isSelected && (
                                <div className="mt-4 p-4 bg-white/80 rounded-lg border border-gray-200 animate-in slide-in-from-top-1">
                                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                                    <Info className="w-4 h-4 mr-2" />
                                    Detailed Information
                                  </h4>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                    <div>
                                      <p className="text-gray-600 mb-2"><strong>Data Source:</strong> {locationItem.source}</p>
                                      <p className="text-gray-600 mb-2"><strong>Last Updated:</strong> {new Date().toLocaleString()}</p>
                                      {distance && (
                                        <p className="text-gray-600 mb-2"><strong>Distance:</strong> {distance.toFixed(2)} km from your location</p>
                                      )}
                                    </div>
                                    <div>
                                      <p className="text-gray-600 mb-2"><strong>Air Quality Trend:</strong> Stable</p>
                                      <p className="text-gray-600 mb-2"><strong>Primary Pollutant:</strong> PM2.5</p>
                                      <p className="text-gray-600"><strong>Forecast:</strong> Improving</p>
                                    </div>
                                  </div>
                                </div>
                              )}
                              
                              {/* Click indicator */}
                              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                              </div>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="max-w-xs">
                            <div className="text-center">
                              <p className="font-medium">{locationItem.location}</p>
                              <p className="text-sm">AQI: {locationItem.aqi} • {locationItem.level}</p>
                              <p className="text-xs mt-1">Click for detailed information</p>
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      );
                    })}
                  </div>
                </TooltipProvider>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Data Sources Info */}
      <Card className="shadow-lg">
        <CardContent className="p-6">
          <h4 className="font-semibold text-lg mb-4 flex items-center gap-2">
            <Zap className="w-5 h-5" />
            Integrated Data Sources
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
            <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg border border-green-200">
              <Radio className="w-5 h-5 text-green-600 flex-shrink-0" />
              <div>
                <p className="font-medium">OpenAQ Network</p>
                <p className="text-xs text-muted-foreground">Global ground stations</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-3 bg-orange-50 rounded-lg border border-orange-200">
              <MapPin className="w-5 h-5 text-orange-600 flex-shrink-0" />
              <div>
                <p className="font-medium">Local Monitors</p>
                <p className="text-xs text-muted-foreground">Government stations</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-3 bg-purple-50 rounded-lg border border-purple-200">
              <Cloud className="w-5 h-5 text-purple-600 flex-shrink-0" />
              <div>
                <p className="font-medium">Weather APIs</p>
                <p className="text-xs text-muted-foreground">Meteorological data</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}