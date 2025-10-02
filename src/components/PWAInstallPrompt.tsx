import React, { useState, useEffect } from 'react';
import { X, Download, Smartphone, Monitor, Wifi, Bell, Zap, Shield } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

interface PWAInstallPromptProps {
  onClose?: () => void;
  className?: string;
}

export function PWAInstallPrompt({ onClose, className }: PWAInstallPromptProps) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const [deviceType, setDeviceType] = useState<'mobile' | 'desktop'>('desktop');

  useEffect(() => {
    // Detect device type
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    setDeviceType(isMobile ? 'mobile' : 'desktop');

    // Listen for the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const installEvent = e as BeforeInstallPromptEvent;
      setDeferredPrompt(installEvent);
      setIsVisible(true);
    };

    // Listen for custom event from index.html
    const handlePWAInstallable = (e: CustomEvent) => {
      setDeferredPrompt(e.detail);
      setIsVisible(true);
    };

    // Listen for app installed event
    const handleAppInstalled = () => {
      setIsVisible(false);
      setDeferredPrompt(null);
      // Could show a success message here
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('pwa-installable', handlePWAInstallable as EventListener);
    window.addEventListener('pwa-installed', handleAppInstalled);

    // Auto-show prompt after 30 seconds if available and not shown
    const autoShowTimer = setTimeout(() => {
      if (deferredPrompt && !isVisible) {
        setIsVisible(true);
      }
    }, 30000);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('pwa-installable', handlePWAInstallable as EventListener);
      window.removeEventListener('pwa-installed', handleAppInstalled);
      clearTimeout(autoShowTimer);
    };
  }, [deferredPrompt, isVisible]);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    setIsInstalling(true);

    try {
      await deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      
      if (choiceResult.outcome === 'accepted') {
        console.log('User accepted the install prompt');
        setIsVisible(false);
      } else {
        console.log('User dismissed the install prompt');
      }
    } catch (error) {
      console.error('Error during PWA installation:', error);
    } finally {
      setIsInstalling(false);
      setDeferredPrompt(null);
    }
  };

  const handleClose = () => {
    setIsVisible(false);
    onClose?.();
    
    // Don't show again for this session
    sessionStorage.setItem('pwa-install-dismissed', 'true');
  };

  const handleNotNow = () => {
    setIsVisible(false);
    
    // Show again after 24 hours
    const dismissUntil = Date.now() + (24 * 60 * 60 * 1000);
    localStorage.setItem('pwa-install-dismiss-until', dismissUntil.toString());
  };

  // Check if user has previously dismissed
  const isDismissedRecently = () => {
    const sessionDismissed = sessionStorage.getItem('pwa-install-dismissed');
    const dismissUntil = localStorage.getItem('pwa-install-dismiss-until');
    
    if (sessionDismissed) return true;
    if (dismissUntil && Date.now() < parseInt(dismissUntil)) return true;
    
    return false;
  };

  // Don't show if recently dismissed or if browser doesn't support PWA installation
  if (!isVisible || !deferredPrompt || isDismissedRecently()) {
    return null;
  }

  const features = [
    {
      icon: <Wifi className="h-5 w-5 text-blue-500" />,
      title: "Works Offline",
      description: "Access air quality data even without internet connection"
    },
    {
      icon: <Bell className="h-5 w-5 text-orange-500" />,
      title: "Smart Notifications",
      description: "Get alerts about air quality changes in your area"
    },
    {
      icon: <Zap className="h-5 w-5 text-green-500" />,
      title: "Lightning Fast",
      description: "Instant access from your home screen or taskbar"
    },
    {
      icon: <Shield className="h-5 w-5 text-purple-500" />,
      title: "Always Updated",
      description: "Automatic updates with the latest features and data"
    }
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
      <Card className={`w-full max-w-md mx-auto relative animate-in slide-in-from-bottom-4 duration-300 ${className}`}>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {deviceType === 'mobile' ? (
                <Smartphone className="h-8 w-8 text-blue-500" />
              ) : (
                <Monitor className="h-8 w-8 text-blue-500" />
              )}
              <div>
                <CardTitle className="text-lg">Install AirWatch Pro</CardTitle>
                <CardDescription className="text-sm">
                  Get the best air quality monitoring experience
                </CardDescription>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-3">
            {features.map((feature, index) => (
              <div key={index} className="flex items-start gap-3 p-2 rounded-lg bg-gray-50 dark:bg-gray-800">
                {feature.icon}
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {feature.title}
                  </h4>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 border border-blue-200 dark:border-blue-800">
            <div className="flex items-center gap-2">
              <Download className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
                {deviceType === 'mobile' ? 'Add to Home Screen' : 'Install as Desktop App'}
              </span>
            </div>
            <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
              {deviceType === 'mobile' 
                ? 'Quick access from your home screen, just like a native app'
                : 'Launch from your desktop or taskbar, no browser needed'
              }
            </p>
          </div>

          <div className="flex gap-2 pt-2">
            <Button 
              onClick={handleInstall}
              disabled={isInstalling}
              className="flex-1"
              size="sm"
            >
              {isInstalling ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Installing...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Install App
                </>
              )}
            </Button>
            <Button 
              variant="outline" 
              onClick={handleNotNow}
              size="sm"
              className="px-4"
            >
              Not Now
            </Button>
          </div>

          <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
            Free • No registration required • Works on all devices
          </p>
        </CardContent>
      </Card>
    </div>
  );
}