import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Wifi, 
  WifiOff, 
  Satellite, 
  Radio, 
  Server, 
  Cloud, 
  CheckCircle, 
  AlertTriangle, 
  Clock,
  RefreshCw
} from 'lucide-react';

interface DataSourceStatus {
  name: string;
  status: 'connected' | 'fallback' | 'error' | 'loading';
  source: string;
  lastUpdate?: string;
  dataType: 'satellite' | 'ground' | 'weather' | 'geocoding';
  reliability: 'high' | 'medium' | 'low';
}

interface DataSourceIndicatorProps {
  sources: DataSourceStatus[];
  compact?: boolean;
}

export function DataSourceIndicator({ sources, compact = false }: DataSourceIndicatorProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'fallback':
        return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      case 'error':
        return <WifiOff className="w-4 h-4 text-red-600" />;
      case 'loading':
        return <RefreshCw className="w-4 h-4 text-blue-600 animate-spin" />;
      default:
        return <Wifi className="w-4 h-4 text-gray-400" />;
    }
  };

  const getSourceIcon = (dataType: string) => {
    switch (dataType) {
      case 'satellite':
        return <Satellite className="w-4 h-4 text-purple-600" />;
      case 'ground':
        return <Radio className="w-4 h-4 text-blue-600" />;
      case 'weather':
        return <Cloud className="w-4 h-4 text-gray-600" />;
      case 'geocoding':
        return <Server className="w-4 h-4 text-green-600" />;
      default:
        return <Wifi className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'fallback':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'loading':
        return 'bg-blue-50 border-blue-200 text-blue-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-600';
    }
  };

  const getReliabilityBadge = (reliability: string) => {
    switch (reliability) {
      case 'high':
        return <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">High</Badge>;
      case 'medium':
        return <Badge variant="outline" className="text-xs bg-yellow-50 text-yellow-700 border-yellow-200">Medium</Badge>;
      case 'low':
        return <Badge variant="outline" className="text-xs bg-red-50 text-red-700 border-red-200">Low</Badge>;
      default:
        return null;
    }
  };

  if (compact) {
    const connectedCount = sources.filter(s => s.status === 'connected').length;
    const totalCount = sources.length;
    
    return (
      <div className="flex items-center gap-2 text-sm">
        <div className="flex items-center gap-1">
          {connectedCount === totalCount ? (
            <CheckCircle className="w-4 h-4 text-green-600" />
          ) : connectedCount > 0 ? (
            <AlertTriangle className="w-4 h-4 text-yellow-600" />
          ) : (
            <WifiOff className="w-4 h-4 text-red-600" />
          )}
          <span className="text-xs font-medium">
            {connectedCount}/{totalCount} Sources
          </span>
        </div>
      </div>
    );
  }

  return (
    <Card className="border border-gray-200">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Server className="w-5 h-5 text-blue-600" />
          Data Sources Status
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {sources.map((source, index) => (
          <div
            key={index}
            className={`p-3 rounded-lg border ${getStatusColor(source.status)} transition-all duration-200`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                {getSourceIcon(source.dataType)}
                <span className="font-medium text-sm">{source.name}</span>
                {getStatusIcon(source.status)}
              </div>
              {getReliabilityBadge(source.reliability)}
            </div>
            
            <div className="flex items-center justify-between text-xs opacity-80">
              <span>{source.source}</span>
              {source.lastUpdate && (
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>{new Date(source.lastUpdate).toLocaleTimeString()}</span>
                </div>
              )}
            </div>
            
            {source.status === 'fallback' && (
              <div className="mt-2 text-xs">
                Using enhanced simulation - real data may be temporarily unavailable
              </div>
            )}
            
            {source.status === 'error' && (
              <div className="mt-2 text-xs">
                Service unavailable - using cached or fallback data
              </div>
            )}
          </div>
        ))}
        
        <div className="pt-2 border-t border-gray-200">
          <div className="text-xs text-gray-600 text-center">
            Real-time monitoring • Auto-refresh every 5 minutes
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default DataSourceIndicator;