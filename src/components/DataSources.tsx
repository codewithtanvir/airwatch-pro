import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Satellite, Radio, MapPin, Cloud, ExternalLink, Database, Clock, CheckCircle } from 'lucide-react';

export default function DataSources() {
  const dataSources = [
    {
      name: 'TEMPO Satellite',
      description: 'NASA\'s Tropospheric Emissions: Monitoring of Pollution instrument provides hourly daytime measurements of air quality over North America.',
      icon: <Satellite className="w-5 h-5" />,
      status: 'Active',
      lastUpdate: '15 minutes ago',
      coverage: 'North America',
      parameters: ['NO₂', 'O₃', 'SO₂', 'HCHO', 'Aerosols'],
      accuracy: '95%',
      website: 'https://tempo.si.edu/',
      color: 'bg-blue-100 border-blue-200 text-blue-800'
    },
    {
      name: 'OpenAQ Network',
      description: 'Global network of ground-based air quality monitoring stations providing real-time measurements from government and research organizations.',
      icon: <Radio className="w-5 h-5" />,
      status: 'Active',
      lastUpdate: '5 minutes ago',
      coverage: 'Global',
      parameters: ['PM2.5', 'PM10', 'NO₂', 'O₃', 'SO₂', 'CO'],
      accuracy: '98%',
      website: 'https://openaq.org/',
      color: 'bg-green-100 border-green-200 text-green-800'
    },
    {
      name: 'Ground Stations',
      description: 'Local air quality monitoring stations operated by environmental agencies and research institutions.',
      icon: <MapPin className="w-5 h-5" />,
      status: 'Active',
      lastUpdate: '10 minutes ago',
      coverage: 'Regional',
      parameters: ['PM2.5', 'PM10', 'NO₂', 'O₃', 'SO₂', 'CO'],
      accuracy: '99%',
      website: '#',
      color: 'bg-orange-100 border-orange-200 text-orange-800'
    },
    {
      name: 'Weather APIs',
      description: 'Meteorological data including temperature, humidity, wind speed, and atmospheric pressure that influence air quality patterns.',
      icon: <Cloud className="w-5 h-5" />,
      status: 'Active',
      lastUpdate: '2 minutes ago',
      coverage: 'Global',
      parameters: ['Temperature', 'Humidity', 'Wind Speed', 'Pressure', 'UV Index'],
      accuracy: '97%',
      website: '#',
      color: 'bg-purple-100 border-purple-200 text-purple-800'
    }
  ];

  const integrationStats = {
    totalSources: 4,
    activeStations: 1247,
    dataPoints: '2.3M',
    uptime: '99.8%'
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Database className="w-5 h-5" />
          <span>Data Sources & Integration</span>
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Comprehensive air quality data from satellite observations, ground-based sensors, and weather monitoring networks
        </p>
      </CardHeader>
      <CardContent>
        {/* Integration Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <div className="text-2xl font-bold text-primary">{integrationStats.totalSources}</div>
            <p className="text-xs text-muted-foreground">Data Sources</p>
          </div>
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <div className="text-2xl font-bold text-primary">{integrationStats.activeStations}</div>
            <p className="text-xs text-muted-foreground">Active Stations</p>
          </div>
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <div className="text-2xl font-bold text-primary">{integrationStats.dataPoints}</div>
            <p className="text-xs text-muted-foreground">Data Points/Day</p>
          </div>
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <div className="text-2xl font-bold text-primary">{integrationStats.uptime}</div>
            <p className="text-xs text-muted-foreground">System Uptime</p>
          </div>
        </div>

        {/* Data Sources */}
        <div className="space-y-4">
          {dataSources.map((source, index) => (
            <div key={index} className={`p-4 rounded-lg border ${source.color}`}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-3">
                  {source.icon}
                  <div>
                    <h3 className="font-semibold text-sm">{source.name}</h3>
                    <div className="flex items-center space-x-2 mt-1">
                      <Badge variant="outline" className="text-xs flex items-center space-x-1">
                        <CheckCircle className="w-3 h-3" />
                        <span>{source.status}</span>
                      </Badge>
                      <Badge variant="outline" className="text-xs flex items-center space-x-1">
                        <Clock className="w-3 h-3" />
                        <span>{source.lastUpdate}</span>
                      </Badge>
                    </div>
                  </div>
                </div>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <ExternalLink className="w-3 h-3" />
                </Button>
              </div>
              
              <p className="text-sm text-muted-foreground mb-3">
                {source.description}
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                <div>
                  <span className="font-medium">Coverage:</span>
                  <span className="ml-1">{source.coverage}</span>
                </div>
                <div>
                  <span className="font-medium">Accuracy:</span>
                  <span className="ml-1">{source.accuracy}</span>
                </div>
                <div>
                  <span className="font-medium">Parameters:</span>
                  <span className="ml-1">{source.parameters.length}</span>
                </div>
              </div>
              
              <div className="mt-3">
                <p className="text-xs font-medium mb-1">Measured Parameters:</p>
                <div className="flex flex-wrap gap-1">
                  {source.parameters.map((param, paramIndex) => (
                    <Badge key={paramIndex} variant="secondary" className="text-xs">
                      {param}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Data Quality & Validation */}
        <div className="mt-6 p-4 bg-muted/50 rounded-lg">
          <h4 className="font-semibold text-sm mb-3">Data Quality & Validation</h4>
          <div className="space-y-2 text-sm text-muted-foreground">
            <div className="flex items-start space-x-2">
              <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
              <p>Real-time cross-validation between satellite and ground-based measurements</p>
            </div>
            <div className="flex items-start space-x-2">
              <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
              <p>Automated quality assurance checks and anomaly detection</p>
            </div>
            <div className="flex items-start space-x-2">
              <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
              <p>Data fusion algorithms for improved accuracy and coverage</p>
            </div>
            <div className="flex items-start space-x-2">
              <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
              <p>Transparent data provenance and uncertainty quantification</p>
            </div>
          </div>
        </div>

        {/* Citations */}
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="font-semibold text-sm text-blue-800 mb-3">Data Citations</h4>
          <div className="space-y-2 text-xs text-blue-700">
            <p>• NASA TEMPO Mission: Tropospheric Emissions: Monitoring of Pollution (2023)</p>
            <p>• OpenAQ: Open Air Quality Data Platform (2024)</p>
            <p>• EPA AirNow: Real-time Air Quality Index (2024)</p>
            <p>• NOAA Weather Service: Meteorological Data (2024)</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}