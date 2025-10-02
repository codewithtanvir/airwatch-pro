import React from 'react';
import { Loader2, Satellite, Radio, Cloud } from 'lucide-react';

interface LoadingStateProps {
  type?: 'stations' | 'satellite' | 'weather' | 'general';
  message?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function LoadingState({ 
  type = 'general', 
  message, 
  size = 'md' 
}: LoadingStateProps) {
  const getIcon = () => {
    switch (type) {
      case 'stations':
        return <Radio className={`${getIconSize()} text-blue-600 animate-pulse`} />;
      case 'satellite':
        return <Satellite className={`${getIconSize()} text-purple-600 animate-pulse`} />;
      case 'weather':
        return <Cloud className={`${getIconSize()} text-gray-600 animate-pulse`} />;
      default:
        return <Loader2 className={`${getIconSize()} text-blue-600 animate-spin`} />;
    }
  };

  const getIconSize = () => {
    switch (size) {
      case 'sm': return 'w-4 h-4';
      case 'lg': return 'w-12 h-12';
      default: return 'w-8 h-8';
    }
  };

  const getTextSize = () => {
    switch (size) {
      case 'sm': return 'text-sm';
      case 'lg': return 'text-lg';
      default: return 'text-base';
    }
  };

  const getDefaultMessage = () => {
    switch (type) {
      case 'stations':
        return 'Loading air quality stations...';
      case 'satellite':
        return 'Fetching satellite data...';
      case 'weather':
        return 'Getting weather data...';
      default:
        return 'Loading...';
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-6 space-y-3">
      {getIcon()}
      <p className={`${getTextSize()} text-gray-600 text-center animate-pulse`}>
        {message || getDefaultMessage()}
      </p>
      
      {size === 'lg' && (
        <div className="flex space-x-1">
          <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
          <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
          <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
        </div>
      )}
    </div>
  );
}

interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  type?: 'error' | 'warning' | 'info';
}

export function ErrorState({ 
  title, 
  message, 
  onRetry, 
  type = 'error' 
}: ErrorStateProps) {
  const getStyles = () => {
    switch (type) {
      case 'warning':
        return {
          bg: 'bg-yellow-50',
          border: 'border-yellow-200',
          text: 'text-yellow-800',
          button: 'bg-yellow-600 hover:bg-yellow-700'
        };
      case 'info':
        return {
          bg: 'bg-blue-50',
          border: 'border-blue-200',
          text: 'text-blue-800',
          button: 'bg-blue-600 hover:bg-blue-700'
        };
      default:
        return {
          bg: 'bg-red-50',
          border: 'border-red-200',
          text: 'text-red-800',
          button: 'bg-red-600 hover:bg-red-700'
        };
    }
  };

  const styles = getStyles();

  return (
    <div className={`${styles.bg} ${styles.border} border rounded-lg p-6 text-center`}>
      <div className={`${styles.text} space-y-2`}>
        {title && (
          <h3 className="font-semibold text-lg">{title}</h3>
        )}
        <p className="text-sm">{message}</p>
      </div>
      
      {onRetry && (
        <button
          onClick={onRetry}
          className={`mt-4 px-4 py-2 ${styles.button} text-white rounded-lg transition-colors duration-200 text-sm font-medium`}
        >
          Try Again
        </button>
      )}
    </div>
  );
}

export default LoadingState;