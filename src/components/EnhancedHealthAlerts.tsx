import React, { useState, useEffect } from 'react';
import { AlertTriangle, Heart, Shield, Clock, MapPin, Bell, Activity } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { Alert, AlertDescription } from './ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Switch } from './ui/switch';

interface HealthCondition {
  value: string;
  label: string;
  icon: React.ReactNode;
}

interface HealthProfile {
  conditions: string[];
  sensitivity_level: string;
  age_group: string;
  activity_level: string;
  outdoor_exposure: string;
}

interface HealthAlert {
  alert_id: string;
  alert_type: string;
  risk_level: string;
  title: string;
  message: string;
  recommendations: string[];
  affected_pollutants: string[];
  valid_until: string;
  urgency_score: number;
  location: { latitude: number; longitude: number };
  health_conditions: string[];
}

interface HealthAlertsResponse {
  success: boolean;
  alerts: HealthAlert[];
  alert_count: number;
  highest_risk_level: string;
  error?: string;
  timestamp: string;
  metadata: Record<string, unknown>;
}

const HEALTH_CONDITIONS: HealthCondition[] = [
  { value: 'asthma', label: 'Asthma', icon: <Heart className="w-4 h-4" /> },
  { value: 'copd', label: 'COPD', icon: <Heart className="w-4 h-4" /> },
  { value: 'heart_disease', label: 'Heart Disease', icon: <Heart className="w-4 h-4" /> },
  { value: 'diabetes', label: 'Diabetes', icon: <Shield className="w-4 h-4" /> },
  { value: 'pregnancy', label: 'Pregnancy', icon: <Heart className="w-4 h-4" /> },
  { value: 'elderly', label: 'Elderly (65+)', icon: <Shield className="w-4 h-4" /> },
  { value: 'children', label: 'Children', icon: <Shield className="w-4 h-4" /> },
  { value: 'healthy', label: 'No Conditions', icon: <Shield className="w-4 h-4" /> }
];

const RISK_LEVEL_CONFIG = {
  low: { color: 'bg-green-500', textColor: 'text-green-600', label: 'Low Risk', bgColor: 'bg-green-50', borderColor: 'border-green-200' },
  moderate: { color: 'bg-yellow-500', textColor: 'text-yellow-600', label: 'Moderate Risk', bgColor: 'bg-yellow-50', borderColor: 'border-yellow-200' },
  high: { color: 'bg-orange-500', textColor: 'text-orange-600', label: 'High Risk', bgColor: 'bg-orange-50', borderColor: 'border-orange-200' },
  very_high: { color: 'bg-red-500', textColor: 'text-red-600', label: 'Very High Risk', bgColor: 'bg-red-50', borderColor: 'border-red-200' },
  extreme: { color: 'bg-purple-500', textColor: 'text-purple-600', label: 'Extreme Risk', bgColor: 'bg-purple-50', borderColor: 'border-purple-200' }
};

interface EnhancedHealthAlertsProps {
  latitude?: number;
  longitude?: number;
}

export default function EnhancedHealthAlerts({ latitude, longitude }: EnhancedHealthAlertsProps) {
  const [healthProfile, setHealthProfile] = useState<HealthProfile>({
    conditions: ['healthy'],
    sensitivity_level: 'normal',
    age_group: 'adult',
    activity_level: 'moderate',
    outdoor_exposure: 'moderate'
  });
  
  const [alerts, setAlerts] = useState<HealthAlert[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [highestRisk, setHighestRisk] = useState<string>('low');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const generateAlerts = React.useCallback(async () => {
    if (!latitude || !longitude) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/v1/health-alerts/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          latitude,
          longitude,
          health_profile: healthProfile,
          hours_ahead: 24
        }),
      });

      const data: HealthAlertsResponse = await response.json();

      if (data.success) {
        setAlerts(data.alerts || []);
        setHighestRisk(data.highest_risk_level || 'low');
        setLastUpdated(new Date());
      } else {
        setError(data.error || 'Failed to generate health alerts');
      }
    } catch (err) {
      setError('Network error generating health alerts');
      console.error('Health alerts error:', err);
    } finally {
      setLoading(false);
    }
  }, [latitude, longitude, healthProfile]);

  useEffect(() => {
    generateAlerts();
  }, [generateAlerts]);

  // Auto-refresh every 30 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      if (latitude && longitude && notificationsEnabled) {
        generateAlerts();
      }
    }, 30 * 60 * 1000);

    return () => clearInterval(interval);
  }, [generateAlerts, latitude, longitude, notificationsEnabled]);

  const handleConditionToggle = (condition: string) => {
    setHealthProfile(prev => {
      let newConditions = [...prev.conditions];
      
      if (condition === 'healthy') {
        newConditions = ['healthy'];
      } else {
        newConditions = newConditions.filter(c => c !== 'healthy');
        
        if (newConditions.includes(condition)) {
          newConditions = newConditions.filter(c => c !== condition);
        } else {
          newConditions.push(condition);
        }
        
        if (newConditions.length === 0) {
          newConditions = ['healthy'];
        }
      }
      
      return { ...prev, conditions: newConditions };
    });
  };

  const formatTimeUntil = (validUntil: string) => {
    const until = new Date(validUntil);
    const now = new Date();
    const diffHours = Math.round((until.getTime() - now.getTime()) / (1000 * 60 * 60));
    
    if (diffHours < 1) return 'Expires soon';
    if (diffHours === 1) return '1 hour';
    return `${diffHours} hours`;
  };

  const getRiskBadge = (riskLevel: string) => {
    const config = RISK_LEVEL_CONFIG[riskLevel as keyof typeof RISK_LEVEL_CONFIG] || RISK_LEVEL_CONFIG.low;
    return (
      <Badge variant="secondary" className={`${config.color} text-white`}>
        {config.label}
      </Badge>
    );
  };

  const getAlertTypeIcon = (alertType: string) => {
    switch (alertType) {
      case 'immediate': return <AlertTriangle className="w-5 h-5 text-red-500" />;
      case 'forecast': return <Clock className="w-5 h-5 text-orange-500" />;
      case 'emergency': return <Bell className="w-5 h-5 text-purple-500" />;
      default: return <Activity className="w-5 h-5 text-blue-500" />;
    }
  };

  // Count alerts by type
  const alertCounts = {
    immediate: alerts.filter(a => a.alert_type === 'immediate').length,
    forecast: alerts.filter(a => a.alert_type === 'forecast').length,
    emergency: alerts.filter(a => a.alert_type === 'emergency').length,
    total: alerts.length
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Bell className="w-6 h-6 text-blue-600" />
          <h2 className="text-2xl font-bold">Enhanced Health Alerts</h2>
          {alerts.length > 0 && getRiskBadge(highestRisk)}
        </div>
        <div className="flex items-center space-x-2">
          <Switch
            checked={notificationsEnabled}
            onCheckedChange={setNotificationsEnabled}
          />
          <span className="text-sm text-gray-600">Auto-refresh</span>
        </div>
      </div>

      {/* Last Updated */}
      {lastUpdated && (
        <div className="text-sm text-gray-500">
          Last updated: {lastUpdated.toLocaleTimeString()}
        </div>
      )}

      <Tabs defaultValue="alerts" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="alerts">Health Alerts</TabsTrigger>
          <TabsTrigger value="profile">Health Profile</TabsTrigger>
        </TabsList>

        {/* Alerts Tab */}
        <TabsContent value="alerts" className="space-y-6">
          {/* Alert Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                  <div>
                    <div className="text-2xl font-bold">{alertCounts.immediate}</div>
                    <div className="text-sm text-gray-500">Immediate</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center space-x-2">
                  <Clock className="w-5 h-5 text-orange-500" />
                  <div>
                    <div className="text-2xl font-bold">{alertCounts.forecast}</div>
                    <div className="text-sm text-gray-500">Forecast</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center space-x-2">
                  <Bell className="w-5 h-5 text-purple-500" />
                  <div>
                    <div className="text-2xl font-bold">{alertCounts.emergency}</div>
                    <div className="text-sm text-gray-500">Emergency</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center space-x-2">
                  <Activity className="w-5 h-5 text-blue-500" />
                  <div>
                    <div className="text-2xl font-bold">{alertCounts.total}</div>
                    <div className="text-sm text-gray-500">Total Active</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Error Display */}
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3">Generating personalized health alerts...</span>
            </div>
          )}

          {/* Alerts Display */}
          {alerts.length > 0 && !loading && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">
                  Active Health Alerts for Your Profile
                </h3>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={generateAlerts}
                  disabled={loading || !latitude || !longitude}
                >
                  Refresh
                </Button>
              </div>

              {alerts.map((alert, index) => {
                const config = RISK_LEVEL_CONFIG[alert.risk_level as keyof typeof RISK_LEVEL_CONFIG] || RISK_LEVEL_CONFIG.low;
                
                return (
                  <Card key={alert.alert_id} className={`border-l-4 ${config.borderColor} ${config.bgColor}`}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            {getAlertTypeIcon(alert.alert_type)}
                            <CardTitle className="text-lg">{alert.title}</CardTitle>
                            {getRiskBadge(alert.risk_level)}
                          </div>
                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <div className="flex items-center space-x-1">
                              <Clock className="w-4 h-4" />
                              <span>{formatTimeUntil(alert.valid_until)}</span>
                            </div>
                            <Badge variant="outline" className="text-xs">
                              {alert.alert_type.replace('_', ' ').toUpperCase()}
                            </Badge>
                          </div>
                        </div>
                        <div className="text-sm font-medium text-blue-600">
                          Urgency: {(alert.urgency_score ?? 0).toFixed(1)}/10
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="space-y-4">
                      <p className={config.textColor}>{alert.message}</p>

                      {alert.affected_pollutants.length > 0 && (
                        <div>
                          <h5 className="font-medium mb-2">Affected Pollutants:</h5>
                          <div className="flex flex-wrap gap-1">
                            {alert.affected_pollutants.map((pollutant) => (
                              <Badge key={pollutant} variant="secondary" className="text-xs">
                                {pollutant}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {alert.recommendations.length > 0 && (
                        <div>
                          <h5 className="font-medium mb-2">Health Recommendations:</h5>
                          <ul className="space-y-1">
                            {alert.recommendations.map((recommendation, idx) => (
                              <li key={idx} className="flex items-start space-x-2 text-sm">
                                <span className="text-blue-600 mt-1">•</span>
                                <span>{recommendation}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {alert.health_conditions.length > 0 && (
                        <div>
                          <h5 className="font-medium mb-2">Relevant Health Conditions:</h5>
                          <div className="flex flex-wrap gap-1">
                            {alert.health_conditions.map((condition) => {
                              const conditionInfo = HEALTH_CONDITIONS.find(c => c.value === condition);
                              return (
                                <Badge key={condition} variant="outline" className="text-xs">
                                  {conditionInfo?.label || condition}
                                </Badge>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {/* No Alerts */}
          {alerts.length === 0 && !loading && !error && latitude && longitude && (
            <Card>
              <CardContent className="flex items-center justify-center py-8">
                <div className="text-center space-y-2">
                  <Shield className="w-12 h-12 text-green-500 mx-auto" />
                  <h3 className="text-lg font-medium">No Health Alerts</h3>
                  <p className="text-gray-500">
                    Current air quality conditions pose low risk for your health profile
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Location Required */}
          {!latitude || !longitude ? (
            <Card>
              <CardContent className="flex items-center justify-center py-8">
                <div className="text-center space-y-2">
                  <MapPin className="w-12 h-12 text-gray-400 mx-auto" />
                  <h3 className="text-lg font-medium">Location Required</h3>
                  <p className="text-gray-500">
                    Please set your location to receive personalized health alerts
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : null}
        </TabsContent>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Health Profile Configuration</CardTitle>
              <CardDescription>
                Customize alerts based on your health conditions and lifestyle
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Health Conditions */}
              <div>
                <h4 className="font-medium mb-3">Health Conditions</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {HEALTH_CONDITIONS.map((condition) => (
                    <Button
                      key={condition.value}
                      variant={healthProfile.conditions.includes(condition.value) ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleConditionToggle(condition.value)}
                      className="justify-start"
                    >
                      {condition.icon}
                      <span className="ml-2">{condition.label}</span>
                    </Button>
                  ))}
                </div>
              </div>

              {/* Sensitivity Level */}
              <div>
                <h4 className="font-medium mb-3">Sensitivity Level</h4>
                <div className="flex space-x-2">
                  {['low', 'normal', 'high'].map((level) => (
                    <Button
                      key={level}
                      variant={healthProfile.sensitivity_level === level ? "default" : "outline"}
                      size="sm"
                      onClick={() => setHealthProfile(prev => ({ ...prev, sensitivity_level: level }))}
                    >
                      {level.charAt(0).toUpperCase() + level.slice(1)}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Activity Level */}
              <div>
                <h4 className="font-medium mb-3">Activity Level</h4>
                <div className="flex space-x-2">
                  {['sedentary', 'moderate', 'active'].map((level) => (
                    <Button
                      key={level}
                      variant={healthProfile.activity_level === level ? "default" : "outline"}
                      size="sm"
                      onClick={() => setHealthProfile(prev => ({ ...prev, activity_level: level }))}
                    >
                      {level.charAt(0).toUpperCase() + level.slice(1)}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Outdoor Exposure */}
              <div>
                <h4 className="font-medium mb-3">Outdoor Exposure</h4>
                <div className="flex space-x-2">
                  {['minimal', 'moderate', 'high'].map((level) => (
                    <Button
                      key={level}
                      variant={healthProfile.outdoor_exposure === level ? "default" : "outline"}
                      size="sm"
                      onClick={() => setHealthProfile(prev => ({ ...prev, outdoor_exposure: level }))}
                    >
                      {level.charAt(0).toUpperCase() + level.slice(1)}
                    </Button>
                  ))}
                </div>
              </div>

              <Separator />

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => {
                  setHealthProfile({
                    conditions: ['healthy'],
                    sensitivity_level: 'normal',
                    age_group: 'adult',
                    activity_level: 'moderate',
                    outdoor_exposure: 'moderate'
                  });
                }}>
                  Reset to Default
                </Button>
                <Button onClick={generateAlerts} disabled={loading || !latitude || !longitude}>
                  {loading ? 'Generating...' : 'Update Alerts'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}