import { useState, useEffect, useCallback } from 'react';
import { nasaTempoService, TEMPOData } from '@/services/nasaTempoService';
import { config } from '@/lib/config';

interface UseTEMPODataReturn {
  tempoData: TEMPOData | null;
  loading: boolean;
  error: string | null;
  lastUpdate: Date | null;
  nextUpdate: Date | null;
  isStale: boolean;
  refreshData: () => Promise<void>;
}

export function useTEMPOData(lat: number, lng: number): UseTEMPODataReturn {
  const [tempoData, setTempoData] = useState<TEMPOData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const fetchTEMPOData = useCallback(async () => {
    if (!lat || !lng) return;

    setLoading(true);
    setError(null);

    try {
      config.log('info', 'Fetching TEMPO satellite data', { lat, lng });
      
      const data = await nasaTempoService.getTEMPOData(lat, lng);
      
      setTempoData(data);
      setLastUpdate(new Date());
      
      config.log('info', 'TEMPO data fetched successfully', {
        no2_column: data.no2_column,
        quality_flag: data.quality_flag,
        observation_time: data.observation_time
      });
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch TEMPO data';
      setError(errorMessage);
      config.log('error', 'TEMPO data fetch failed:', err);
    } finally {
      setLoading(false);
    }
  }, [lat, lng]);

  // Auto-refresh TEMPO data every hour (matching satellite update frequency)
  useEffect(() => {
    if (!lat || !lng) return;

    // Initial fetch
    fetchTEMPOData();

    // Set up hourly refresh (TEMPO updates hourly)
    const interval = setInterval(fetchTEMPOData, 60 * 60 * 1000); // 1 hour

    return () => clearInterval(interval);
  }, [fetchTEMPOData, lat, lng]);

  // Calculate next expected update time
  const nextUpdate = lastUpdate ? new Date(lastUpdate.getTime() + 60 * 60 * 1000) : null;

  // Check if data is stale (older than 2 hours)
  const isStale = lastUpdate ? (Date.now() - lastUpdate.getTime()) > (2 * 60 * 60 * 1000) : false;

  return {
    tempoData,
    loading,
    error,
    lastUpdate,
    nextUpdate,
    isStale,
    refreshData: fetchTEMPOData,
  };
}