/**
 * Hourly Forecast Maps Component
 * Displays TEMPO NO2/HCHO data with uncertainty visualization
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import { useState, useEffect } from 'react';
import { 
  Clock, 
  Satellite, 
  Activity, 
  Eye, 
  Play, 
  Pause, 
  SkipForward, 
  SkipBack,
  Wind,
  Layers,
  AlertTriangle
} from 'lucide-react';
import { TempoData } from '@/types/airQuality';
import L from 'leaflet';

// Mock TEMPO data for demonstration
const generateTempoData = (hour: number): TempoData[] => {
  const baseCoordinates = { lat: 34.0522, lng: -118.2437 };
  const gridSize = 10;
  const data: TempoData[] = [];
  
  for (let i = 0; i < gridSize; i++) {
    for (let j = 0; j < gridSize; j++) {
      const lat = baseCoordinates.lat + (i - gridSize/2) * 0.1;
      const lng = baseCoordinates.lng + (j - gridSize/2) * 0.1;
      
      // Simulate time-varying NO2 and HCHO concentrations
      const timeVariation = Math.sin((hour / 24) * 2 * Math.PI) * 0.3 + 1;
      const spatialVariation = Math.sin(i * 0.5) * Math.cos(j * 0.5) * 0.5 + 1;
      
      data.push({
        timestamp: new Date().toISOString(),
        coordinates: { lat, lng },
        no2_column: (Math.random() * 3e15 + 1e15) * timeVariation * spatialVariation,
        hcho_column: (Math.random() * 1.5e16 + 5e15) * timeVariation * spatialVariation,
        uncertainty: {
          no2: Math.random() * 0.2 + 0.1,
          hcho: Math.random() * 0.3 + 0.15
        },
        cloud_fraction: Math.random() * 0.3,
        quality_flag: Math.random() > 0.2 ? 'good' : 'moderate',
        viewing_angle: Math.random() * 10 + 45,
        source: 'TEMPO_FORECAST'
      });
    }
  }
  
  return data;
};

// Color interpolation for concentration overlays
const getConcentrationColor = (value: number, min: number, max: number, opacity: number = 0.6) => {
  const normalized = Math.max(0, Math.min(1, (value - min) / (max - min)));
  
  // Blue to Red color scale
  if (normalized <= 0.5) {
    const t = normalized * 2;
    return `rgba(${Math.floor(0 + t * 255)}, ${Math.floor(100 + t * 155)}, 255, ${opacity})`;
  } else {
    const t = (normalized - 0.5) * 2;
    return `rgba(255, ${Math.floor(255 - t * 255)}, ${Math.floor(255 - t * 255)}, ${opacity})`;
  }
};

// Map component for rendering concentration overlays
function ConcentrationOverlay({ data, parameter, uncertaintyMode }: { 
  data: TempoData[], 
  parameter: 'no2' | 'hcho',
  uncertaintyMode: boolean 
}) {
  const map = useMap();
  
  useEffect(() => {
    // Clear existing overlays
    map.eachLayer((layer) => {
      if (layer instanceof L.Circle) {
        map.removeLayer(layer);
      }
    });
    
    // Add concentration circles
    const values = data.map(d => d[`${parameter}_column`]);
    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);
    
    data.forEach(point => {
      const value = point[`${parameter}_column`];
      const uncertainty = point.uncertainty[parameter];
      
      const radius = uncertaintyMode ? uncertainty * 5000 : 3000;
      const color = getConcentrationColor(value, minValue, maxValue, uncertaintyMode ? 0.3 : 0.6);
      
      const circle = L.circle([point.coordinates.lat, point.coordinates.lng], {
        radius,
        fillColor: color,
        color: uncertaintyMode ? '#ef4444' : color,
        weight: uncertaintyMode ? 2 : 1,
        opacity: uncertaintyMode ? 0.8 : 0.6,
        fillOpacity: uncertaintyMode ? 0.2 : 0.4
      });
      
      circle.bindPopup(`
        <div class="p-2">
          <h4 class="font-semibold">${parameter.toUpperCase()} Concentration</h4>
          <p><strong>Value:</strong> ${(value / 1e15).toFixed(2)} × 10¹⁵ molecules/cm²</p>
          <p><strong>Uncertainty:</strong> ±${(uncertainty * 100).toFixed(1)}%</p>
          <p><strong>Quality:</strong> ${point.quality_flag}</p>
          <p><strong>Cloud Fraction:</strong> ${(point.cloud_fraction * 100).toFixed(1)}%</p>
        </div>
      `);
      
      circle.addTo(map);
    });
  }, [map, data, parameter, uncertaintyMode]);
  
  return null;
}

export default function ForecastMaps() {
  const [currentHour, setCurrentHour] = useState(new Date().getHours());
  const [selectedParameter, setSelectedParameter] = useState<'no2' | 'hcho'>('no2');
  const [uncertaintyMode, setUncertaintyMode] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  
  const [forecastData, setForecastData] = useState<{ [hour: number]: TempoData[] }>({});
  
  // Generate forecast data for all hours
  useEffect(() => {
    const data: { [hour: number]: TempoData[] } = {};
    for (let hour = 0; hour < 24; hour++) {
      data[hour] = generateTempoData(hour);
    }
    setForecastData(data);
  }, []);
  
  // Auto-play functionality
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentHour(prev => (prev + 1) % 24);
      }, 2000 / playbackSpeed);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlaying, playbackSpeed]);
  
  const formatHour = (hour: number) => {
    if (hour === 0) return '12 AM';
    if (hour < 12) return `${hour} AM`;
    if (hour === 12) return '12 PM';
    return `${hour - 12} PM`;
  };
  
  const currentData = forecastData[currentHour] || [];
  
  const getParameterInfo = (param: 'no2' | 'hcho') => {
    return param === 'no2' ? {
      name: 'Nitrogen Dioxide',
      unit: 'molecules/cm²',
      description: 'Trace gas from combustion and industrial sources',
      healthImpact: 'Respiratory irritation, asthma aggravation'
    } : {
      name: 'Formaldehyde',
      unit: 'molecules/cm²', 
      description: 'Volatile organic compound from various sources',
      healthImpact: 'Eye/throat irritation, potential carcinogen'
    };
  };
  
  const parameterInfo = getParameterInfo(selectedParameter);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-4 sm:space-y-0">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold flex items-center space-x-2">
            <Satellite className="w-6 h-6 sm:w-8 sm:h-8" />
            <span>TEMPO Hourly Forecast</span>
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Real-time atmospheric composition from space
          </p>
        </div>
        <Badge variant="outline" className="flex items-center space-x-1">
          <Clock className="w-4 h-4" />
          <span>{formatHour(currentHour)}</span>
        </Badge>
      </div>
      
      {/* Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Activity className="w-5 h-5" />
            <span>Forecast Controls</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Time Controls */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-medium">Time Selection</span>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentHour(Math.max(0, currentHour - 1))}
                  >
                    <SkipBack className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsPlaying(!isPlaying)}
                  >
                    {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentHour(Math.min(23, currentHour + 1))}
                  >
                    <SkipForward className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              
              <div className="space-y-2">
                <Slider
                  value={[currentHour]}
                  onValueChange={(value) => setCurrentHour(value[0])}
                  max={23}
                  min={0}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>12 AM</span>
                  <span>6 AM</span>
                  <span>12 PM</span>
                  <span>6 PM</span>
                  <span>11 PM</span>
                </div>
              </div>
            </div>
            
            {/* Parameter and Mode Selection */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Parameter</label>
                <Tabs value={selectedParameter} onValueChange={(value) => setSelectedParameter(value as 'no2' | 'hcho')}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="no2">NO₂</TabsTrigger>
                    <TabsTrigger value="hcho">HCHO</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">View Mode</label>
                <Button
                  variant={uncertaintyMode ? "default" : "outline"}
                  onClick={() => setUncertaintyMode(!uncertaintyMode)}
                  className="w-full"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  {uncertaintyMode ? 'Uncertainty' : 'Concentration'}
                </Button>
              </div>
              
              {isPlaying && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Playback Speed</label>
                  <Slider
                    value={[playbackSpeed]}
                    onValueChange={(value) => setPlaybackSpeed(value[0])}
                    max={4}
                    min={0.5}
                    step={0.5}
                    className="w-full"
                  />
                  <div className="text-xs text-muted-foreground text-center">
                    {playbackSpeed}x speed
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Parameter Information */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold text-lg">{parameterInfo.name}</h4>
              <p className="text-sm text-muted-foreground mt-1">
                {parameterInfo.description}
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-orange-500" />
                <span className="text-sm font-medium">Health Impact</span>
              </div>
              <p className="text-sm text-muted-foreground">
                {parameterInfo.healthImpact}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Map */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Layers className="w-5 h-5" />
            <span>
              {uncertaintyMode ? 'Uncertainty Map' : 'Concentration Map'} - {formatHour(currentHour)}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative rounded-lg h-96 lg:h-[500px] overflow-hidden border">
            <MapContainer
              center={[34.0522, -118.2437] as [number, number]}
              zoom={9}
              style={{ height: '100%', width: '100%' }}
              className="rounded-lg"
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              
              <ConcentrationOverlay 
                data={currentData}
                parameter={selectedParameter}
                uncertaintyMode={uncertaintyMode}
              />
            </MapContainer>
          </div>
          
          {/* Color Scale Legend */}
          <div className="mt-4 p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">
                {uncertaintyMode ? 'Uncertainty Level' : `${selectedParameter.toUpperCase()} Concentration`}
              </span>
              <span className="text-xs text-muted-foreground">
                {uncertaintyMode ? '(±%)' : parameterInfo.unit}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-xs">Low</span>
              <div className="flex-1 h-4 bg-gradient-to-r from-blue-400 via-yellow-400 to-red-500 rounded"></div>
              <span className="text-xs">High</span>
            </div>
          </div>
          
          {/* Data Quality Indicators */}
          <div className="mt-4 grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-lg font-bold text-green-600">
                {currentData.filter(d => d.quality_flag === 'good').length}
              </div>
              <div className="text-xs text-muted-foreground">Good Quality</div>
            </div>
            <div>
              <div className="text-lg font-bold text-yellow-600">
                {currentData.filter(d => d.quality_flag === 'moderate').length}
              </div>
              <div className="text-xs text-muted-foreground">Moderate Quality</div>
            </div>
            <div>
              <div className="text-lg font-bold text-blue-600">
                {currentData.length > 0 ? (currentData.reduce((sum, d) => sum + d.cloud_fraction, 0) / currentData.length * 100).toFixed(0) : 0}%
              </div>
              <div className="text-xs text-muted-foreground">Avg Cloud Cover</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}