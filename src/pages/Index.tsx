import Dashboard from '@/components/Dashboard';
import AirQualityMap from '@/components/AirQualityMap';
import AlertsPanel from '@/components/AlertsPanel';
import HistoricalTrends from '@/components/HistoricalTrends';
import LocationSettings from '@/components/LocationSettings';
import DataSources from '@/components/DataSources';
import EnhancedDashboard from '@/components/EnhancedDashboard';
import ForecastMaps from '@/components/ForecastMaps';
import PersonalizedAlerts from '@/components/PersonalizedAlerts';
import AlertDistributionSystem from '@/components/AlertDistributionSystem';
import TEMPOSatelliteData from '@/components/TEMPOSatelliteData';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MapPin, TrendingUp, Settings, Bell, Activity, Database, Wind, Waves, Satellite, AlertTriangle } from 'lucide-react';
import { useLocation } from '@/hooks/useLocation';
import { useState } from 'react';

export default function Index() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const { location } = useLocation();
  
  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-green-50">
      <div className="max-w-7xl mx-auto">
        {/* AirWatch Header */}
        <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-white/20 shadow-sm">
          <div className="px-4 sm:px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-green-500 rounded-xl flex items-center justify-center shadow-lg">
                    <Wind className="w-6 h-6 text-white" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full animate-pulse"></div>
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
                    AirWatch Pro
                  </h1>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Air Quality Monitoring
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                {/* Location Name Badge */}
                <div className="hidden sm:flex items-center space-x-2 px-3 py-1.5 bg-blue-100 rounded-full border border-blue-200">
                  <MapPin className="w-3 h-3 text-blue-600" />
                  <span className="text-sm font-medium text-blue-700 max-w-48 truncate">
                    {location.locationName}
                  </span>
                </div>
                
                {/* Mobile Location Badge */}
                <div className="sm:hidden flex items-center space-x-1 px-2 py-1 bg-blue-100 rounded-full border border-blue-200">
                  <MapPin className="w-3 h-3 text-blue-600" />
                  <span className="text-xs font-medium text-blue-700 max-w-24 truncate">
                    {location.locationName.split(',')[0]}
                  </span>
                </div>
                
                {/* Live Data Indicator */}
                <div className="hidden sm:flex items-center space-x-2 px-3 py-1.5 bg-green-100 rounded-full">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium text-green-700">Live Data</span>
                </div>
                
                <button 
                  className="flex items-center justify-center p-2 rounded-xl transition-all duration-300 hover:bg-white/90"
                  onClick={() => setActiveTab('settings')}
                >
                  <Settings className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden lg:block px-4 sm:px-6 py-8">
          <div className="text-center space-y-6 mb-12">
            <div className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-100 rounded-full text-blue-700 text-sm font-medium">
              <Waves className="w-4 h-4" />
              <span>Real-time Environmental Monitoring</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-800 leading-tight">
              Stay informed about the
              <span className="bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent"> air you breathe</span>
            </h2>
          </div>

          <TabsList className="grid w-full grid-cols-6 h-auto p-2 bg-white/90 backdrop-blur-md rounded-2xl shadow-xl border border-white/30 mb-8">
            <TabsTrigger 
              value="dashboard" 
              className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl transition-all duration-300 hover:bg-white/90 data-[state=active]:bg-gradient-to-br data-[state=active]:from-blue-500 data-[state=active]:to-green-500 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:scale-105"
            >
              <Activity className="w-5 h-5" />
              <span className="text-sm font-medium">Dashboard</span>
            </TabsTrigger>
            <TabsTrigger 
              value="map" 
              className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl transition-all duration-300 hover:bg-white/90 data-[state=active]:bg-gradient-to-br data-[state=active]:from-blue-500 data-[state=active]:to-green-500 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:scale-105"
            >
              <MapPin className="w-5 h-5" />
              <span className="text-sm font-medium">Map</span>
            </TabsTrigger>
            <TabsTrigger 
              value="satellite" 
              className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl transition-all duration-300 hover:bg-white/90 data-[state=active]:bg-gradient-to-br data-[state=active]:from-purple-500 data-[state=active]:to-blue-500 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:scale-105"
            >
              <Satellite className="w-5 h-5" />
              <span className="text-sm font-medium">TEMPO</span>
            </TabsTrigger>
            <TabsTrigger 
              value="alerts" 
              className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl transition-all duration-300 hover:bg-white/90 data-[state=active]:bg-gradient-to-br data-[state=active]:from-blue-500 data-[state=active]:to-green-500 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:scale-105"
            >
              <Bell className="w-5 h-5" />
              <span className="text-sm font-medium">Alerts</span>
            </TabsTrigger>
            <TabsTrigger 
              value="trends" 
              className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl transition-all duration-300 hover:bg-white/90 data-[state=active]:bg-gradient-to-br data-[state=active]:from-blue-500 data-[state=active]:to-green-500 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:scale-105"
            >
              <TrendingUp className="w-5 h-5" />
              <span className="text-sm font-medium">Trends</span>
            </TabsTrigger>
            <TabsTrigger 
              value="settings" 
              className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl transition-all duration-300 hover:bg-white/90 data-[state=active]:bg-gradient-to-br data-[state=active]:from-blue-500 data-[state=active]:to-green-500 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:scale-105"
            >
              <Settings className="w-5 h-5" />
              <span className="text-sm font-medium">Settings</span>
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Content Sections */}
        <div className="px-4 sm:px-6 pb-24 lg:pb-8">
          <TabsContent value="dashboard" className="mt-0 focus-visible:outline-none">
            <div className="animate-in fade-in-50 duration-300">
              <EnhancedDashboard />
            </div>
          </TabsContent>

          <TabsContent value="map" className="mt-0 focus-visible:outline-none">
            <div className="animate-in fade-in-50 duration-300">
              <ForecastMaps />
            </div>
          </TabsContent>

          <TabsContent value="satellite" className="mt-0 focus-visible:outline-none">
            <div className="animate-in fade-in-50 duration-300">
              <TEMPOSatelliteData />
            </div>
          </TabsContent>

          <TabsContent value="alerts" className="mt-0 focus-visible:outline-none">
            <div className="animate-in fade-in-50 duration-300">
              <PersonalizedAlerts />
            </div>
          </TabsContent>

          <TabsContent value="trends" className="mt-0 focus-visible:outline-none">
            <div className="animate-in fade-in-50 duration-300">
              <HistoricalTrends />
            </div>
          </TabsContent>

          <TabsContent value="sources" className="mt-0 focus-visible:outline-none">
            <div className="animate-in fade-in-50 duration-300">
              <DataSources />
            </div>
          </TabsContent>

          <TabsContent value="alert-system" className="mt-0 focus-visible:outline-none">
            <div className="animate-in fade-in-50 duration-300">
              <AlertDistributionSystem />
            </div>
          </TabsContent>

          <TabsContent value="settings" className="mt-0 focus-visible:outline-none">
            <div className="animate-in fade-in-50 duration-300">
              <LocationSettings />
            </div>
          </TabsContent>
        </div>

        {/* Mobile Bottom Navigation */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50">
          <div className="bg-white/95 backdrop-blur-md border-t border-white/20 shadow-2xl">
            <div className="px-2 py-2">
              <div className="overflow-x-auto">
                <TabsList className="grid w-max grid-cols-6 h-auto p-1 bg-transparent gap-1 min-w-full">
                  <TabsTrigger 
                    value="dashboard" 
                    className="flex flex-col items-center justify-center gap-1 p-3 rounded-xl transition-all duration-300 hover:bg-white/50 data-[state=active]:bg-gradient-to-br data-[state=active]:from-blue-500 data-[state=active]:to-green-500 data-[state=active]:text-white data-[state=active]:shadow-lg min-w-[70px]"
                  >
                    <Activity className="w-4 h-4" />
                    <span className="text-xs font-medium">Home</span>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="map" 
                    className="flex flex-col items-center justify-center gap-1 p-3 rounded-xl transition-all duration-300 hover:bg-white/50 data-[state=active]:bg-gradient-to-br data-[state=active]:from-blue-500 data-[state=active]:to-green-500 data-[state=active]:text-white data-[state=active]:shadow-lg min-w-[70px]"
                  >
                    <MapPin className="w-4 h-4" />
                    <span className="text-xs font-medium">Map</span>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="satellite" 
                    className="flex flex-col items-center justify-center gap-1 p-3 rounded-xl transition-all duration-300 hover:bg-white/50 data-[state=active]:bg-gradient-to-br data-[state=active]:from-purple-500 data-[state=active]:to-blue-500 data-[state=active]:text-white data-[state=active]:shadow-lg min-w-[70px]"
                  >
                    <Satellite className="w-4 h-4" />
                    <span className="text-xs font-medium">TEMPO</span>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="alerts" 
                    className="flex flex-col items-center justify-center gap-1 p-3 rounded-xl transition-all duration-300 hover:bg-white/50 data-[state=active]:bg-gradient-to-br data-[state=active]:from-blue-500 data-[state=active]:to-green-500 data-[state=active]:text-white data-[state=active]:shadow-lg min-w-[70px]"
                  >
                    <Bell className="w-4 h-4" />
                    <span className="text-xs font-medium">Alerts</span>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="trends" 
                    className="flex flex-col items-center justify-center gap-1 p-3 rounded-xl transition-all duration-300 hover:bg-white/50 data-[state=active]:bg-gradient-to-br data-[state=active]:from-blue-500 data-[state=active]:to-green-500 data-[state=active]:text-white data-[state=active]:shadow-lg min-w-[70px]"
                  >
                    <TrendingUp className="w-4 h-4" />
                    <span className="text-xs font-medium">Data</span>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="settings" 
                    className="flex flex-col items-center justify-center gap-1 p-3 rounded-xl transition-all duration-300 hover:bg-white/50 data-[state=active]:bg-gradient-to-br data-[state=active]:from-blue-500 data-[state=active]:to-green-500 data-[state=active]:text-white data-[state=active]:shadow-lg min-w-[70px]"
                  >
                    <Settings className="w-4 h-4" />
                    <span className="text-xs font-medium">Settings</span>
                  </TabsTrigger>
                </TabsList>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Tabs>
  );
}