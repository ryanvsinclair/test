'use client';

import { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { citiesAPI, City } from '@/lib/api/cities';
import { MapPin, Check, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CitySearchProps {
  value?: City | null;
  onChange: (city: City | null) => void;
  className?: string;
}

export function CitySearch({ value, onChange, className }: CitySearchProps) {
  const [query, setQuery] = useState(value?.name || '');
  const [suggestions, setSuggestions] = useState<City[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Search cities on query change
  useEffect(() => {
    const searchCities = async () => {
      if (query.length === 0) {
        setSuggestions([]);
        setIsOpen(false);
        return;
      }

      setIsLoading(true);
      try {
        const results = await citiesAPI.searchCities(query);
        setSuggestions(results);
        setIsOpen(results.length > 0);
        setSelectedIndex(0);
      } catch (error) {
        console.error('City search failed:', error);
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    };

    const debounce = setTimeout(searchCities, 150);
    return () => clearTimeout(debounce);
  }, [query]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (city: City) => {
    setQuery(city.name);
    onChange(city);
    setIsOpen(false);
    setSuggestions([]);
  };

  const handleClear = () => {
    setQuery('');
    onChange(null);
    setSuggestions([]);
    setIsOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, suggestions.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (suggestions[selectedIndex]) {
          handleSelect(suggestions[selectedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        break;
    }
  };

  return (
    <div ref={wrapperRef} className={cn('relative', className)}>
      <Label htmlFor="city-search">City</Label>
      <div className="relative mt-2">
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          id="city-search"
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (suggestions.length > 0) setIsOpen(true);
          }}
          placeholder="Search for your city"
          className="pl-10 pr-10"
        />
        {isLoading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground animate-spin" />
        )}
        {query && !isLoading && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            ×
          </button>
        )}
      </div>

      {/* Suggestions Dropdown */}
      {isOpen && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-card border border-border rounded-lg shadow-lg overflow-hidden">
          {suggestions.map((city, index) => (
            <button
              key={`${city.name}-${city.state}-${city.country}`}
              onClick={() => handleSelect(city)}
              className={cn(
                'w-full px-4 py-3 text-left hover:bg-accent/10 transition-colors flex items-center justify-between',
                selectedIndex === index && 'bg-accent/10'
              )}
            >
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="font-medium text-sm">{city.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {city.state} · {city.country === 'CA' ? 'Canada' : 'United States'}
                  </p>
                </div>
              </div>
              {value?.name === city.name && value?.state === city.state && (
                <Check className="w-4 h-4 text-accent" />
              )}
            </button>
          ))}
        </div>
      )}

      {/* Current Selection Display */}
      {value && !isOpen && query === value.name && (
        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
          <Check className="w-3 h-3 text-accent" />
          {value.displayName}
        </p>
      )}
    </div>
  );
}
