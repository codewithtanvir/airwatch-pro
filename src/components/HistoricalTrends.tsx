import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TrendingUp, Calendar, BarChart3, Download, Filter, RefreshCw, Loader2 } from 'lucide-react';
import { apiClient, getAQIColor } from '@/lib/apiClient';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, BarChart, Bar } from 'recharts';
import { useState, useEffect } from 'react';
import { HistoricalData } from '@/types/airQuality';
import { useLocation } from '@/hooks/useLocation';

interface TooltipProps {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    color: string;
  }>;
  label?: string;
}

export default function HistoricalTrends() {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [historicalData, setHistoricalData] = useState<HistoricalData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { location } = useLocation();

  // Load historical data
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log('HistoricalTrends: Location data:', location);
        
        if (location?.coordinates) {
          console.log('HistoricalTrends: Fetching data for coordinates:', location.coordinates);
          const data = await apiClient.getHistoricalData(
            location.coordinates.lat,
            location.coordinates.lng,
            30 // 30 days
          );
          console.log('HistoricalTrends: Received data:', data);
          setHistoricalData(data);
        } else {
          console.log('HistoricalTrends: No location coordinates available');
          setError('Location not available. Please select a location.');
        }
      } catch (err) {
        console.error('Failed to load historical data:', err);
        setError('Failed to load historical data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [location]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      if (location?.coordinates) {
        console.log('HistoricalTrends: Refreshing data for:', location.coordinates);
        const data = await apiClient.getHistoricalData(
          location.coordinates.lat,
          location.coordinates.lng,
          30
        );
        console.log('HistoricalTrends: Refresh received data:', data);
        setHistoricalData(data);
      }
    } catch (err) {
      console.error('Failed to refresh data:', err);
    } finally {
      setIsRefreshing(false);
    }
  };
  
  const [timeRange, setTimeRange] = useState('14d');

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const CustomTooltip = ({ active, payload, label }: TooltipProps) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border rounded-lg p-3 shadow-lg">
          <p className="font-semibold">{formatDate(label || '')}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }}>
              {entry.name}: {entry.value}
              {entry.name === 'AQI' ? '' : entry.name.includes('PM') ? ' μg/m³' : entry.name === 'Temperature' ? '°C' : ' ppm'}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const getAverageAQI = () => {
    if (historicalData.length === 0) return 0;
    const total = historicalData.reduce((sum, data) => sum + data.aqi, 0);
    return Math.round(total / historicalData.length);
  };

  const getTrend = () => {
    if (historicalData.length === 0) return { direction: 'stable', text: 'No data' };
    const recent = historicalData.slice(-3);
    const older = historicalData.slice(0, 3);
    const recentAvg = recent.reduce((sum, data) => sum + data.aqi, 0) / recent.length;
    const olderAvg = older.reduce((sum, data) => sum + data.aqi, 0) / older.length;
    
    if (recentAvg > olderAvg + 5) return { direction: 'up', text: 'Worsening' };
    if (recentAvg < olderAvg - 5) return { direction: 'down', text: 'Improving' };
    return { direction: 'stable', text: 'Stable' };
  };

  const avgAQI = getAverageAQI();
  const trend = getTrend();

  const timeRanges = [
    { value: '7d', label: '7 Days' },
    { value: '14d', label: '14 Days' },
    { value: '30d', label: '30 Days' },
    { value: '90d', label: '90 Days' },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-4 sm:space-y-0">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold flex items-center space-x-2">
              <TrendingUp className="w-6 h-6 sm:w-8 sm:h-8" />
              <span>Historical Trends</span>
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Air quality patterns and trends over time
            </p>
          </div>
        </div>
        <Card className="shadow-lg">
          <CardContent className="p-8">
            <div className="flex items-center justify-center space-x-2">
              <Loader2 className="w-6 h-6 animate-spin" />
              <span>Loading historical data...</span>
            </div>
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
              <TrendingUp className="w-6 h-6 sm:w-8 sm:h-8" />
              <span>Historical Trends</span>
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Air quality patterns and trends over time
            </p>
          </div>
        </div>
        <Card className="shadow-lg">
          <CardContent className="p-8">
            <div className="text-center">
              <p className="text-red-600 mb-4">{error}</p>
              <Button onClick={() => window.location.reload()}>
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-4 sm:space-y-0">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold flex items-center space-x-2">
            <TrendingUp className="w-6 h-6 sm:w-8 sm:h-8" />
            <span>Historical Trends</span>
          </h2>
          <div className="flex flex-wrap items-center gap-4 text-sm mt-2">
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4" />
              <span>Last {timeRange === '7d' ? '7' : timeRange === '14d' ? '14' : timeRange === '30d' ? '30' : '90'} days</span>
            </div>
            <div className="flex items-center space-x-2">
              <span>Average AQI:</span>
              <Badge className={getAQIColor(avgAQI)}>{avgAQI}</Badge>
            </div>
            <div className="flex items-center space-x-2">
              <span>Trend:</span>
              <Badge variant={trend.direction === 'up' ? 'destructive' : trend.direction === 'down' ? 'default' : 'secondary'}>
                {trend.text}
              </Badge>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <div className="flex items-center space-x-1 overflow-x-auto">
            {timeRanges.map((range) => (
              <Button
                key={range.value}
                variant={timeRange === range.value ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTimeRange(range.value)}
                className="text-xs whitespace-nowrap"
              >
                {range.label}
              </Button>
            ))}
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      <Card className="shadow-lg">
        <CardContent className="p-0">
          <Tabs defaultValue="aqi" className="w-full">
            <div className="p-6 pb-0">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="aqi" className="text-xs sm:text-sm">
                  <BarChart3 className="w-4 h-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Air Quality Index</span>
                  <span className="sm:hidden">AQI</span>
                </TabsTrigger>
                <TabsTrigger value="pollutants" className="text-xs sm:text-sm">
                  <TrendingUp className="w-4 h-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Pollutants</span>
                  <span className="sm:hidden">Poll.</span>
                </TabsTrigger>
                <TabsTrigger value="weather" className="text-xs sm:text-sm">
                  <Calendar className="w-4 h-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Weather Impact</span>
                  <span className="sm:hidden">Weather</span>
                </TabsTrigger>
              </TabsList>
            </div>
            
            <TabsContent value="aqi" className="space-y-6 p-6 pt-4">
              <div className="h-64 sm:h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={historicalData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={formatDate}
                      fontSize={12}
                      angle={-45}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis fontSize={12} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area 
                      type="monotone" 
                      dataKey="aqi" 
                      stroke="#8884d8" 
                      fill="#8884d8" 
                      fillOpacity={0.3}
                      name="AQI"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <p className="text-muted-foreground mb-1">Best Day</p>
                  <p className="text-xl font-semibold text-green-600">
                    {historicalData.length > 0 ? Math.min(...historicalData.map(d => d.aqi)) : 'N/A'}
                  </p>
                </div>
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <p className="text-muted-foreground mb-1">Worst Day</p>
                  <p className="text-xl font-semibold text-red-600">
                    {historicalData.length > 0 ? Math.max(...historicalData.map(d => d.aqi)) : 'N/A'}
                  </p>
                </div>
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <p className="text-muted-foreground mb-1">Good Days</p>
                  <p className="text-xl font-semibold text-blue-600">
                    {historicalData.filter(d => d.aqi <= 50).length}
                  </p>
                </div>
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <p className="text-muted-foreground mb-1">Unhealthy Days</p>
                  <p className="text-xl font-semibold text-orange-600">
                    {historicalData.filter(d => d.aqi > 100).length}
                  </p>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="pollutants" className="space-y-6 p-6 pt-4">
              <div className="h-64 sm:h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={historicalData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={formatDate}
                      fontSize={12}
                      angle={-45}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis fontSize={12} />
                    <Tooltip content={<CustomTooltip />} />
                    <Line 
                      type="monotone" 
                      dataKey="pm25" 
                      stroke="#ef4444" 
                      strokeWidth={2}
                      name="PM2.5"
                      dot={{ r: 3 }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="o3" 
                      stroke="#3b82f6" 
                      strokeWidth={2}
                      name="Ozone"
                      dot={{ r: 3 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              
              <div className="flex flex-col sm:flex-row items-center justify-center space-y-2 sm:space-y-0 sm:space-x-6 text-sm">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <span>PM2.5 (μg/m³)</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span>Ozone (ppm)</span>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="weather" className="space-y-6 p-6 pt-4">
              <div className="h-64 sm:h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={historicalData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={formatDate}
                      fontSize={12}
                      angle={-45}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis fontSize={12} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar 
                      dataKey="temperature" 
                      fill="#f59e0b" 
                      name="Temperature"
                      radius={[2, 2, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              
              <div className="p-4 bg-muted/50 rounded-lg">
                <h4 className="font-semibold text-sm mb-3">Weather Impact Analysis</h4>
                <p className="text-sm text-muted-foreground">
                  Higher temperatures often correlate with increased ozone formation and elevated AQI levels. 
                  Wind patterns and humidity also significantly affect pollutant dispersion.
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Export Options */}
      <Card className="bg-gradient-to-r from-blue-50 to-green-50">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-4 sm:space-y-0">
            <div>
              <h4 className="font-semibold text-sm mb-1">Export Data</h4>
              <p className="text-xs text-muted-foreground">Download historical data for analysis</p>
            </div>
            <div className="flex items-center space-x-2 w-full sm:w-auto">
              <Button variant="outline" size="sm" className="flex-1 sm:flex-none">
                <Download className="w-4 h-4 mr-2" />
                CSV
              </Button>
              <Button variant="outline" size="sm" className="flex-1 sm:flex-none">
                <Download className="w-4 h-4 mr-2" />
                JSON
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}