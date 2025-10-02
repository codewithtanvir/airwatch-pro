/**
 * Personalized Alerts Component
 * Provides customized air quality alerts for sensitive groups
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { useState, useEffect } from 'react';
import { 
  Bell, 
  Heart, 
  Wind, 
  Baby, 
  User, 
  MapPin, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  Settings,
  Activity,
  Eye,
  Calendar,
  Zap
} from 'lucide-react';

interface HealthProfile {
  id: string;
  name: string;
  icon: React.ReactNode;
  sensitivities: string[];
  thresholds: {
    no2: number;
    pm25: number;
    ozone: number;
  };
  recommendations: string[];
}

interface AlertRule {
  id: string;
  parameter: string;
  threshold: number;
  enabled: boolean;
  severity: 'low' | 'medium' | 'high';
}

interface PersonalizedAlert {
  id: string;
  timestamp: Date;
  location: string;
  severity: 'low' | 'medium' | 'high';
  parameter: string;
  value: number;
  threshold: number;
  message: string;
  recommendations: string[];
  duration: string;
  uncertainty: number;
}

const healthProfiles: HealthProfile[] = [
  {
    id: 'asthma',
    name: 'Asthma/Respiratory Conditions',
    icon: <Wind className="w-5 h-5" />,
    sensitivities: ['NO2', 'PM2.5', 'Ozone'],
    thresholds: { no2: 40, pm25: 25, ozone: 100 },
    recommendations: [
      'Limit outdoor activities during high pollution',
      'Keep rescue inhaler accessible',
      'Consider air purifier indoors',
      'Monitor symptoms closely'
    ]
  },
  {
    id: 'heart',
    name: 'Heart Disease',
    icon: <Heart className="w-5 h-5" />,
    sensitivities: ['PM2.5', 'NO2'],
    thresholds: { no2: 35, pm25: 20, ozone: 120 },
    recommendations: [
      'Avoid strenuous outdoor exercise',
      'Take medications as prescribed', 
      'Monitor blood pressure',
      'Stay indoors during alerts'
    ]
  },
  {
    id: 'children',
    name: 'Children & Infants',
    icon: <Baby className="w-5 h-5" />,
    sensitivities: ['All pollutants'],
    thresholds: { no2: 30, pm25: 15, ozone: 80 },
    recommendations: [
      'Limit playground time during pollution events',
      'Use stroller covers in polluted areas',
      'Ensure good indoor air quality',
      'Watch for respiratory symptoms'
    ]
  },
  {
    id: 'elderly',
    name: 'Adults 65+',
    icon: <User className="w-5 h-5" />,
    sensitivities: ['PM2.5', 'Ozone'],
    thresholds: { no2: 45, pm25: 30, ozone: 110 },
    recommendations: [
      'Reduce outdoor activities',
      'Stay hydrated',
      'Keep windows closed',
      'Consult healthcare provider if needed'
    ]
  }
];

const generateMockAlerts = (): PersonalizedAlert[] => {
  const locations = ['Downtown LA', 'Santa Monica', 'Pasadena', 'Long Beach'];
  const parameters = ['NO2', 'PM2.5', 'Ozone'];
  const severities: ('low' | 'medium' | 'high')[] = ['low', 'medium', 'high'];
  
  return Array.from({ length: 8 }, (_, i) => {
    const parameter = parameters[i % parameters.length];
    const severity = severities[i % severities.length];
    const location = locations[i % locations.length];
    const threshold = 50 + Math.random() * 100;
    const value = threshold + (Math.random() - 0.3) * threshold * 0.5;
    
    return {
      id: `alert-${i}`,
      timestamp: new Date(Date.now() - Math.random() * 3600000),
      location,
      severity,
      parameter,
      value,
      threshold,
      message: `${parameter} levels ${value > threshold ? 'exceed' : 'approaching'} safe limits for sensitive groups`,
      recommendations: healthProfiles[i % healthProfiles.length].recommendations.slice(0, 2),
      duration: `${Math.floor(Math.random() * 6) + 1}-${Math.floor(Math.random() * 4) + 2} hours`,
      uncertainty: Math.random() * 0.2 + 0.1
    };
  });
};

export default function PersonalizedAlerts() {
  const [selectedProfile, setSelectedProfile] = useState<string>('asthma');
  const [alertRules, setAlertRules] = useState<AlertRule[]>([
    { id: 'no2', parameter: 'NO2', threshold: 40, enabled: true, severity: 'medium' },
    { id: 'pm25', parameter: 'PM2.5', threshold: 25, enabled: true, severity: 'high' },
    { id: 'ozone', parameter: 'Ozone', threshold: 100, enabled: true, severity: 'medium' }
  ]);
  const [notifications, setNotifications] = useState({
    push: true,
    email: false,
    sms: false
  });
  const [alertHistory, setAlertHistory] = useState<PersonalizedAlert[]>([]);
  
  useEffect(() => {
    setAlertHistory(generateMockAlerts());
  }, []);
  
  const currentProfile = healthProfiles.find(p => p.id === selectedProfile);
  const activeAlerts = alertHistory.filter(alert => 
    alert.value > alert.threshold && 
    Date.now() - alert.timestamp.getTime() < 6 * 3600000 // Active for 6 hours
  );
  
  const getSeverityColor = (severity: 'low' | 'medium' | 'high') => {
    switch (severity) {
      case 'low': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'medium': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
    }
  };
  
  const getSeverityIcon = (severity: 'low' | 'medium' | 'high') => {
    switch (severity) {
      case 'low': return <AlertTriangle className="w-4 h-4" />;
      case 'medium': return <AlertTriangle className="w-4 h-4" />;
      case 'high': return <XCircle className="w-4 h-4" />;
    }
  };
  
  const formatTimestamp = (timestamp: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - timestamp.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return timestamp.toLocaleDateString();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-4 sm:space-y-0">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold flex items-center space-x-2">
            <Bell className="w-6 h-6 sm:w-8 sm:h-8" />
            <span>Personalized Alerts</span>
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Customized air quality alerts for sensitive groups
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant={activeAlerts.length > 0 ? "destructive" : "outline"}>
            {activeAlerts.length} Active Alert{activeAlerts.length !== 1 ? 's' : ''}
          </Badge>
        </div>
      </div>
      
      {/* Active Alerts Banner */}
      {activeAlerts.length > 0 && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <strong>{activeAlerts.length} active alert{activeAlerts.length !== 1 ? 's' : ''}</strong> for your area. 
            Consider limiting outdoor activities and following your health recommendations.
          </AlertDescription>
        </Alert>
      )}
      
      <Tabs defaultValue="alerts" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="alerts">Current Alerts</TabsTrigger>
          <TabsTrigger value="profile">Health Profile</TabsTrigger>
          <TabsTrigger value="settings">Alert Settings</TabsTrigger>
        </TabsList>
        
        {/* Current Alerts Tab */}
        <TabsContent value="alerts" className="space-y-6">
          {/* Alert Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center space-x-2">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-red-600">
                      {activeAlerts.filter(a => a.severity === 'high').length}
                    </div>
                    <div className="text-sm text-muted-foreground">High Priority</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center space-x-2">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <Eye className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-orange-600">
                      {activeAlerts.filter(a => a.severity === 'medium').length}
                    </div>
                    <div className="text-sm text-muted-foreground">Medium Priority</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center space-x-2">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Activity className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-blue-600">
                      {alertHistory.length}
                    </div>
                    <div className="text-sm text-muted-foreground">Total Today</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Alert List */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Alerts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {alertHistory.slice(0, 6).map((alert) => (
                  <div 
                    key={alert.id}
                    className={`p-4 rounded-lg border ${getSeverityColor(alert.severity)}`}
                  >
                    <div className="flex items-start justify-between space-x-4">
                      <div className="flex items-start space-x-3">
                        {getSeverityIcon(alert.severity)}
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="font-semibold">{alert.parameter} Alert</span>
                            <Badge variant="outline" className="text-xs">
                              {alert.severity.toUpperCase()}
                            </Badge>
                          </div>
                          <p className="text-sm mb-2">{alert.message}</p>
                          <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                            <span className="flex items-center space-x-1">
                              <MapPin className="w-3 h-3" />
                              <span>{alert.location}</span>
                            </span>
                            <span className="flex items-center space-x-1">
                              <Clock className="w-3 h-3" />
                              <span>{formatTimestamp(alert.timestamp)}</span>
                            </span>
                            <span className="flex items-center space-x-1">
                              <Calendar className="w-3 h-3" />
                              <span>Duration: {alert.duration}</span>
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold">
                          {alert.value.toFixed(1)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Threshold: {alert.threshold}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          ±{(alert.uncertainty * 100).toFixed(1)}%
                        </div>
                      </div>
                    </div>
                    
                    {alert.recommendations.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-current border-opacity-20">
                        <div className="text-xs font-medium mb-1">Recommendations:</div>
                        <ul className="text-xs space-y-1">
                          {alert.recommendations.map((rec, idx) => (
                            <li key={idx} className="flex items-start space-x-1">
                              <span>•</span>
                              <span>{rec}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Health Profile Tab */}
        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Select Your Health Profile</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {healthProfiles.map((profile) => (
                  <div
                    key={profile.id}
                    onClick={() => setSelectedProfile(profile.id)}
                    className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                      selectedProfile === profile.id 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center space-x-3 mb-3">
                      {profile.icon}
                      <span className="font-semibold">{profile.name}</span>
                      {selectedProfile === profile.id && (
                        <CheckCircle className="w-5 h-5 text-blue-500 ml-auto" />
                      )}
                    </div>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="font-medium">Sensitive to: </span>
                        <span className="text-muted-foreground">
                          {profile.sensitivities.join(', ')}
                        </span>
                      </div>
                      <div className="space-y-1">
                        <span className="font-medium">Alert Thresholds:</span>
                        <div className="text-xs space-y-1 text-muted-foreground">
                          <div>NO₂: {profile.thresholds.no2} µg/m³</div>
                          <div>PM2.5: {profile.thresholds.pm25} µg/m³</div>
                          <div>Ozone: {profile.thresholds.ozone} µg/m³</div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          
          {currentProfile && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  {currentProfile.icon}
                  <span>Recommendations for {currentProfile.name}</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {currentProfile.recommendations.map((rec, idx) => (
                    <li key={idx} className="flex items-start space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{rec}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        {/* Alert Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Settings className="w-5 h-5" />
                <span>Alert Thresholds</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {alertRules.map((rule) => (
                  <div key={rule.id} className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <span className="font-medium">{rule.parameter}</span>
                        <Badge variant={rule.enabled ? "default" : "secondary"}>
                          {rule.enabled ? 'Enabled' : 'Disabled'}
                        </Badge>
                      </div>
                      <Switch
                        checked={rule.enabled}
                        onCheckedChange={(checked) => {
                          setAlertRules(rules => 
                            rules.map(r => r.id === rule.id ? { ...r, enabled: checked } : r)
                          );
                        }}
                      />
                    </div>
                    
                    {rule.enabled && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span>Alert Threshold</span>
                          <span>{rule.threshold} µg/m³</span>
                        </div>
                        <Slider
                          value={[rule.threshold]}
                          onValueChange={(value) => {
                            setAlertRules(rules => 
                              rules.map(r => r.id === rule.id ? { ...r, threshold: value[0] } : r)
                            );
                          }}
                          max={200}
                          min={10}
                          step={5}
                          className="w-full"
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Zap className="w-5 h-5" />
                <span>Notification Preferences</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Push Notifications</div>
                    <div className="text-sm text-muted-foreground">
                      Receive alerts on your device
                    </div>
                  </div>
                  <Switch
                    checked={notifications.push}
                    onCheckedChange={(checked) => 
                      setNotifications(prev => ({ ...prev, push: checked }))
                    }
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Email Alerts</div>
                    <div className="text-sm text-muted-foreground">
                      Get detailed reports via email
                    </div>
                  </div>
                  <Switch
                    checked={notifications.email}
                    onCheckedChange={(checked) => 
                      setNotifications(prev => ({ ...prev, email: checked }))
                    }
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">SMS Notifications</div>
                    <div className="text-sm text-muted-foreground">
                      Critical alerts via text message
                    </div>
                  </div>
                  <Switch
                    checked={notifications.sms}
                    onCheckedChange={(checked) => 
                      setNotifications(prev => ({ ...prev, sms: checked }))
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}