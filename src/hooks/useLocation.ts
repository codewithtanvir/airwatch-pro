/**
 * Location Context Hook
 * Custom hook to use location context
 */

import { useContext } from 'react';
import LocationContext, { type LocationContextType } from '../contexts/LocationContext';

export const useLocation = (): LocationContextType => {
  const context = useContext(LocationContext);
  if (context === undefined) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
};

export default useLocation;