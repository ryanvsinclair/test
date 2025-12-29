// Location-aware unit system - Canada-first

export type DistanceUnit = 'km' | 'mi';
export type SpeedUnit = 'km/h' | 'mph';
export type Country = 'CA' | 'US' | 'UNKNOWN';

export interface UnitSystem {
  country: Country;
  distanceUnit: DistanceUnit;
  speedUnit: SpeedUnit;
}

// Conversion constants
const KM_TO_MI = 0.621371;
const MI_TO_KM = 1 / KM_TO_MI;

/**
 * Determine unit system based on location
 * Priority: user profile location > detected city > geolocation > default (Canada)
 */
export function resolveUnitSystem(
  userCountry?: string,
  detectedCountry?: string,
  geoCountry?: string
): UnitSystem {
  const country = determineCountry(userCountry, detectedCountry, geoCountry);
  
  return {
    country,
    distanceUnit: country === 'US' ? 'mi' : 'km',
    speedUnit: country === 'US' ? 'mph' : 'km/h',
  };
}

function determineCountry(
  userCountry?: string,
  detectedCountry?: string,
  geoCountry?: string
): Country {
  // Priority 1: User profile
  if (userCountry) {
    return normalizeCountry(userCountry);
  }
  
  // Priority 2: Detected from city/search
  if (detectedCountry) {
    return normalizeCountry(detectedCountry);
  }
  
  // Priority 3: Geolocation
  if (geoCountry) {
    return normalizeCountry(geoCountry);
  }
  
  // Default: Canada (launch market)
  return 'CA';
}

function normalizeCountry(country: string): Country {
  const normalized = country.toUpperCase();
  
  if (normalized === 'US' || normalized === 'USA' || normalized === 'UNITED STATES') {
    return 'US';
  }
  
  if (normalized === 'CA' || normalized === 'CAN' || normalized === 'CANADA') {
    return 'CA';
  }
  
  // Unknown country defaults to Canada (metric)
  return 'CA';
}

/**
 * Convert distance from kilometers to the target unit
 * Data is always stored in kilometers
 */
export function convertDistance(km: number, targetUnit: DistanceUnit): number {
  if (targetUnit === 'km') {
    return Math.round(km);
  }
  
  // Convert to miles
  return Math.round(km * KM_TO_MI);
}

/**
 * Format distance for display with unit label
 */
export function formatDistance(km: number, targetUnit: DistanceUnit): string {
  const value = convertDistance(km, targetUnit);
  return `${value.toLocaleString()} ${targetUnit}`;
}

/**
 * Format vehicle mileage based on the vehicle's location country
 * Uses listing's country, not user's preference
 * @param mileageInKm - Mileage stored in kilometers (canonical unit)
 * @param vehicleLocation - Location string (e.g. "Toronto, ON" or "San Francisco, CA")
 * @returns Formatted mileage with appropriate unit
 */
export function formatVehicleMileage(mileageInKm: number, vehicleLocation: string): string {
  const country = inferCountryFromLocation(vehicleLocation);
  const targetUnit = country === 'US' ? 'mi' : 'km';
  return formatDistance(mileageInKm, targetUnit);
}

/**
 * Infer country from location string
 * Looks for state/province codes or city names
 */
function inferCountryFromLocation(location: string): Country {
  if (!location) return 'CA'; // Default to Canada
  
  const locationUpper = location.toUpperCase();
  
  // Check for US states (common abbreviations)
  const usStates = [
    'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
    'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
    'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
    'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
    'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
  ];
  
  // Check for Canadian provinces
  const canadianProvinces = ['ON', 'BC', 'AB', 'QC', 'MB', 'SK', 'NS', 'NB', 'PE', 'NL', 'NT', 'YT', 'NU'];
  
  // Check if location contains US state code
  for (const state of usStates) {
    if (locationUpper.includes(` ${state}`) || locationUpper.endsWith(state)) {
      return 'US';
    }
  }
  
  // Check if location contains Canadian province code
  for (const province of canadianProvinces) {
    if (locationUpper.includes(` ${province}`) || locationUpper.endsWith(province)) {
      return 'CA';
    }
  }
  
  // Default to Canada if unable to determine
  return 'CA';
}

/**
 * Convert user input from display unit back to kilometers (for storage)
 */
export function toKilometers(value: number, sourceUnit: DistanceUnit): number {
  if (sourceUnit === 'km') {
    return value;
  }
  
  // Convert from miles
  return value * MI_TO_KM;
}

/**
 * Convert speed from km/h to the target unit
 */
export function convertSpeed(kmh: number, targetUnit: SpeedUnit): number {
  if (targetUnit === 'km/h') {
    return Math.round(kmh);
  }
  
  // Convert to mph
  return Math.round(kmh * KM_TO_MI);
}

/**
 * Format speed for display with unit label
 */
export function formatSpeed(kmh: number, targetUnit: SpeedUnit): string {
  const value = convertSpeed(kmh, targetUnit);
  return `${value} ${targetUnit}`;
}

/**
 * Convert filter ranges from display units to kilometers
 */
export function convertFilterRange(
  min: number,
  max: number,
  sourceUnit: DistanceUnit
): { min: number; max: number } {
  return {
    min: toKilometers(min, sourceUnit),
    max: toKilometers(max, sourceUnit),
  };
}

/**
 * Get appropriate distance range options for filters
 */
export function getDistanceRangeOptions(unit: DistanceUnit): { label: string; value: number }[] {
  if (unit === 'km') {
    return [
      { label: 'Under 50,000 km', value: 50000 },
      { label: '50,000 - 100,000 km', value: 100000 },
      { label: '100,000 - 150,000 km', value: 150000 },
      { label: 'Over 150,000 km', value: 200000 },
    ];
  }
  
  // Miles
  return [
    { label: 'Under 30,000 mi', value: 48280 }, // ~30k mi in km
    { label: '30,000 - 60,000 mi', value: 96560 },
    { label: '60,000 - 90,000 mi', value: 144840 },
    { label: 'Over 90,000 mi', value: 160934 },
  ];
}
