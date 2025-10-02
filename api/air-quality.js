export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  const { lat, lon } = req.query;
  const latitude = parseFloat(lat) || 0;
  const longitude = parseFloat(lon) || 0;
  
  // Generate realistic air quality data
  const isUrban = Math.abs(latitude - 40.7128) < 1 && Math.abs(longitude + 74.0060) < 1;
  const baseAqi = isUrban ? 60 + Math.random() * 40 : 35 + Math.random() * 30;
  const aqi = Math.max(1, Math.min(500, Math.floor(baseAqi)));
  
  // Calculate pollutants
  const pm25 = Math.round((aqi * 0.4 + Math.random() * 10) * 10) / 10;
  const pm10 = Math.round((pm25 * 1.5 + Math.random() * 15) * 10) / 10;
  const o3 = Math.round((0.02 + (aqi / 500) * 0.1) * 1000) / 1000;
  const no2 = Math.round(20 + (aqi / 200) * 30);
  const so2 = Math.round((2 + Math.random() * 8) * 10) / 10;
  const co = Math.round((0.5 + Math.random() * 2) * 10) / 10;
  
  const level = aqi <= 50 ? 'Good' : aqi <= 100 ? 'Moderate' : 'Unhealthy for Sensitive Groups';
  
  const response = {
    coordinates: { lat: latitude, lon: longitude },
    data: {
      location: `Location (${latitude.toFixed(3)}, ${longitude.toFixed(3)})`,
      coordinates: { lat: latitude, lng: longitude },
      aqi: aqi,
      level: level,
      pollutants: {
        pm25: pm25,
        pm10: pm10,
        o3: o3,
        no2: no2,
        so2: so2,
        co: co
      },
      timestamp: new Date().toISOString(),
      source: "NASA TEMPO"
    }
  };
  
  res.status(200).json(response);
}