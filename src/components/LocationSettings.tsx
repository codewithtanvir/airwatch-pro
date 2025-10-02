import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MapPin, Settings, Bell, User, Save, Locate, Smartphone, Globe, Shield, CheckCircle, RefreshCw, AlertTriangle } from 'lucide-react';
import { useLocation } from '@/hooks/useLocation';
import { type LocationSearchResult } from '@/lib/apiClient';
import { useState, useRef } from 'react';

// Popular locations for quick selection
const POPULAR_LOCATIONS: LocationSearchResult[] = [
  { id: 'nyc', name: 'New York, NY, USA', coordinates: { lat: 40.7128, lng: -74.0060 }, country: 'United States' },
  { id: 'la', name: 'Los Angeles, CA, USA', coordinates: { lat: 34.0522, lng: -118.2437 }, country: 'United States' },
  { id: 'chicago', name: 'Chicago, IL, USA', coordinates: { lat: 41.8781, lng: -87.6298 }, country: 'United States' },
  { id: 'london', name: 'London, UK', coordinates: { lat: 51.5074, lng: -0.1278 }, country: 'United Kingdom' },
  { id: 'paris', name: 'Paris, France', coordinates: { lat: 48.8566, lng: 2.3522 }, country: 'France' },
  { id: 'tokyo', name: 'Tokyo, Japan', coordinates: { lat: 35.6762, lng: 139.6503 }, country: 'Japan' },
  { id: 'beijing', name: 'Beijing, China', coordinates: { lat: 39.9042, lng: 116.4074 }, country: 'China' },
  { id: 'mumbai', name: 'Mumbai, India', coordinates: { lat: 19.0760, lng: 72.8777 }, country: 'India' },
  { id: 'sydney', name: 'Sydney, Australia', coordinates: { lat: -33.8688, lng: 151.2093 }, country: 'Australia' },
  { id: 'saopaulo', name: 'São Paulo, Brazil', coordinates: { lat: -23.5505, lng: -46.6333 }, country: 'Brazil' },
];

export default function LocationSettings() {
  const { location, setLocation, detectCurrentLocation, searchLocations, clearError, isLoading, retryLocationDetection } = useLocation();
  const [locationInput, setLocationInput] = useState(location.locationName);
  const [healthSensitivity, setHealthSensitivity] = useState('moderate');
  const [alertTypes, setAlertTypes] = useState({
    health: true,
    pollution: true,
    weather: false,
    forecast: true
  });
  const [units, setUnits] = useState('metric');
  const [notifications, setNotifications] = useState(true);
  const [searchResults, setSearchResults] = useState<LocationSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSaveConfirmation, setShowSaveConfirmation] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleSave = () => {
    // Save settings logic would go here
    console.log('Settings saved:', {
      location: location.locationName,
      healthSensitivity,
      alertTypes,
      units,
      notifications
    });
    setShowSaveConfirmation(true);
    setTimeout(() => setShowSaveConfirmation(false), 2000);
  };

  const handleLocationSearch = async (query: string) => {
    setLocationInput(query);
    
    if (query.length < 3) {
      setSearchResults([]);
      return;
    }

    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Debounce search
    searchTimeoutRef.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const results = await searchLocations(query);
        setSearchResults(results);
      } catch (error) {
        console.error('Search error:', error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);
  };

  const handleLocationSelect = (result: LocationSearchResult) => {
    setLocation(result.coordinates, result.name);
    setLocationInput(result.name);
    setSearchResults([]);
  };

  const handleLocationDetect = async () => {
    try {
      await detectCurrentLocation();
      setLocationInput(location.locationName);
    } catch (error) {
      console.error('Location detection failed:', error);
      // Error is now handled by the context and displayed in the UI
    }
  };

  const toggleAlertType = (type: string) => {
    setAlertTypes(prev => ({
      ...prev,
      [type]: !prev[type as keyof typeof prev]
    }));
  };

  const alertTypeConfigs = [
    {
      key: 'health',
      title: 'Health Alerts',
      description: 'AQI threshold warnings',
      icon: <Shield className="w-4 h-4" />
    },
    {
      key: 'pollution',
      title: 'Pollution Spikes',
      description: 'Sudden air quality changes',
      icon: <Bell className="w-4 h-4" />
    },
    {
      key: 'weather',
      title: 'Weather Impacts',
      description: 'Weather-related air quality changes',
      icon: <Globe className="w-4 h-4" />
    },
    {
      key: 'forecast',
      title: 'Daily Forecasts',
      description: 'Next-day air quality predictions',
      icon: <MapPin className="w-4 h-4" />
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-4 sm:space-y-0">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold flex items-center space-x-2">
            <Settings className="w-6 h-6 sm:w-8 sm:h-8" />
            <span>Location & Preferences</span>
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Customize your air quality monitoring experience
          </p>
        </div>
      </div>

      {/* Error Alert */}
      {location.error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {location.error}
            <Button variant="link" size="sm" onClick={clearError} className="ml-2 p-0 h-auto">
              Dismiss
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <Card className="shadow-lg">
        <CardContent className="p-0">
          <Tabs defaultValue="location" className="w-full">
            <div className="p-6 pb-0">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="location" className="text-xs sm:text-sm">
                  <MapPin className="w-4 h-4 mr-1 sm:mr-2" />
                  Location
                </TabsTrigger>
                <TabsTrigger value="alerts" className="text-xs sm:text-sm">
                  <Bell className="w-4 h-4 mr-1 sm:mr-2" />
                  Alerts
                </TabsTrigger>
                <TabsTrigger value="preferences" className="text-xs sm:text-sm">
                  <User className="w-4 h-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Preferences</span>
                  <span className="sm:hidden">Prefs</span>
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="location" className="p-6 pt-4 space-y-6">
              {/* Location Settings */}
              <div className="space-y-4">
                <Label className="text-sm font-semibold flex items-center space-x-2">
                  <MapPin className="w-4 h-4" />
                  <span>Current Location</span>
                </Label>
                
                {/* Popular Locations Quick Select */}
                <div className="space-y-3">
                  <Label className="text-xs font-medium text-muted-foreground flex items-center space-x-2">
                    <Globe className="w-3 h-3" />
                    <span>Popular Locations</span>
                  </Label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {POPULAR_LOCATIONS.map((popularLocation, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        size="sm"
                        onClick={() => handleLocationSelect(popularLocation)}
                        className="justify-start text-left h-auto p-3 hover:bg-primary/5 hover:border-primary/20"
                      >
                        <div className="flex items-center space-x-2 w-full">
                          <MapPin className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium truncate">{popularLocation.name}</p>
                            <p className="text-xs text-muted-foreground truncate">{popularLocation.country}</p>
                          </div>
                        </div>
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Search Input */}
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-muted-foreground">Or search for a location</Label>
                  <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 relative">
                    <div className="flex-1 relative">
                      <Input
                        value={locationInput}
                        onChange={(e) => handleLocationSearch(e.target.value)}
                        placeholder="Enter city or address"
                        className="flex-1"
                      />
                      {/* Search Results Dropdown */}
                      {searchResults.length > 0 && (
                        <div className="absolute z-20 w-full mt-1 bg-background border border-border rounded-lg shadow-xl max-h-60 overflow-y-auto">
                          {searchResults.map((result, index) => (
                            <div
                              key={index}
                              className="px-4 py-3 hover:bg-muted/70 cursor-pointer border-b border-border last:border-b-0 transition-colors"
                              onClick={() => handleLocationSelect(result)}
                            >
                              <div className="flex items-center space-x-3">
                                <MapPin className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-sm truncate">{result.name}</p>
                                  <p className="text-xs text-muted-foreground truncate">{result.country}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {result.coordinates.lat.toFixed(3)}, {result.coordinates.lng.toFixed(3)}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      {isSearching && (
                        <div className="absolute z-20 w-full mt-1 bg-background border border-border rounded-lg shadow-xl p-4 text-center">
                          <div className="flex items-center justify-center space-x-2 text-muted-foreground">
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            <span className="text-sm">Searching...</span>
                          </div>
                        </div>
                      )}
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleLocationDetect}
                      disabled={location.isDetecting}
                      className="w-full sm:w-auto flex items-center space-x-2"
                    >
                      <Locate className={`w-4 h-4 ${location.isDetecting ? 'animate-spin' : ''}`} />
                      <span>{location.isDetecting ? 'Detecting...' : 'Detect Location'}</span>
                    </Button>
                  </div>
                </div>
                
                {/* Error Display */}
                {location.error && (
                  <Alert className="border-destructive/20 bg-destructive/10">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription className="text-destructive">
                      <strong>Location Error:</strong> {location.error}
                      <Button
                        variant="link"
                        size="sm"
                        onClick={retryLocationDetection}
                        disabled={location.isDetecting}
                        className="ml-2 h-auto p-0 text-destructive underline"
                      >
                        Try Again
                      </Button>
                    </AlertDescription>
                  </Alert>
                )}
                
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-xs text-muted-foreground">
                    <strong>Current coordinates:</strong> {location.coordinates.lat.toFixed(4)}°N, {Math.abs(location.coordinates.lng).toFixed(4)}°{location.coordinates.lng >= 0 ? 'E' : 'W'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    <strong>Last updated:</strong> {location.lastUpdated ? location.lastUpdated.toLocaleString() : 'Never'}
                  </p>
                </div>
              </div>

              {/* Health Sensitivity */}
              <div className="space-y-4">
                <Label className="text-sm font-semibold flex items-center space-x-2">
                  <User className="w-4 h-4" />
                  <span>Health Sensitivity Profile</span>
                </Label>
                <Select value={healthSensitivity} onValueChange={setHealthSensitivity}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">
                      <div className="flex flex-col items-start">
                        <span>Low - General population</span>
                        <span className="text-xs text-muted-foreground">No specific health concerns</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="moderate">
                      <div className="flex flex-col items-start">
                        <span>Moderate - Some sensitivity</span>
                        <span className="text-xs text-muted-foreground">Occasional respiratory issues</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="high">
                      <div className="flex flex-col items-start">
                        <span>High - Sensitive groups</span>
                        <span className="text-xs text-muted-foreground">Elderly, children, respiratory conditions</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  This affects health recommendations and alert thresholds
                </p>
              </div>
            </TabsContent>

            <TabsContent value="alerts" className="p-6 pt-4 space-y-6">
              {/* Alert Preferences */}
              <div className="space-y-4">
                <Label className="text-sm font-semibold flex items-center space-x-2">
                  <Bell className="w-4 h-4" />
                  <span>Alert Types</span>
                </Label>
                <div className="space-y-4">
                  {alertTypeConfigs.map((config) => (
                    <div key={config.key} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-start space-x-3">
                        {config.icon}
                        <div>
                          <p className="text-sm font-medium">{config.title}</p>
                          <p className="text-xs text-muted-foreground">{config.description}</p>
                        </div>
                      </div>
                      <Switch
                        checked={alertTypes[config.key as keyof typeof alertTypes]}
                        onCheckedChange={() => toggleAlertType(config.key)}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Push Notifications */}
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-start space-x-3">
                    <Smartphone className="w-4 h-4 mt-1" />
                    <div>
                      <Label className="text-sm font-semibold">Push Notifications</Label>
                      <p className="text-xs text-muted-foreground">Receive alerts on your device</p>
                    </div>
                  </div>
                  <Switch
                    checked={notifications}
                    onCheckedChange={setNotifications}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="preferences" className="p-6 pt-4 space-y-6">
              {/* Units */}
              <div className="space-y-4">
                <Label className="text-sm font-semibold">Measurement Units</Label>
                <Select value={units} onValueChange={setUnits}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="metric">
                      <div className="flex flex-col items-start">
                        <span>Metric</span>
                        <span className="text-xs text-muted-foreground">°C, km/h, μg/m³</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="imperial">
                      <div className="flex flex-col items-start">
                        <span>Imperial</span>
                        <span className="text-xs text-muted-foreground">°F, mph, μg/m³</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Active Settings Summary */}
              <div className="p-4 bg-muted/50 rounded-lg">
                <h4 className="font-semibold text-sm mb-3">Current Settings Summary</h4>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">{location.locationName}</Badge>
                  <Badge variant="outline">Sensitivity: {healthSensitivity}</Badge>
                  <Badge variant="outline">{units} units</Badge>
                  <Badge variant="outline">
                    {Object.values(alertTypes).filter(Boolean).length} alert types
                  </Badge>
                  {notifications && <Badge variant="outline">Notifications ON</Badge>}
                </div>
              </div>

              {/* Data Privacy */}
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="font-semibold text-sm text-blue-800 mb-2 flex items-center space-x-2">
                  <Shield className="w-4 h-4" />
                  <span>Privacy & Data</span>
                </h4>
                <p className="text-xs text-blue-700">
                  Your location data is stored locally and used only for air quality monitoring. 
                  We do not share your personal information with third parties.
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Button onClick={handleSave} className="flex-1 sm:flex-none" disabled={showSaveConfirmation}>
          {showSaveConfirmation ? (
            <>
              <CheckCircle className="w-4 h-4 mr-2" />
              Saved!
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Save Preferences
            </>
          )}
        </Button>
        <Button variant="outline" className="flex-1 sm:flex-none">
          Reset to Defaults
        </Button>
      </div>
    </div>
  );
}