import { createRoot } from 'react-dom/client';
import { ErrorBoundary } from 'react-error-boundary';
import { ErrorFallback } from '@/components/ErrorFallback';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <ErrorBoundary
    FallbackComponent={ErrorFallback}
    onError={(error, errorInfo) => {
      console.error('Application Error:', error);
      console.error('Error Info:', errorInfo);
    }}
  >
    <App />
  </ErrorBoundary>
);
