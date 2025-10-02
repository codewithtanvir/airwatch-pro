import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Send, Phone, Mail, Users, AlertTriangle, Shield, Clock, 
  CheckCircle, XCircle, MessageSquare, Bell, Zap, Target,
  MapPin, Heart, Building2, School, Hospital, UserCheck
} from 'lucide-react';

interface AlertRecipient {
  id: string;
  name: string;
  type: 'individual' | 'group' | 'facility' | 'agency';
  contactMethods: {
    email?: string;
    sms?: string;
    phone?: string;
    app?: boolean;
  };
  priority: 'low' | 'medium' | 'high' | 'critical';
  tags: string[];
  location?: {
    lat: number;
    lng: number;
    radius?: number;
  };
  active: boolean;
  lastContacted?: string;
}

interface AlertTemplate {
  id: string;
  name: string;
  category: 'health_emergency' | 'air_quality' | 'school_closure' | 'facility_alert' | 'evacuation';
  priority: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  channels: Array<'sms' | 'email' | 'phone' | 'app' | 'social'>;
  autoTrigger?: {
    condition: string;
    threshold: number;
    enabled: boolean;
  };
}

interface AlertHistory {
  id: string;
  timestamp: string;
  template: string;
  recipients: number;
  channels: string[];
  status: 'sent' | 'pending' | 'failed' | 'cancelled';
  deliveryStats: {
    sms: { sent: number; delivered: number; failed: number };
    email: { sent: number; delivered: number; failed: number };
    phone: { sent: number; connected: number; failed: number };
    app: { sent: number; read: number; failed: number };
  };
  cost: number;
  trigger: 'manual' | 'automatic' | 'scheduled';
}

interface AutoTriggerData {
  templateId: string;
  shouldTrigger: boolean;
  recipientTags: string[];
  condition: string;
  currentValue: number;
  threshold: number;
}

const AlertDistributionSystem: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [recipients, setRecipients] = useState<AlertRecipient[]>([]);
  const [templates, setTemplates] = useState<AlertTemplate[]>([]);
  const [alertHistory, setAlertHistory] = useState<AlertHistory[]>([]);
  const [selectedRecipients, setSelectedRecipients] = useState<string[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [customMessage, setCustomMessage] = useState('');
  const [currentAQI, setCurrentAQI] = useState(142);
  const [emergencyLevel, setEmergencyLevel] = useState<'normal' | 'elevated' | 'high' | 'critical'>('high');
  const [loading, setLoading] = useState(false);

  const loadAlertData = React.useCallback(async () => {
    try {
      // Load recipients, templates, and history from API
      const recipientsResponse = await fetch('/api/alerts/recipients');
      const templatesResponse = await fetch('/api/alerts/templates');
      const historyResponse = await fetch('/api/alerts/history?limit=50');

      if (recipientsResponse.ok) {
        const recipientsData = await recipientsResponse.json();
        setRecipients(recipientsData);
      } else {
        setRecipients(generateMockRecipients());
      }

      if (templatesResponse.ok) {
        const templatesData = await templatesResponse.json();
        setTemplates(templatesData);
      } else {
        setTemplates(generateMockTemplates());
      }

      if (historyResponse.ok) {
        const historyData = await historyResponse.json();
        setAlertHistory(historyData);
      } else {
        setAlertHistory(generateMockHistory());
      }
    } catch (error) {
      console.error('Error loading alert data:', error);
      // Use mock data for demonstration
      setRecipients(generateMockRecipients());
      setTemplates(generateMockTemplates());
      setAlertHistory(generateMockHistory());
    }
  }, []);

  const sendAlert = React.useCallback(async (templateId: string, recipientIds: string[], triggerType: 'manual' | 'automatic' | 'scheduled' = 'manual') => {
    setLoading(true);
    try {
      const template = templates.find(t => t.id === templateId);
      const targetRecipients = recipients.filter(r => recipientIds.includes(r.id));

      if (!template || targetRecipients.length === 0) {
        throw new Error('Invalid template or recipients');
      }

      const alertData = {
        templateId,
        recipientIds,
        customMessage: customMessage || template.message,
        channels: template.channels,
        priority: template.priority,
        trigger: triggerType
      };

      const response = await fetch('/api/alerts/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(alertData)
      });

      if (response.ok) {
        const result = await response.json();
        
        // Add to history
        const newAlert: AlertHistory = {
          id: result.alertId,
          timestamp: new Date().toISOString(),
          template: template.name,
          recipients: targetRecipients.length,
          channels: template.channels,
          status: 'sent',
          deliveryStats: result.deliveryStats,
          cost: result.estimatedCost,
          trigger: triggerType
        };

        setAlertHistory(prev => [newAlert, ...prev]);
        
        // Clear selections
        setSelectedRecipients([]);
        setSelectedTemplate('');
        setCustomMessage('');

        alert(`Alert sent successfully to ${targetRecipients.length} recipients!`);
      }
    } catch (error) {
      console.error('Error sending alert:', error);
      alert('Failed to send alert. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [templates, recipients, customMessage]);

  const handleAutoAlert = React.useCallback(async (trigger: AutoTriggerData) => {
    const template = templates.find(t => t.id === trigger.templateId);
    if (!template) return;

    const targetRecipients = recipients.filter(r => 
      trigger.recipientTags.some((tag: string) => r.tags.includes(tag))
    );

    await sendAlert(template.id, targetRecipients.map(r => r.id), 'automatic');
  }, [templates, recipients, sendAlert]);

  const checkAutoTriggers = React.useCallback(async () => {
    try {
      const response = await fetch('/api/alerts/auto-trigger-check');
      if (response.ok) {
        const triggers: AutoTriggerData[] = await response.json();
        triggers.forEach((trigger) => {
          if (trigger.shouldTrigger) {
            handleAutoAlert(trigger);
          }
        });
      }
    } catch (error) {
      console.error('Error checking auto triggers:', error);
    }
  }, [handleAutoAlert]);

  useEffect(() => {
    loadAlertData();
    const interval = setInterval(checkAutoTriggers, 10000); // Check every 10 seconds
    return () => clearInterval(interval);
  }, [loadAlertData, checkAutoTriggers]);

  const generateMockRecipients = (): AlertRecipient[] => {
    return [
      {
        id: 'hosp-001',
        name: 'LA County General Hospital',
        type: 'facility',
        contactMethods: { email: 'emergency@lacgh.org', phone: '+1-213-555-0123', app: true },
        priority: 'critical',
        tags: ['hospital', 'emergency-care', 'respiratory'],
        location: { lat: 34.0522, lng: -118.2437 },
        active: true,
        lastContacted: '2024-09-30T14:30:00Z'
      },
      {
        id: 'school-001',
        name: 'Roosevelt Elementary School',
        type: 'facility',
        contactMethods: { email: 'admin@roosevelt.edu', sms: '+1-213-555-0456', app: true },
        priority: 'high',
        tags: ['school', 'children', 'outdoor-activities'],
        location: { lat: 34.0789, lng: -118.2456 },
        active: true,
        lastContacted: '2024-09-30T13:15:00Z'
      },
      {
        id: 'agency-001',
        name: 'LA County Public Health Department',
        type: 'agency',
        contactMethods: { email: 'alerts@ph.lacounty.gov', phone: '+1-213-555-0789', app: true },
        priority: 'critical',
        tags: ['health-agency', 'emergency-response', 'coordination'],
        active: true
      },
      {
        id: 'group-001',
        name: 'Vulnerable Population Alert Group',
        type: 'group',
        contactMethods: { sms: 'broadcast', email: 'broadcast', app: true },
        priority: 'high',
        tags: ['vulnerable', 'asthma', 'elderly', 'children'],
        active: true
      },
      {
        id: 'senior-001',
        name: 'Golden Years Senior Center',
        type: 'facility',
        contactMethods: { email: 'care@goldenyears.org', phone: '+1-213-555-0321' },
        priority: 'high',
        tags: ['senior-care', 'elderly', 'assisted-living'],
        location: { lat: 34.0722, lng: -118.2637 },
        active: true
      }
    ];
  };

  const generateMockTemplates = (): AlertTemplate[] => {
    return [
      {
        id: 'temp-001',
        name: 'Critical Air Quality Alert',
        category: 'health_emergency',
        priority: 'critical',
        title: 'CRITICAL AIR QUALITY ALERT',
        message: 'Air quality has reached hazardous levels (AQI {{AQI}}). Vulnerable populations should stay indoors immediately. Emergency protocols are in effect.',
        channels: ['sms', 'email', 'phone', 'app'],
        autoTrigger: { condition: 'AQI > 200', threshold: 200, enabled: true }
      },
      {
        id: 'temp-002',
        name: 'School Activity Suspension',
        category: 'school_closure',
        priority: 'high',
        title: 'Outdoor Activities Suspended',
        message: 'Due to unhealthy air quality (AQI {{AQI}}), all outdoor activities are suspended. Students should remain indoors during recess and PE classes.',
        channels: ['email', 'app', 'sms'],
        autoTrigger: { condition: 'AQI > 150', threshold: 150, enabled: true }
      },
      {
        id: 'temp-003',
        name: 'Hospital Emergency Preparedness',
        category: 'facility_alert',
        priority: 'critical',
        title: 'Respiratory Emergency Surge Alert',
        message: 'Prepare for increased respiratory emergencies. Current AQI: {{AQI}}. Activate surge protocols and ensure adequate staffing for respiratory care.',
        channels: ['phone', 'email', 'app'],
        autoTrigger: { condition: 'AQI > 150', threshold: 150, enabled: true }
      },
      {
        id: 'temp-004',
        name: 'Vulnerable Population Advisory',
        category: 'health_emergency',
        priority: 'high',
        title: 'Health Advisory for Sensitive Groups',
        message: 'Air quality is unhealthy for sensitive groups (AQI {{AQI}}). If you have asthma, heart disease, or are over 65, avoid outdoor activities and keep medications handy.',
        channels: ['sms', 'email', 'app'],
        autoTrigger: { condition: 'AQI > 100', threshold: 100, enabled: true }
      },
      {
        id: 'temp-005',
        name: 'Emergency Evacuation Notice',
        category: 'evacuation',
        priority: 'critical',
        title: 'EMERGENCY EVACUATION NOTICE',
        message: 'Due to extreme air quality conditions, evacuation is recommended for the following areas: {{AREAS}}. Proceed to designated shelters immediately.',
        channels: ['phone', 'sms', 'email', 'app', 'social']
      }
    ];
  };

  const generateMockHistory = (): AlertHistory[] => {
    return [
      {
        id: 'alert-001',
        timestamp: '2024-09-30T15:30:00Z',
        template: 'Critical Air Quality Alert',
        recipients: 2847,
        channels: ['sms', 'email', 'app'],
        status: 'sent',
        deliveryStats: {
          sms: { sent: 2847, delivered: 2798, failed: 49 },
          email: { sent: 2847, delivered: 2801, failed: 46 },
          phone: { sent: 156, connected: 142, failed: 14 },
          app: { sent: 2847, read: 2234, failed: 12 }
        },
        cost: 347.50,
        trigger: 'automatic'
      },
      {
        id: 'alert-002',
        timestamp: '2024-09-30T14:15:00Z',
        template: 'School Activity Suspension',
        recipients: 1205,
        channels: ['email', 'app'],
        status: 'sent',
        deliveryStats: {
          sms: { sent: 0, delivered: 0, failed: 0 },
          email: { sent: 1205, delivered: 1189, failed: 16 },
          phone: { sent: 0, connected: 0, failed: 0 },
          app: { sent: 1205, read: 967, failed: 8 }
        },
        cost: 24.10,
        trigger: 'automatic'
      },
      {
        id: 'alert-003',
        timestamp: '2024-09-30T13:45:00Z',
        template: 'Hospital Emergency Preparedness',
        recipients: 23,
        channels: ['phone', 'email'],
        status: 'sent',
        deliveryStats: {
          sms: { sent: 0, delivered: 0, failed: 0 },
          email: { sent: 23, delivered: 23, failed: 0 },
          phone: { sent: 23, connected: 21, failed: 2 },
          app: { sent: 23, read: 19, failed: 0 }
        },
        cost: 15.80,
        trigger: 'manual'
      }
    ];
  };

  const getRecipientIcon = (type: string) => {
    switch (type) {
      case 'facility':
        return <Building2 className="h-4 w-4" />;
      case 'agency':
        return <Shield className="h-4 w-4" />;
      case 'group':
        return <Users className="h-4 w-4" />;
      default:
        return <Users className="h-4 w-4" />;
    }
  };

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'sms':
        return <MessageSquare className="h-4 w-4" />;
      case 'email':
        return <Mail className="h-4 w-4" />;
      case 'phone':
        return <Phone className="h-4 w-4" />;
      case 'app':
        return <Bell className="h-4 w-4" />;
      default:
        return <Send className="h-4 w-4" />;
    }
  };

  const totalRecipients = recipients.length;
  const activeRecipients = recipients.filter(r => r.active).length;
  const criticalRecipients = recipients.filter(r => r.priority === 'critical').length;
  const recentAlerts = alertHistory.slice(0, 3);
  const totalSentToday = alertHistory
    .filter(a => new Date(a.timestamp).toDateString() === new Date().toDateString())
    .reduce((sum, a) => sum + a.recipients, 0);

  return (
    <div className="space-y-6 p-6">
      {/* Emergency Status Banner */}
      {emergencyLevel === 'critical' && (
        <Alert className="border-red-500 bg-red-50">
          <AlertTriangle className="h-5 w-5 text-red-600" />
          <AlertTitle className="text-red-800">Emergency Alert System Active</AlertTitle>
          <AlertDescription className="text-red-700">
            Critical air quality conditions detected. Auto-alerts are being sent to all vulnerable populations.
            <Button size="sm" className="ml-4" variant="destructive">
              <Zap className="h-4 w-4 mr-2" />
              Send Emergency Broadcast
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Recipients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalRecipients}</div>
            <p className="text-xs text-muted-foreground">
              {activeRecipients} active, {criticalRecipients} critical priority
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alerts Sent Today</CardTitle>
            <Send className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSentToday.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {alertHistory.filter(a => new Date(a.timestamp).toDateString() === new Date().toDateString()).length} campaigns
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Delivery Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">98.3%</div>
            <p className="text-xs text-muted-foreground">
              Last 24 hours average
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Auto-Triggers Active</CardTitle>
            <Zap className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{templates.filter(t => t.autoTrigger?.enabled).length}</div>
            <p className="text-xs text-muted-foreground">
              Monitoring AQI conditions
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="send">Send Alert</TabsTrigger>
          <TabsTrigger value="recipients">Recipients</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Alerts */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Alerts</CardTitle>
                <CardDescription>Latest alert campaigns and their status</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentAlerts.map((alert) => (
                    <div key={alert.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="flex gap-1">
                          {alert.channels.map((channel) => (
                            <div key={channel} className="p-1 bg-gray-100 rounded">
                              {getChannelIcon(channel)}
                            </div>
                          ))}
                        </div>
                        <div>
                          <p className="font-medium">{alert.template}</p>
                          <p className="text-sm text-muted-foreground">
                            {alert.recipients} recipients • {new Date(alert.timestamp).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant={alert.status === 'sent' ? 'default' : alert.status === 'failed' ? 'destructive' : 'secondary'}>
                          {alert.status}
                        </Badge>
                        <p className="text-sm text-muted-foreground">${alert.cost.toFixed(2)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Auto-Trigger Status */}
            <Card>
              <CardHeader>
                <CardTitle>Auto-Trigger Status</CardTitle>
                <CardDescription>Automated alerts based on air quality conditions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {templates.filter(t => t.autoTrigger?.enabled).map((template) => (
                    <div key={template.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium">{template.name}</p>
                        <p className="text-sm text-muted-foreground">
                          Trigger: {template.autoTrigger?.condition}
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge variant={currentAQI >= (template.autoTrigger?.threshold || 0) ? 'destructive' : 'secondary'}>
                          {currentAQI >= (template.autoTrigger?.threshold || 0) ? 'ACTIVE' : 'MONITORING'}
                        </Badge>
                        <p className="text-xs text-muted-foreground">
                          Current: {currentAQI} / Threshold: {template.autoTrigger?.threshold}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Delivery Statistics */}
          <Card>
            <CardHeader>
              <CardTitle>Delivery Statistics (Last 24 Hours)</CardTitle>
              <CardDescription>Performance metrics across all communication channels</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[
                  { channel: 'SMS', sent: 5692, delivered: 5589, failed: 103, rate: 98.2 },
                  { channel: 'Email', sent: 5692, delivered: 5613, failed: 79, rate: 98.6 },
                  { channel: 'Phone', sent: 202, delivered: 184, failed: 18, rate: 91.1 },
                  { channel: 'App Push', sent: 5692, delivered: 4512, failed: 32, rate: 94.3 },
                ].map((stat) => (
                  <div key={stat.channel} className="p-4 border rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      {getChannelIcon(stat.channel.toLowerCase())}
                      <h4 className="font-medium">{stat.channel}</h4>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Delivery Rate</span>
                        <span className="font-medium">{stat.rate}%</span>
                      </div>
                      <Progress value={stat.rate} className="h-2" />
                      <div className="text-xs text-muted-foreground">
                        <p>Sent: {stat.sent.toLocaleString()}</p>
                        <p>Delivered: {stat.delivered.toLocaleString()}</p>
                        <p>Failed: {stat.failed}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Send Alert Tab */}
        <TabsContent value="send" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Compose Alert</CardTitle>
                <CardDescription>Create and send emergency alerts to selected recipients</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Alert Template</label>
                  <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a template" />
                    </SelectTrigger>
                    <SelectContent>
                      {templates.map((template) => (
                        <SelectItem key={template.id} value={template.id}>
                          <div className="flex items-center gap-2">
                            <Badge variant={template.priority === 'critical' ? 'destructive' : 'default'} className="text-xs">
                              {template.priority}
                            </Badge>
                            {template.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedTemplate && (
                  <div>
                    <label className="text-sm font-medium mb-2 block">Message Preview</label>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="font-medium">{templates.find(t => t.id === selectedTemplate)?.title}</p>
                      <p className="text-sm mt-1">
                        {templates.find(t => t.id === selectedTemplate)?.message.replace('{{AQI}}', currentAQI.toString())}
                      </p>
                    </div>
                  </div>
                )}

                <div>
                  <label className="text-sm font-medium mb-2 block">Custom Message (Optional)</label>
                  <Textarea
                    placeholder="Add custom message or modifications..."
                    value={customMessage}
                    onChange={(e) => setCustomMessage(e.target.value)}
                    className="min-h-[80px]"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Recipients</label>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {recipients.filter(r => r.active).map((recipient) => (
                      <div key={recipient.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={recipient.id}
                          checked={selectedRecipients.includes(recipient.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedRecipients([...selectedRecipients, recipient.id]);
                            } else {
                              setSelectedRecipients(selectedRecipients.filter(id => id !== recipient.id));
                            }
                          }}
                        />
                        <label
                          htmlFor={recipient.id}
                          className="flex items-center gap-2 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          {getRecipientIcon(recipient.type)}
                          {recipient.name}
                          <Badge variant="outline" className="text-xs">
                            {recipient.priority}
                          </Badge>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={() => sendAlert(selectedTemplate, selectedRecipients)}
                    disabled={!selectedTemplate || selectedRecipients.length === 0 || loading}
                    className="flex-1"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Send Alert ({selectedRecipients.length})
                      </>
                    )}
                  </Button>
                  <Button variant="outline" onClick={() => {
                    setSelectedRecipients(recipients.filter(r => r.priority === 'critical').map(r => r.id));
                  }}>
                    Select Critical
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Pre-configured emergency responses</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { 
                    name: 'Emergency Broadcast', 
                    description: 'Send critical alert to all recipients',
                    color: 'destructive',
                    icon: <AlertTriangle className="h-4 w-4" />,
                    recipients: recipients.length
                  },
                  { 
                    name: 'Hospital Alert', 
                    description: 'Notify all medical facilities',
                    color: 'default',
                    icon: <Hospital className="h-4 w-4" />,
                    recipients: recipients.filter(r => r.tags.includes('hospital')).length
                  },
                  { 
                    name: 'School Notification', 
                    description: 'Alert all educational facilities',
                    color: 'default',
                    icon: <School className="h-4 w-4" />,
                    recipients: recipients.filter(r => r.tags.includes('school')).length
                  },
                  { 
                    name: 'Vulnerable Population Alert', 
                    description: 'Target at-risk individuals',
                    color: 'default',
                    icon: <Heart className="h-4 w-4" />,
                    recipients: recipients.filter(r => r.tags.includes('vulnerable')).length
                  }
                ].map((action, index) => (
                  <Button
                    key={index}
                    variant={action.color === 'destructive' ? 'destructive' : 'default'}
                    className="w-full justify-start h-auto p-4"
                    onClick={() => {
                      const relevantTemplate = templates.find(t => 
                        action.name.toLowerCase().includes('emergency') ? t.priority === 'critical' :
                        action.name.toLowerCase().includes('hospital') ? t.category === 'facility_alert' :
                        action.name.toLowerCase().includes('school') ? t.category === 'school_closure' :
                        t.category === 'health_emergency'
                      );
                      if (relevantTemplate) {
                        setSelectedTemplate(relevantTemplate.id);
                        setSelectedRecipients(
                          recipients
                            .filter(r => 
                              action.name.toLowerCase().includes('emergency') ? true :
                              action.name.toLowerCase().includes('hospital') ? r.tags.includes('hospital') :
                              action.name.toLowerCase().includes('school') ? r.tags.includes('school') :
                              r.tags.includes('vulnerable')
                            )
                            .map(r => r.id)
                        );
                        setActiveTab('send');
                      }
                    }}
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-3">
                        {action.icon}
                        <div className="text-left">
                          <p className="font-medium">{action.name}</p>
                          <p className="text-xs opacity-80">{action.description}</p>
                        </div>
                      </div>
                      <Badge variant="outline">{action.recipients}</Badge>
                    </div>
                  </Button>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Recipients Tab */}
        <TabsContent value="recipients" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recipient Management</CardTitle>
              <CardDescription>Manage alert recipients and their contact preferences</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recipients.map((recipient) => (
                  <div key={recipient.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-gray-100 rounded-lg">
                        {getRecipientIcon(recipient.type)}
                      </div>
                      <div>
                        <p className="font-medium">{recipient.name}</p>
                        <p className="text-sm text-muted-foreground capitalize">{recipient.type}</p>
                        <div className="flex gap-2 mt-1">
                          {recipient.tags.map((tag) => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant={recipient.priority === 'critical' ? 'destructive' : recipient.priority === 'high' ? 'default' : 'secondary'}>
                        {recipient.priority}
                      </Badge>
                      <div className="flex gap-1 mt-2">
                        {recipient.contactMethods.email && <Mail className="h-3 w-3 text-muted-foreground" />}
                        {recipient.contactMethods.sms && <MessageSquare className="h-3 w-3 text-muted-foreground" />}
                        {recipient.contactMethods.phone && <Phone className="h-3 w-3 text-muted-foreground" />}
                        {recipient.contactMethods.app && <Bell className="h-3 w-3 text-muted-foreground" />}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {recipient.lastContacted ? 
                          `Last: ${new Date(recipient.lastContacted).toLocaleTimeString()}` : 
                          'Never contacted'
                        }
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Templates Tab */}
        <TabsContent value="templates" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Alert Templates</CardTitle>
              <CardDescription>Pre-configured alert messages and auto-triggers</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {templates.map((template) => (
                  <div key={template.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <h4 className="font-medium">{template.name}</h4>
                        <Badge variant={template.priority === 'critical' ? 'destructive' : 'default'}>
                          {template.priority}
                        </Badge>
                        <Badge variant="outline">{template.category.replace('_', ' ')}</Badge>
                      </div>
                      {template.autoTrigger?.enabled && (
                        <Badge variant="secondary" className="flex items-center gap-1">
                          <Zap className="h-3 w-3" />
                          Auto-trigger
                        </Badge>
                      )}
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg mb-3">
                      <p className="font-medium text-sm">{template.title}</p>
                      <p className="text-sm mt-1">{template.message}</p>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex gap-2">
                        {template.channels.map((channel) => (
                          <div key={channel} className="flex items-center gap-1 text-xs">
                            {getChannelIcon(channel)}
                            {channel}
                          </div>
                        ))}
                      </div>
                      {template.autoTrigger?.enabled && (
                        <p className="text-xs text-muted-foreground">
                          Trigger: {template.autoTrigger.condition}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Alert History</CardTitle>
              <CardDescription>Complete log of sent alerts and their performance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {alertHistory.map((alert) => (
                  <div key={alert.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <h4 className="font-medium">{alert.template}</h4>
                        <Badge variant={alert.status === 'sent' ? 'default' : alert.status === 'failed' ? 'destructive' : 'secondary'}>
                          {alert.status}
                        </Badge>
                        <Badge variant="outline">{alert.trigger}</Badge>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">${alert.cost.toFixed(2)}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(alert.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Recipients</p>
                        <p className="font-medium">{alert.recipients.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">SMS Delivery</p>
                        <p className="font-medium">
                          {alert.deliveryStats.sms.sent > 0 ? 
                            `${((alert.deliveryStats.sms.delivered / alert.deliveryStats.sms.sent) * 100).toFixed(1)}%` : 
                            'N/A'
                          }
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Email Delivery</p>
                        <p className="font-medium">
                          {alert.deliveryStats.email.sent > 0 ? 
                            `${((alert.deliveryStats.email.delivered / alert.deliveryStats.email.sent) * 100).toFixed(1)}%` : 
                            'N/A'
                          }
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">App Read Rate</p>
                        <p className="font-medium">
                          {alert.deliveryStats.app.sent > 0 ? 
                            `${((alert.deliveryStats.app.read / alert.deliveryStats.app.sent) * 100).toFixed(1)}%` : 
                            'N/A'
                          }
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AlertDistributionSystem;