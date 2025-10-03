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
  Info
} from 'lucide-react';
import { useState } from 'react';

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
  const [selectedTimeRange, setSelectedTimeRange] = useState('24h');
  const [selectedParameters, setSelectedParameters] = useState(['no2', 'pm25', 'ozone']);
  const [analysisMode, setAnalysisMode] = useState('comparison');
  const [showRawData, setShowRawData] = useState(false);

  // Mock data sources - in real implementation this would come from API
  const dataSources: DataSource[] = [
    {
      id: 'tempo',
      name: 'NASA TEMPO Satellite',
      type: 'satellite',
      status: 'online',
      lastUpdate: '2025-10-03T14:30:00Z',
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
      lastUpdate: '2025-10-03T12:00:00Z',
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
      lastUpdate: '2025-10-03T13:45:00Z',
      coverage: 'Global',
      resolution: '10km × 10km',
      parameters: ['Precipitation Rate', 'Precipitation Type'],
      apiEndpoint: '/api/gpm-data'
    },
    {
      id: 'airnow',
      name: 'EPA AirNow Network',
      type: 'ground',
      status: 'online',
      lastUpdate: '2025-10-03T14:45:00Z',
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
      status: 'online',
      lastUpdate: '2025-10-03T14:40:00Z',
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
      status: 'online',
      lastUpdate: '2025-10-03T14:50:00Z',
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
      lastUpdate: '2025-10-03T12:00:00Z',
      coverage: 'Global',
      resolution: '25km × 25km',
      parameters: ['Wind Fields', 'Temperature', 'Humidity', 'Chemical Transport'],
      apiEndpoint: '/api/geos5-data'
    }
  ];

  // Mock analysis data
  const mockAnalysisData: AnalysisData[] = [
    {
      timestamp: '2025-10-03T14:00:00Z',
      no2: { satellite: 42.5, ground: 45.2, unit: 'µg/m³' },
      formaldehyde: { satellite: 8.3, unit: 'ppbv' },
      pm25: { ground: 18.5, unit: 'µg/m³' },
      pm10: { ground: 28.7, unit: 'µg/m³' },
      ozone: { satellite: 67.8, ground: 65.3, unit: 'µg/m³' },
      aerosolIndex: { satellite: 0.45, unit: 'dimensionless' },
      weather: { temperature: 22.5, humidity: 65, windSpeed: 3.2, pressure: 1013.25 }
    },
    {
      timestamp: '2025-10-03T13:00:00Z',
      no2: { satellite: 38.9, ground: 41.1, unit: 'µg/m³' },
      formaldehyde: { satellite: 7.8, unit: 'ppbv' },
      pm25: { ground: 16.2, unit: 'µg/m³' },
      pm10: { ground: 25.4, unit: 'µg/m³' },
      ozone: { satellite: 72.1, ground: 68.9, unit: 'µg/m³' },
      aerosolIndex: { satellite: 0.38, unit: 'dimensionless' },
      weather: { temperature: 21.8, humidity: 68, windSpeed: 2.8, pressure: 1012.90 }
    }
  ];

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
            Unrestricted access to satellite and ground station air quality data with analysis tools
          </p>
        </div>
        <div className="flex items-center gap-3">
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
                    New York, NY
                  </Button>
                </div>
                <div className="flex items-end">
                  <Button className="w-full">
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Update Analysis
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
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">NO₂ Column Density</span>
                    <div className="text-right">
                      <div className="font-bold">4.25 × 10¹⁵</div>
                      <div className="text-xs text-muted-foreground">molecules/cm²</div>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">HCHO Column Density</span>
                    <div className="text-right">
                      <div className="font-bold">8.3</div>
                      <div className="text-xs text-muted-foreground">ppbv</div>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Aerosol Index</span>
                    <div className="text-right">
                      <div className="font-bold">0.45</div>
                      <div className="text-xs text-muted-foreground">dimensionless</div>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Quality Flag</span>
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      Good
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground border-t pt-2">
                    Last observation: 2025-10-03 14:30:00 UTC<br/>
                    Next observation: 2025-10-03 15:30:00 UTC
                  </div>
                </div>
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
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">PM2.5</span>
                    <div className="text-right">
                      <div className="font-bold">18.5</div>
                      <div className="text-xs text-muted-foreground">µg/m³</div>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">PM10</span>
                    <div className="text-right">
                      <div className="font-bold">28.7</div>
                      <div className="text-xs text-muted-foreground">µg/m³</div>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">O₃</span>
                    <div className="text-right">
                      <div className="font-bold">65.3</div>
                      <div className="text-xs text-muted-foreground">µg/m³</div>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Active Stations</span>
                    <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                      12 nearby
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground border-t pt-2">
                    EPA AirNow + OpenAQ<br/>
                    Update frequency: 15 minutes
                  </div>
                </div>
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
                    <div className="flex justify-between">
                      <span className="text-sm">TEMPO NO₂ Uncertainty</span>
                      <span className="text-sm font-medium">±15%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Cloud Fraction</span>
                      <span className="text-sm font-medium">0.23</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Viewing Angle</span>
                      <span className="text-sm font-medium">32.5°</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Data Quality</span>
                      <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs">
                        High
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-semibold">Ground Station Quality</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">PM2.5 Uncertainty</span>
                      <span className="text-sm font-medium">±5%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Calibration Status</span>
                      <span className="text-sm font-medium">Valid</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Station Uptime</span>
                      <span className="text-sm font-medium">98.5%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Data Completeness</span>
                      <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs">
                        95%+
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-semibold">Combined Analysis</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Data Fusion Confidence</span>
                      <span className="text-sm font-medium">87%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Spatial Coherence</span>
                      <span className="text-sm font-medium">Good</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Temporal Stability</span>
                      <span className="text-sm font-medium">Stable</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Overall Quality</span>
                      <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs">
                        Excellent
                      </Badge>
                    </div>
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
                    <tr className="border-b">
                      <td className="p-3 font-medium">NO₂</td>
                      <td className="p-3">
                        <div>4.25 × 10¹⁵ molecules/cm²</div>
                        <div className="text-xs text-muted-foreground">(≈42.5 µg/m³)</div>
                      </td>
                      <td className="p-3">
                        <div>45.2 µg/m³</div>
                        <div className="text-xs text-muted-foreground">12 stations avg</div>
                      </td>
                      <td className="p-3">
                        <div className="text-green-600">+2.7 µg/m³</div>
                        <div className="text-xs text-muted-foreground">+6.3%</div>
                      </td>
                      <td className="p-3">
                        <Badge variant="secondary" className="bg-green-100 text-green-800">
                          Good
                        </Badge>
                      </td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-3 font-medium">O₃</td>
                      <td className="p-3">
                        <div>67.8 µg/m³</div>
                        <div className="text-xs text-muted-foreground">Column integrated</div>
                      </td>
                      <td className="p-3">
                        <div>65.3 µg/m³</div>
                        <div className="text-xs text-muted-foreground">Surface level</div>
                      </td>
                      <td className="p-3">
                        <div className="text-red-600">-2.5 µg/m³</div>
                        <div className="text-xs text-muted-foreground">-3.7%</div>
                      </td>
                      <td className="p-3">
                        <Badge variant="secondary" className="bg-green-100 text-green-800">
                          Excellent
                        </Badge>
                      </td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-3 font-medium">PM2.5</td>
                      <td className="p-3">
                        <div className="text-muted-foreground">Not directly measured</div>
                        <div className="text-xs text-muted-foreground">Derived from AOD</div>
                      </td>
                      <td className="p-3">
                        <div>18.5 µg/m³</div>
                        <div className="text-xs text-muted-foreground">Direct measurement</div>
                      </td>
                      <td className="p-3">
                        <div className="text-muted-foreground">N/A</div>
                      </td>
                      <td className="p-3">
                        <Badge variant="outline">
                          Ground only
                        </Badge>
                      </td>
                    </tr>
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
                      <span className="font-medium">12/14 hours</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Ground Station Data</span>
                      <span className="font-medium">23.8/24 hours</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Weather Data</span>
                      <span className="font-medium">24/24 hours</span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-2">
                      TEMPO operates during daylight hours only (≈14 hours/day)
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-3">Correlation Analysis</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span>NO₂ (Satellite vs Ground)</span>
                      <span className="font-medium text-green-600">r = 0.84</span>
                    </div>
                    <div className="flex justify-between">
                      <span>O₃ (Satellite vs Ground)</span>
                      <span className="font-medium text-green-600">r = 0.91</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Weather Influence</span>
                      <span className="font-medium text-blue-600">r = 0.67</span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-2">
                      High correlation indicates good agreement between data sources
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