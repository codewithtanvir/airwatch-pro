// Quick test of API client URLs
console.log('Testing API Client URLs:');
console.log('Base URL:', import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000');

// Test URL construction
const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
const historicalUrl = `${baseUrl}/api/v1/air-quality/historical?latitude=40.7128&longitude=-74.0060&days=7`;
const tempoUrl = `${baseUrl}/api/v1/satellite/tempo?latitude=40.7128&longitude=-74.0060`;

console.log('Historical URL:', historicalUrl);
console.log('TEMPO URL:', tempoUrl);

// Test fetch
fetch(historicalUrl)
  .then(response => response.json())
  .then(data => console.log('Historical data test:', data))
  .catch(error => console.error('Historical data error:', error));

fetch(tempoUrl)
  .then(response => response.json()) 
  .then(data => console.log('TEMPO data test:', data))
  .catch(error => console.error('TEMPO data error:', error));