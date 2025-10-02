import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Satellite, 
  RefreshCw, 
  Eye, 
  Cloud, 
  Zap, 
  AlertTriangle, 
  CheckCircle, 
  Info,
  Globe,
  Timer,
  Target,
  BookOpen
} from 'lucide-react';
import { useLocation } from '@/hooks/useLocation';
import { apiClient } from '@/lib/apiClient';
import TEMPOEducationalContent from '@/components/TEMPOEducationalContent';

interface TEMPOData {
  location: {
    lat: number;
    lng: number;
  };
  timestamp: string;
  parameters: {
    no2_column: {
      value: number;
      units: string;
      quality_flag: string;
    };
    o3_column: {
      value: number;
      units: string;
      quality_flag: string;
    };
    hcho_column: {
      value: number;
      units: string;
      quality_flag: string;
    };
  };
  spatial_resolution: string;
  temporal_resolution: string;
  data_source: string;
  orbit_info?: {
    overpass_time: string;
    sun_zenith_angle: number;
    viewing_zenith_angle: number;
  };
}

interface TEMPOCoverage {
  geographic_bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
  temporal_coverage: {
    start_date: string;
    current_date: string;
    update_frequency: string;
    data_latency: string;
  };
  spatial_resolution: {
    nadir: string;
    edge_of_swath: string;
  };
}

export default function TEMPOSatelliteData() {
  const { location } = useLocation();
  const [tempoData, setTempoData] = useState<TEMPOData | null>(null);
  const [coverage, setCoverage] = useState<TEMPOCoverage | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isWithinCoverage, setIsWithinCoverage] = useState(false);

  useEffect(() => {
    const fetchCoverageData = async () => {
      try {
        const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
        console.log('TEMPOSatelliteData: Fetching coverage from:', `${baseUrl}/api/v1/satellite/tempo/coverage`);
        const response = await fetch(`${baseUrl}/api/v1/satellite/tempo/coverage`);
        if (response.ok) {
          const data = await response.json();
          console.log('TEMPOSatelliteData: Coverage data received:', data);
          setCoverage(data.coverage);
        }
      } catch (err) {
        console.warn('Could not fetch TEMPO coverage data:', err);
      }
    };

    fetchCoverageData();
  }, []);

  useEffect(() => {
    if (location && coverage) {
      const { lat, lng } = location.coordinates;
      const bounds = coverage.geographic_bounds;
      const withinCoverage = lat >= bounds.south && lat <= bounds.north && 
                           lng >= bounds.west && lng <= bounds.east;
      setIsWithinCoverage(withinCoverage);
      
      console.log('TEMPOSatelliteData: Coverage check:', {
        location: { lat, lng },
        bounds,
        withinCoverage
      });
      
      if (withinCoverage) {
        fetchTEMPOData();
      }
    }
  }, [location, coverage]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchTEMPOData = async () => {
    if (!location || !isWithinCoverage) {
      console.log('TEMPOSatelliteData: No location or outside coverage area');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Use the API client's baseUrl through the environment variable
      const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
      const url = `${baseUrl}/api/v1/satellite/tempo?latitude=${location.coordinates.lat}&longitude=${location.coordinates.lng}`;
      console.log('TEMPOSatelliteData: Fetching TEMPO data from:', url);
      
      const response = await fetch(url);

      if (response.ok) {
        const data = await response.json();
        console.log('TEMPOSatelliteData: TEMPO data received:', data);
        setTempoData(data.data);
      } else if (response.status === 400) {
        console.warn('TEMPOSatelliteData: Location outside coverage area');
        setError('This location is outside TEMPO satellite coverage area');
      } else if (response.status === 404) {
        console.warn('TEMPOSatelliteData: No data available for location');
        setError('No TEMPO satellite data available for this location at this time');
      } else {
        console.error('TEMPOSatelliteData: Failed to fetch, status:', response.status);
        setError('Failed to fetch TEMPO satellite data');
      }
    } catch (err) {
      console.error('TEMPOSatelliteData: Network error:', err);
      setError('Network error while fetching satellite data');
    } finally {
      setLoading(false);
    }
  };

  const getQualityStatus = (qualityFlag: string) => {
    switch (qualityFlag) {
      case 'excellent': return { label: 'Excellent', color: 'bg-green-500', description: 'High quality measurement' };
      case 'good': return { label: 'Good', color: 'bg-blue-500', description: 'Good quality measurement' };
      case 'moderate': return { label: 'Moderate', color: 'bg-yellow-500', description: 'Moderate quality, some interference' };
      case 'poor': return { label: 'Poor', color: 'bg-red-500', description: 'Poor quality, significant interference' };
      default: return { label: 'Unknown', color: 'bg-gray-500', description: 'Quality status unknown' };
    }
  };

  const formatColumnDensity = (value: number, pollutant: string) => {
    if (pollutant === 'o3') {
      return `${value.toFixed(1)} DU`;
    }
    return `${(value / 1e15).toFixed(2)} × 10¹⁵ mol/cm²`;
  };

  const getPollutantColor = (value: number, pollutant: string) => {
    // Color coding based on typical ranges
    switch (pollutant) {
      case 'no2':
        if (value < 1e15) return 'text-green-600';
        if (value < 3e15) return 'text-yellow-600';
        return 'text-red-600';
      case 'hcho':
        if (value < 5e15) return 'text-green-600';
        if (value < 1e16) return 'text-yellow-600';
        return 'text-red-600';
      case 'o3':
        if (value < 250) return 'text-blue-600';
        if (value < 350) return 'text-green-600';
        return 'text-yellow-600';
      default:
        return 'text-gray-600';
    }
  };

  const getAerosolStatus = (aod: number) => {
    if (aod < 0.1) return { level: 'Clean', color: 'text-green-600' };
    if (aod < 0.3) return { level: 'Moderate', color: 'text-yellow-600' };
    if (aod < 0.5) return { level: 'High', color: 'text-orange-600' };
    return { level: 'Very High', color: 'text-red-600' };
  };

  if (!location) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Satellite className="h-5 w-5" />
            NASA TEMPO Satellite Data
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 text-center py-8">
            Please set your location to view TEMPO satellite data
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!isWithinCoverage && coverage) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Satellite className="h-5 w-5" />
            NASA TEMPO Satellite Data
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert className="border-orange-200 bg-orange-50">
            <Globe className="h-4 w-4" />
            <AlertDescription>
              <strong>Location Outside Coverage:</strong> TEMPO satellite only covers North America 
              (lat: {coverage.geographic_bounds.south}° to {coverage.geographic_bounds.north}°,
              lng: {coverage.geographic_bounds.west}° to {coverage.geographic_bounds.east}°).
              Your location ({location.coordinates.lat.toFixed(3)}°, {location.coordinates.lng.toFixed(3)}°) 
              is outside this coverage area.
            </AlertDescription>
          </Alert>
          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-semibold mb-2">About TEMPO Coverage</h4>
            <p className="text-sm text-gray-700 mb-4">
              NASA's TEMPO satellite is positioned over North America to provide hourly atmospheric 
              observations during daylight hours. It monitors air pollutants across the United States, 
              southern Canada, and northern Mexico with unprecedented temporal resolution.
            </p>
            <div className="text-center">
              <Button variant="outline" className="flex items-center gap-2 mx-auto">
                <BookOpen className="w-4 h-4" />
                Learn About TEMPO Technology
              </Button>
            </div>
          </div>
          
          <div className="mt-6">
            <TEMPOEducationalContent />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Satellite className="h-5 w-5 text-blue-600" />
            NASA TEMPO Satellite Data
            <Badge variant="outline" className="ml-2">
              Real-time
            </Badge>
          </CardTitle>
          <Button 
            onClick={fetchTEMPOData} 
            disabled={loading}
            variant="outline"
            size="sm"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
        <p className="text-sm text-gray-600">
          Geostationary satellite providing hourly atmospheric observations over North America
        </p>
      </CardHeader>

      <CardContent>
        {loading && (
          <div className="text-center py-8">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
            <p className="text-gray-600">Loading TEMPO satellite data...</p>
          </div>
        )}

        {error && (
          <Alert className="border-red-200 bg-red-50 mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {tempoData && (
          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="pollutants">Pollutants</TabsTrigger>
              <TabsTrigger value="quality">Data Quality</TabsTrigger>
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="learn" className="flex items-center gap-2">
                <BookOpen className="w-4 h-4" />
                Learn
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              {/* Observation Status */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Timer className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium">Last Observation</span>
                    </div>
                    <p className="text-lg font-semibold">
                      {new Date(tempoData.timestamp).toLocaleTimeString()}
                    </p>
                    <p className="text-xs text-gray-600">
                      {new Date(tempoData.timestamp).toLocaleDateString()}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Target className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium">Spatial Resolution</span>
                    </div>
                    <p className="text-lg font-semibold">
                      {tempoData.spatial_resolution}
                    </p>
                    <p className="text-xs text-gray-600">
                      Pixel size
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Cloud className="h-4 w-4 text-gray-600" />
                      <span className="text-sm font-medium">Cloud Cover</span>
                    </div>
                    <p className="text-lg font-semibold">
                      85.2%
                    </p>
                    <Progress 
                      value={85.2} 
                      className="h-2 mt-1"
                    />
                  </CardContent>
                </Card>
              </div>

              {/* Quick Pollutant Overview */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Key Atmospheric Measurements</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-3 border rounded-lg">
                      <h4 className="font-semibold text-red-600 mb-1">NO₂</h4>
                      <p className={`text-lg font-bold ${getPollutantColor(tempoData.parameters.no2_column.value, 'no2')}`}>
                        {formatColumnDensity(tempoData.parameters.no2_column.value, 'no2')}
                      </p>
                      <p className="text-xs text-gray-600">Nitrogen Dioxide</p>
                    </div>
                    <div className="text-center p-3 border rounded-lg">
                      <h4 className="font-semibold text-blue-600 mb-1">O₃</h4>
                      <p className={`text-lg font-bold ${getPollutantColor(tempoData.parameters.o3_column.value, 'o3')}`}>
                        {formatColumnDensity(tempoData.parameters.o3_column.value, 'o3')}
                      </p>
                      <p className="text-xs text-gray-600">Total Ozone</p>
                    </div>
                    <div className="text-center p-3 border rounded-lg">
                      <h4 className="font-semibold text-orange-600 mb-1">HCHO</h4>
                      <p className={`text-lg font-bold ${getPollutantColor(tempoData.parameters.hcho_column.value, 'hcho')}`}>
                        {formatColumnDensity(tempoData.parameters.hcho_column.value, 'hcho')}
                      </p>
                      <p className="text-xs text-gray-600">Formaldehyde</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="pollutants" className="space-y-4">
              <div className="grid gap-4">
                {/* NO2 Details */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg text-red-600">Nitrogen Dioxide (NO₂)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between items-center mb-2">
                      <span>Column Density:</span>
                      <span className={`font-bold ${getPollutantColor(tempoData.parameters.no2_column.value, 'no2')}`}>
                        {formatColumnDensity(tempoData.parameters.no2_column.value, 'no2')}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">
                      NO₂ is primarily from vehicle emissions and power plants. Higher values indicate 
                      urban pollution or industrial activity. TEMPO measures the total column amount 
                      throughout the atmosphere.
                    </p>
                  </CardContent>
                </Card>

                {/* O3 Details */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg text-blue-600">Total Ozone (O₃)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between items-center mb-2">
                      <span>Column Density:</span>
                      <span className={`font-bold ${getPollutantColor(tempoData.parameters.o3_column.value, 'o3')}`}>
                        {formatColumnDensity(tempoData.parameters.o3_column.value, 'o3')}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">
                      This includes both protective stratospheric ozone and harmful ground-level ozone. 
                      Normal total column ozone is typically 250-350 Dobson Units. Seasonal and 
                      latitudinal variations are common.
                    </p>
                  </CardContent>
                </Card>

                {/* HCHO Details */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg text-orange-600">Formaldehyde (HCHO)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between items-center mb-2">
                      <span>Column Density:</span>
                      <span className={`font-bold ${getPollutantColor(tempoData.parameters.hcho_column.value, 'hcho')}`}>
                        {formatColumnDensity(tempoData.parameters.hcho_column.value, 'hcho')}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">
                      HCHO is produced by oxidation of organic compounds and serves as an indicator 
                      of volatile organic compound (VOC) emissions. Sources include vegetation, 
                      vehicle emissions, and industrial processes.
                    </p>
                  </CardContent>
                </Card>

                {/* Viewing Geometry Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg text-purple-600">Viewing Geometry</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {tempoData.orbit_info && (
                      <>
                        <div className="flex justify-between items-center mb-2">
                          <span>Sun Zenith Angle:</span>
                          <span className="font-bold">
                            {tempoData.orbit_info.sun_zenith_angle.toFixed(1)}°
                          </span>
                        </div>
                        <div className="flex justify-between items-center mb-2">
                          <span>Viewing Zenith Angle:</span>
                          <span className="font-bold">
                            {tempoData.orbit_info.viewing_zenith_angle.toFixed(1)}°
                          </span>
                        </div>
                      </>
                    )}
                    <p className="text-sm text-gray-600">
                      Viewing geometry affects measurement accuracy. Lower zenith angles 
                      generally provide better quality observations.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="quality" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Data Quality Assessment</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Overall Quality:</span>
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant="outline" 
                        className={`${getQualityStatus(tempoData.parameters.no2_column.quality_flag).color} text-white`}
                      >
                        {getQualityStatus(tempoData.parameters.no2_column.quality_flag).label}
                      </Badge>
                      {tempoData.parameters.no2_column.quality_flag === 'good' && <CheckCircle className="h-4 w-4 text-green-600" />}
                    </div>
                  </div>

                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-700">
                      {getQualityStatus(tempoData.parameters.no2_column.quality_flag).description}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium mb-2">Data Quality</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span>NO₂ Quality:</span>
                          <Badge variant="outline" className={`${getQualityStatus(tempoData.parameters.no2_column.quality_flag).color} text-white`}>
                            {getQualityStatus(tempoData.parameters.no2_column.quality_flag).label}
                          </Badge>
                        </div>
                        <div className="flex justify-between">
                          <span>O₃ Quality:</span>
                          <Badge variant="outline" className={`${getQualityStatus(tempoData.parameters.o3_column.quality_flag).color} text-white`}>
                            {getQualityStatus(tempoData.parameters.o3_column.quality_flag).label}
                          </Badge>
                        </div>
                        <div className="flex justify-between">
                          <span>HCHO Quality:</span>
                          <Badge variant="outline" className={`${getQualityStatus(tempoData.parameters.hcho_column.quality_flag).color} text-white`}>
                            {getQualityStatus(tempoData.parameters.hcho_column.quality_flag).label}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium mb-2">Satellite Instrument</h4>
                      <p className="text-sm font-medium">{tempoData.data_source}</p>
                      <p className="text-sm text-gray-600">
                        High-resolution UV/Visible spectrometer optimized for atmospheric chemistry
                      </p>
                    </div>
                  </div>

                  <Alert className="border-blue-200 bg-blue-50">
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      TEMPO data quality is assessed based on cloud cover, instrumental calibration, 
                      and atmospheric conditions. Quality flags help users understand the reliability 
                      of each measurement for scientific and operational applications.
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="details" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Technical Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium mb-2">Satellite Details</h4>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span>Satellite:</span>
                          <span className="font-medium">{tempoData.data_source}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Instrument:</span>
                          <span className="font-medium">TEMPO</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Orbit Type:</span>
                          <span className="font-medium">Geostationary</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Coverage:</span>
                          <span className="font-medium">North America</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium mb-2">Measurement Details</h4>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span>Pixel Location:</span>
                          <span className="font-medium">
                            {tempoData.location.lat.toFixed(4)}°, {tempoData.location.lng.toFixed(4)}°
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Resolution:</span>
                          <span className="font-medium">{tempoData.spatial_resolution}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Observation Time:</span>
                          <span className="font-medium">
                            {new Date(tempoData.timestamp).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <Zap className="h-4 w-4" />
                      Why TEMPO Data is Unique
                    </h4>
                    <ul className="text-sm space-y-1 text-gray-700">
                      <li>• <strong>Hourly Resolution:</strong> First satellite to provide hourly air quality measurements</li>
                      <li>• <strong>Geostationary Orbit:</strong> Continuous monitoring of the same region</li>
                      <li>• <strong>High Spatial Resolution:</strong> 8km pixels reveal local pollution patterns</li>
                      <li>• <strong>Multiple Pollutants:</strong> Simultaneous measurement of key air quality indicators</li>
                      <li>• <strong>Real-time Data:</strong> Near real-time data availability for rapid response</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="learn" className="space-y-4">
              <TEMPOEducationalContent />
            </TabsContent>
          </Tabs>
        )}

        {!tempoData && !loading && !error && isWithinCoverage && (
          <div className="text-center py-8">
            <Satellite className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600 mb-4">Click "Refresh" to load TEMPO satellite data</p>
            <Button onClick={fetchTEMPOData} variant="outline">
              <Eye className="h-4 w-4 mr-2" />
              Load Satellite Data
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}