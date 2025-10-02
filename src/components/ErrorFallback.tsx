/**
 * Error Fallback Component
 * Displays when the application encounters an error
 */

interface ErrorFallbackProps {
  error: Error;
  resetErrorBoundary: () => void;
}

export function ErrorFallback({ error, resetErrorBoundary }: ErrorFallbackProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.96-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Oops! Something went wrong</h1>
          <p className="text-gray-600 mb-4">AirWatch Pro encountered an error. Please try refreshing the page.</p>
          <div className="space-y-2">
            <button
              onClick={resetErrorBoundary}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
            <button
              onClick={() => window.location.reload()}
              className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
            >
              Refresh Page
            </button>
          </div>
          {import.meta.env.DEV && (
            <details className="mt-4 text-left">
              <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
                Show Error Details
              </summary>
              <pre className="mt-2 p-2 bg-gray-100 rounded text-xs text-red-600 overflow-auto">
                {error.message}
                {error.stack && '\n\n' + error.stack}
              </pre>
            </details>
          )}
        </div>
      </div>
    </div>
  );
}

export default ErrorFallback;