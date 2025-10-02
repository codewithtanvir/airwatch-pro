import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Bell, AlertTriangle, Info, AlertCircle, X, Settings, Filter, BellRing, Loader2 } from 'lucide-react';
import { apiClient } from '@/lib/apiClient';
import { useState, useEffect } from 'react';
import { Alert as AlertType } from '@/types/airQuality';
import { useLocation } from '@/hooks/useLocation';

export default function AlertsPanel() {
  const [alerts, setAlerts] = useState<AlertType[]>([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { location } = useLocation();

  // Load alerts for current location
  useEffect(() => {
    const loadAlerts = async () => {
      try {
        setLoading(true);
        setError(null);
        
        if (location?.coordinates) {
          const data = await apiClient.getAlerts(
            location.coordinates.lat,
            location.coordinates.lng
          );
          setAlerts(data);
        }
      } catch (err) {
        console.error('Failed to load alerts:', err);
        setError('Failed to load alerts. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    loadAlerts();
  }, [location]);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 border-red-200 text-red-800';
      case 'high':
        return 'bg-orange-100 border-orange-200 text-orange-800';
      case 'medium':
        return 'bg-yellow-100 border-yellow-200 text-yellow-800';
      case 'low':
        return 'bg-blue-100 border-blue-200 text-blue-800';
      default:
        return 'bg-gray-100 border-gray-200 text-gray-800';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
      case 'high':
        return <AlertTriangle className="w-4 h-4" />;
      case 'medium':
        return <AlertCircle className="w-4 h-4" />;
      case 'low':
        return <Info className="w-4 h-4" />;
      default:
        return <Info className="w-4 h-4" />;
    }
  };

  const dismissAlert = (alertId: string) => {
    setAlerts(alerts.filter(alert => alert.id !== alertId));
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (diffHours > 0) {
      return `${diffHours}h ago`;
    } else if (diffMinutes > 0) {
      return `${diffMinutes}m ago`;
    } else {
      return 'Just now';
    }
  };

  const filteredAlerts = filter === 'all' ? alerts : alerts.filter(alert => alert.severity === filter);
  const alertCounts = {
    all: alerts.length,
    critical: alerts.filter(a => a.severity === 'critical').length,
    high: alerts.filter(a => a.severity === 'high').length,
    medium: alerts.filter(a => a.severity === 'medium').length,
    low: alerts.filter(a => a.severity === 'low').length,
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-4 sm:space-y-0">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold flex items-center space-x-2">
              <Bell className="w-6 h-6 sm:w-8 sm:h-8" />
              <span>Active Alerts</span>
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Real-time notifications about air quality conditions
            </p>
          </div>
        </div>
        <Card className="shadow-lg">
          <CardContent className="p-8">
            <div className="flex items-center justify-center space-x-2">
              <Loader2 className="w-6 h-6 animate-spin" />
              <span>Loading alerts...</span>
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
              <Bell className="w-6 h-6 sm:w-8 sm:h-8" />
              <span>Active Alerts</span>
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Real-time notifications about air quality conditions
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
            <Bell className="w-6 h-6 sm:w-8 sm:h-8" />
            <span>Active Alerts</span>
            {alerts.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {alerts.length}
              </Badge>
            )}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Real-time notifications about air quality conditions
          </p>
        </div>
        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <Button variant="outline" size="sm" className="flex-1 sm:flex-none">
            <Filter className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Filter</span>
          </Button>
          <Button variant="outline" size="sm" className="flex-1 sm:flex-none">
            <Settings className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Settings</span>
          </Button>
        </div>
      </div>

      <Card className="shadow-lg">
        <CardHeader className="pb-4">
          <Tabs value={filter} onValueChange={setFilter} className="w-full">
            <div className="overflow-x-auto">
              <TabsList className="grid w-full grid-cols-5 mb-4">
                <TabsTrigger value="all" className="text-xs sm:text-sm">
                  All ({alertCounts.all})
                </TabsTrigger>
                <TabsTrigger value="critical" className="text-xs sm:text-sm">
                  <span className="hidden sm:inline">Critical</span>
                  <span className="sm:hidden">Crit</span>
                  {alertCounts.critical > 0 && (
                    <Badge variant="destructive" className="ml-1 text-xs">
                      {alertCounts.critical}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="high" className="text-xs sm:text-sm">
                  High
                  {alertCounts.high > 0 && (
                    <Badge variant="secondary" className="ml-1 text-xs">
                      {alertCounts.high}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="medium" className="text-xs sm:text-sm">
                  <span className="hidden sm:inline">Medium</span>
                  <span className="sm:hidden">Med</span>
                  {alertCounts.medium > 0 && (
                    <Badge variant="secondary" className="ml-1 text-xs">
                      {alertCounts.medium}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="low" className="text-xs sm:text-sm">
                  Low
                  {alertCounts.low > 0 && (
                    <Badge variant="secondary" className="ml-1 text-xs">
                      {alertCounts.low}
                    </Badge>
                  )}
                </TabsTrigger>
              </TabsList>
            </div>
          </Tabs>
        </CardHeader>
        
        <CardContent>
          {filteredAlerts.length === 0 ? (
            <div className="text-center py-12">
              <BellRing className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-medium text-muted-foreground">
                {filter === 'all' ? 'No active alerts' : `No ${filter} severity alerts`}
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                You'll be notified when air quality conditions change
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredAlerts.map((alert) => (
                <Alert key={alert.id} className={`${getSeverityColor(alert.severity)} hover:shadow-md transition-shadow duration-200`}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1 min-w-0">
                      {getSeverityIcon(alert.severity)}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-2 mb-2">
                          <h4 className="font-semibold text-sm">{alert.title}</h4>
                          <div className="flex items-center space-x-2">
                            <Badge variant="outline" className="text-xs capitalize">
                              {alert.type}
                            </Badge>
                            <Badge variant="outline" className="text-xs capitalize">
                              {alert.severity}
                            </Badge>
                          </div>
                        </div>
                        <AlertDescription className="text-sm mb-3">
                          {alert.message}
                        </AlertDescription>
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-1 sm:space-y-0 text-xs text-muted-foreground">
                          <span className="truncate">{alert.location}</span>
                          <span className="flex-shrink-0">{formatTime(alert.timestamp)}</span>
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => dismissAlert(alert.id)}
                      className="ml-2 h-6 w-6 p-0 flex-shrink-0"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                </Alert>
              ))}
            </div>
          )}

          {/* Alert Settings */}
          <div className="mt-8 p-4 bg-muted/50 rounded-lg">
            <h4 className="font-semibold text-sm mb-3 flex items-center space-x-2">
              <Settings className="w-4 h-4" />
              <span>Alert Preferences</span>
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <Badge variant="outline" className="justify-center p-2 hover:bg-primary hover:text-primary-foreground transition-colors cursor-pointer">
                Health Alerts
              </Badge>
              <Badge variant="outline" className="justify-center p-2 hover:bg-primary hover:text-primary-foreground transition-colors cursor-pointer">
                Pollution Spikes
              </Badge>
              <Badge variant="outline" className="justify-center p-2 hover:bg-primary hover:text-primary-foreground transition-colors cursor-pointer">
                Weather Changes
              </Badge>
              <Badge variant="outline" className="justify-center p-2 hover:bg-primary hover:text-primary-foreground transition-colors cursor-pointer">
                Forecasts
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}