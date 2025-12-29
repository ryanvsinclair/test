'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { resolveUnitSystem, UnitSystem, convertDistance, formatDistance, convertSpeed, formatSpeed } from '@/lib/units';
import { useAuth } from './AuthContext';

interface UnitsContextValue {
  units: UnitSystem;
  setUserCountry: (country: string) => void;
  convertDistance: (km: number) => number;
  formatDistance: (km: number) => string;
  convertSpeed: (kmh: number) => number;
  formatSpeed: (kmh: number) => string;
}

const UnitsContext = createContext<UnitsContextValue | undefined>(undefined);

export function UnitsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [userCountry, setUserCountry] = useState<string | undefined>(undefined);
  const [detectedCountry, setDetectedCountry] = useState<string | undefined>(undefined);
  
  // Resolve unit system based on available location data
  // Priority: user.country > user.location > detectedCountry > default (CA)
  const units = resolveUnitSystem(
    user?.country || userCountry || user?.location,
    detectedCountry,
    undefined // geolocation not implemented yet
  );
  
  const value: UnitsContextValue = {
    units,
    setUserCountry,
    convertDistance: (km: number) => convertDistance(km, units.distanceUnit),
    formatDistance: (km: number) => formatDistance(km, units.distanceUnit),
    convertSpeed: (kmh: number) => convertSpeed(kmh, units.speedUnit),
    formatSpeed: (kmh: number) => formatSpeed(kmh, units.speedUnit),
  };
  
  return (
    <UnitsContext.Provider value={value}>
      {children}
    </UnitsContext.Provider>
  );
}

export function useUnits() {
  const context = useContext(UnitsContext);
  if (!context) {
    throw new Error('useUnits must be used within UnitsProvider');
  }
  return context;
}
