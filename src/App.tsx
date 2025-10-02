import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { LocationProvider } from '@/contexts/LocationContext';
import { TEMPODataProvider } from '@/contexts/TEMPODataContext';
import { PWAInstallPrompt } from '@/components/PWAInstallPrompt';
import Index from './pages/Index';
import NotFound from './pages/NotFound';
import './App.css';

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <LocationProvider>
        <TEMPODataProvider>
          <Toaster />
          <PWAInstallPrompt />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TEMPODataProvider>
      </LocationProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
