/**
 * Simple Test Component
 * Basic component to test if React is working
 */

export function SimpleTest() {
  console.log('SimpleTest component rendering...');
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-blue-50">
      <div className="text-center p-8 bg-white rounded-lg shadow-lg">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">AirWatch Pro</h1>
        <p className="text-gray-600 mb-4">Application is loading successfully!</p>
        <div className="w-4 h-4 bg-green-500 rounded-full mx-auto animate-pulse"></div>
      </div>
    </div>
  );
}

export default SimpleTest;