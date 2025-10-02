/**
 * Location Search Component
 * Compact location search for dashboard header
 */

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MapPin, Search, Locate, X, Globe, ChevronDown, AlertTriangle } from 'lucide-react';
import { useLocation } from '@/hooks/useLocation';
import { type LocationSearchResult } from '@/lib/apiClient';

// Popular locations for quick selection
const POPULAR_LOCATIONS: LocationSearchResult[] = [
  { id: 'nyc', name: 'New York, NY, USA', coordinates: { lat: 40.7128, lng: -74.0060 }, country: 'United States' },
  { id: 'la', name: 'Los Angeles, CA, USA', coordinates: { lat: 34.0522, lng: -118.2437 }, country: 'United States' },
  { id: 'chicago', name: 'Chicago, IL, USA', coordinates: { lat: 41.8781, lng: -87.6298 }, country: 'United States' },
  { id: 'london', name: 'London, UK', coordinates: { lat: 51.5074, lng: -0.1278 }, country: 'United Kingdom' },
  { id: 'paris', name: 'Paris, France', coordinates: { lat: 48.8566, lng: 2.3522 }, country: 'France' },
  { id: 'tokyo', name: 'Tokyo, Japan', coordinates: { lat: 35.6762, lng: 139.6503 }, country: 'Japan' },
  { id: 'beijing', name: 'Beijing, China', coordinates: { lat: 39.9042, lng: 116.4074 }, country: 'China' },
  { id: 'mumbai', name: 'Mumbai, India', coordinates: { lat: 19.0760, lng: 72.8777 }, country: 'India' },
  { id: 'sydney', name: 'Sydney, Australia', coordinates: { lat: -33.8688, lng: 151.2093 }, country: 'Australia' },
  { id: 'saopaulo', name: 'São Paulo, Brazil', coordinates: { lat: -23.5505, lng: -46.6333 }, country: 'Brazil' },
];

interface LocationSearchProps {
  compact?: boolean;
}

const LocationSearch: React.FC<LocationSearchProps> = ({ compact = false }) => {
  const { location, setLocation, detectCurrentLocation, searchLocations, retryLocationDetection } = useLocation();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<LocationSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  // Close search when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchOpen(false);
        setSearchResults([]);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    
    if (query.length < 3) {
      setSearchResults([]);
      return;
    }

    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Debounce search
    searchTimeoutRef.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const results = await searchLocations(query);
        setSearchResults(results.slice(0, 5)); // Limit to 5 results for compact display
      } catch (error) {
        console.error('Search error:', error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);
  };

  const handleLocationSelect = (result: LocationSearchResult) => {
    setLocation(result.coordinates, result.name);
    setSearchQuery('');
    setSearchResults([]);
    setIsSearchOpen(false);
  };

  const handleDetectLocation = async () => {
    try {
      await detectCurrentLocation();
      setSearchQuery('');
      setSearchResults([]);
      setIsSearchOpen(false);
    } catch (error) {
      console.error('Location detection failed:', error);
      // Show error to user but keep search open for manual entry
      setSearchQuery('');
      setSearchResults([]);
    }
  };

  if (compact) {
    return (
      <div ref={searchRef} className="relative">
        {!isSearchOpen ? (
          <div className="flex items-center gap-3">
            {/* Current location display */}
            <div className="flex items-center gap-2 text-sm">
              <div className="flex items-center gap-1.5 px-2 py-1 bg-muted/50 rounded-md">
                <MapPin className={`h-4 w-4 ${
                  location.error ? 'text-destructive' : 
                  location.isDetecting ? 'text-primary animate-bounce' : 'text-primary'
                }`} />
                <span className="max-w-48 truncate font-medium text-foreground">
                  {location.isDetecting ? 'Detecting location...' : location.locationName}
                </span>
              </div>
            </div>

            {/* Popular locations dropdown button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsSearchOpen(true)}
              className="flex items-center gap-2 hover:bg-primary/10 border-primary/20"
            >
              <Globe className="h-4 w-4 text-primary" />
              <span className="hidden sm:inline font-medium">Locations</span>
              <ChevronDown className="h-3 w-3" />
            </Button>

            {/* Current location button */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleDetectLocation}
              disabled={location.isDetecting}
              className="flex items-center gap-2 hover:bg-primary/10 border-primary/20"
              title={location.isDetecting ? 'Detecting your location...' : 'Detect current location'}
            >
              {location.isDetecting ? (
                <Locate className="h-4 w-4 animate-spin text-primary" />
              ) : (
                <Locate className="h-4 w-4 text-primary" />
              )}
              <span className="hidden sm:inline font-medium">Current</span>
            </Button>
          </div>
        ) : (
          <div className="bg-background border border-border rounded-lg shadow-xl p-4 min-w-80 max-w-96 z-50 backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  placeholder="Search for a city or location..."
                  className="pl-10 pr-4 h-10"
                  autoFocus
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDetectLocation}
                disabled={location.isDetecting}
                title={location.isDetecting ? 'Detecting your location...' : 'Detect current location'}
                className={`flex items-center gap-1 ${location.isDetecting ? 'animate-pulse' : ''}`}
              >
                <Locate className={`h-4 w-4 ${
                  location.isDetecting ? 'animate-spin text-blue-500' : ''
                }`} />
                <span className="text-xs">GPS</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setIsSearchOpen(false);
                  setSearchResults([]);
                  setSearchQuery('');
                }}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            {/* Current Location */}
            <div
              className="flex items-center gap-3 p-3 hover:bg-muted/50 rounded-lg cursor-pointer text-sm border border-primary/20 bg-primary/5 mb-4 transition-colors"
              onClick={() => setIsSearchOpen(false)}
            >
              <div className="flex-shrink-0">
                <MapPin className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-primary truncate">Current Location</p>
                <p className="text-foreground font-medium truncate">{location.locationName}</p>
                <p className="text-xs text-muted-foreground">
                  {location.coordinates.lat.toFixed(4)}, {location.coordinates.lng.toFixed(4)}
                </p>
                {location.lastUpdated && (
                  <p className="text-xs text-muted-foreground">
                    Updated: {location.lastUpdated.toLocaleTimeString()}
                  </p>
                )}
              </div>
            </div>

            {/* Popular Locations Section - Show when no search query */}
            {!searchQuery && (
              <div className="mb-4">
                <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                  <Globe className="h-4 w-4 text-primary" />
                  Popular Locations
                </h4>
                <div className="space-y-1 max-h-64 overflow-y-auto scrollbar-thin scrollbar-thumb-muted">
                  {POPULAR_LOCATIONS.map((popularLocation, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 p-3 hover:bg-muted/70 rounded-lg cursor-pointer text-sm transition-all duration-200 hover:scale-[1.02] border border-transparent hover:border-muted-foreground/20"
                      onClick={() => handleLocationSelect(popularLocation)}
                    >
                      <div className="flex-shrink-0">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground truncate">{popularLocation.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{popularLocation.country}</p>
                      </div>
                      <div className="flex-shrink-0">
                        <ChevronDown className="h-3 w-3 text-muted-foreground rotate-[-90deg]" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Location Error Display */}
            {location.error && (
              <div className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg mb-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                      Location Error
                    </p>
                    <p className="mt-1">{location.error}</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={retryLocationDetection}
                    disabled={location.isDetecting}
                    className="ml-2 h-8 px-3 text-xs border-destructive/30 hover:bg-destructive/10"
                  >
                    Retry
                  </Button>
                </div>
              </div>
            )}

            {/* Search Results - Show when there's a search query */}
            {searchQuery && searchResults.length > 0 && (
              <div className="border-t border-border pt-4">
                <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                  <Search className="h-4 w-4 text-primary" />
                  Search Results
                </h4>
                <div className="space-y-1 max-h-64 overflow-y-auto scrollbar-thin scrollbar-thumb-muted">
                  {searchResults.map((result, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 p-3 hover:bg-muted/70 rounded-lg cursor-pointer text-sm transition-all duration-200 hover:scale-[1.02] border border-transparent hover:border-muted-foreground/20"
                      onClick={() => handleLocationSelect(result)}
                    >
                      <div className="flex-shrink-0">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground truncate">{result.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{result.country}</p>
                      </div>
                      <div className="flex-shrink-0">
                        <ChevronDown className="h-3 w-3 text-muted-foreground rotate-[-90deg]" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {isSearching && (
              <div className="flex items-center justify-center py-8 text-muted-foreground border-t border-border">
                <div className="flex items-center gap-2">
                  <Search className="h-4 w-4 animate-pulse" />
                  <span className="text-sm">Searching locations...</span>
                </div>
              </div>
            )}

            {searchQuery.length >= 3 && !isSearching && searchResults.length === 0 && (
              <div className="flex items-center justify-center py-8 text-muted-foreground border-t border-border">
                <div className="text-center">
                  <MapPin className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm font-medium">No locations found</p>
                  <p className="text-xs">Try searching for a different location</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // Full search component (for settings page)
  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Input
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Search for a location..."
          className="flex-1"
        />
        <Button
          variant="outline"
          onClick={handleDetectLocation}
          disabled={location.isDetecting}
        >
          <Locate className={`h-4 w-4 ${location.isDetecting ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {searchResults.length > 0 && (
        <div className="border rounded-md divide-y max-h-60 overflow-y-auto">
          {searchResults.map((result, index) => (
            <div
              key={index}
              className="p-3 hover:bg-gray-50 cursor-pointer"
              onClick={() => handleLocationSelect(result)}
            >
              <p className="font-medium">{result.name}</p>
              <p className="text-sm text-gray-500">{result.country}</p>
              <p className="text-xs text-gray-400">
                {result.coordinates.lat.toFixed(3)}, {result.coordinates.lng.toFixed(3)}
              </p>
            </div>
          ))}
        </div>
      )}

      {isSearching && (
        <div className="text-center py-2 text-gray-500">
          Searching...
        </div>
      )}
    </div>
  );
};

export default LocationSearch;