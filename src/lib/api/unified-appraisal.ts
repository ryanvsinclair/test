/**
 * Unified Vehicle Appraisal System
 * 
 * Automatic country detection and valuation for both CA and US vehicles
 * Always provides an appraisal for every vehicle
 */

import { UserVehicle } from '@/types';

export interface VehicleAppraisal {
  min: number | null;
  max: number | null;
  currency: 'CAD' | 'USD';
  market: 'CA' | 'US';
  source: 'estimated';
  status?: 'pending' | 'ready';
  lastUpdated: string;
}

type Country = 'CA' | 'US';

/**
 * Infer country from location or metadata
 */
function inferCountryFromVehicle(vehicle: UserVehicle): Country {
  // Priority 1: Check manufacturer country if available
  if (vehicle.manufacturer?.country) {
    const country = vehicle.manufacturer.country.toUpperCase();
    if (country === 'US' || country === 'USA' || country === 'UNITED STATES') {
      return 'US';
    }
    if (country === 'CA' || country === 'CAN' || country === 'CANADA') {
      return 'CA';
    }
  }

  // Priority 2: Infer from notes or other metadata (future expansion)
  // Default to CA if unable to determine
  return 'CA';
}

/**
 * Calculate base valuation factors
 */
function calculateValuationFactors(vehicle: UserVehicle, market: Country) {
  const currentYear = new Date().getFullYear();
  const vehicleAge = currentYear - vehicle.year;
  const mileageKm = vehicle.mileage || 0;

  // Convert mileage to market-appropriate unit for calculation
  const mileageMiles = mileageKm / 1.60934;

  // Base MSRP estimate (if not available, use industry averages)
  const baseMSRP = vehicle.specifications?.msrp || 30000; // Default baseline

  // Age depreciation (simplified curve)
  let ageDepreciation = 1.0;
  if (vehicleAge === 0) {
    ageDepreciation = 0.85; // 15% first year
  } else if (vehicleAge === 1) {
    ageDepreciation = 0.75; // 25% by year 1
  } else if (vehicleAge === 2) {
    ageDepreciation = 0.68; // 32% by year 2
  } else if (vehicleAge === 3) {
    ageDepreciation = 0.62; // 38% by year 3
  } else if (vehicleAge <= 5) {
    ageDepreciation = 0.55 - (vehicleAge - 3) * 0.03;
  } else if (vehicleAge <= 10) {
    ageDepreciation = 0.49 - (vehicleAge - 5) * 0.02;
  } else {
    ageDepreciation = Math.max(0.20, 0.39 - (vehicleAge - 10) * 0.01);
  }

  // Mileage depreciation
  const avgAnnualMileage = market === 'CA' ? 15000 : 12000; // km or mi per year
  const expectedMileage = market === 'CA' ? mileageKm : mileageMiles;
  const expectedForAge = vehicleAge * avgAnnualMileage;
  
  let mileageDepreciation = 1.0;
  if (expectedMileage > expectedForAge) {
    const excessMileage = expectedMileage - expectedForAge;
    const excessYears = excessMileage / avgAnnualMileage;
    mileageDepreciation = Math.max(0.7, 1.0 - excessYears * 0.05);
  } else if (expectedMileage < expectedForAge * 0.7) {
    // Low mileage bonus
    mileageDepreciation = 1.05;
  }

  return {
    baseMSRP,
    ageDepreciation,
    mileageDepreciation,
    vehicleAge,
  };
}

/**
 * Generate unified appraisal for any vehicle
 * Always returns a valid appraisal
 */
export function generateUnifiedAppraisal(vehicle: UserVehicle): VehicleAppraisal {
  const market = inferCountryFromVehicle(vehicle);
  const currency = market === 'CA' ? 'CAD' : 'USD';

  const { baseMSRP, ageDepreciation, mileageDepreciation } = calculateValuationFactors(vehicle, market);

  // Calculate base value
  const baseValue = baseMSRP * ageDepreciation * mileageDepreciation;

  // Create range (±8% for market variance)
  const rangePercent = 0.08;
  const min = Math.round(baseValue * (1 - rangePercent));
  const max = Math.round(baseValue * (1 + rangePercent));

  return {
    min,
    max,
    currency,
    market,
    source: 'estimated',
    status: 'ready',
    lastUpdated: new Date().toISOString(),
  };
}

/**
 * Safe number formatter - NEVER throws on undefined/null
 */
function safeFormatNumber(value: number | null | undefined): string | null {
  if (typeof value !== 'number' || isNaN(value)) {
    return null;
  }
  try {
    return value.toLocaleString();
  } catch {
    return null;
  }
}

/**
 * Format appraisal for display - 100% crash-proof
 */
export function formatAppraisal(appraisal: VehicleAppraisal | null | undefined): {
  rangeText: string;
  label: string;
  flag: string;
  isPending: boolean;
} {
  // Defensive: Handle completely missing appraisal
  if (!appraisal) {
    return {
      rangeText: 'Market value pending',
      label: 'Estimated market value',
      flag: '🇨🇦', // Default
      isPending: true,
    };
  }

  const currencySymbol = appraisal.currency === 'CAD' ? '$' : '$';
  const currencyCode = appraisal.currency;
  
  // Check if appraisal is pending or values are null/undefined
  const isPending = appraisal.status === 'pending' || 
                    appraisal.min === null || 
                    appraisal.min === undefined ||
                    appraisal.max === null || 
                    appraisal.max === undefined;
  
  let rangeText = '';
  if (isPending) {
    rangeText = 'Calculating market value…';
  } else {
    // Use safe formatter - NEVER call toLocaleString directly
    const minFormatted = safeFormatNumber(appraisal.min);
    const maxFormatted = safeFormatNumber(appraisal.max);
    
    // Defensive: If formatting failed, show pending
    if (minFormatted === null || maxFormatted === null) {
      rangeText = 'Market value pending';
    } else {
      rangeText = `${currencySymbol}${minFormatted} – ${currencySymbol}${maxFormatted} ${currencyCode}`;
    }
  }
  
  const flag = appraisal.market === 'CA' ? '🇨🇦' : '🇺🇸';
  
  const marketSource = appraisal.market === 'CA' 
    ? 'Canadian industry data'
    : 'U.S. industry data';
  
  const label = `Estimated market value based on ${marketSource}`;

  return {
    rangeText,
    label,
    flag,
    isPending: isPending || rangeText.includes('pending'),
  };
}

/**
 * Check if appraisal needs refresh
 * Refresh if: mileage changed, age changed, or older than 30 days
 */
export function needsAppraisalRefresh(vehicle: UserVehicle): boolean {
  if (!vehicle.appraisal) return true;

  const lastUpdated = new Date(vehicle.appraisal.lastUpdated);
  const daysSinceUpdate = (Date.now() - lastUpdated.getTime()) / (1000 * 60 * 60 * 24);

  // Refresh if older than 30 days
  if (daysSinceUpdate > 30) return true;

  // Refresh if vehicle age has changed (new year)
  const currentYear = new Date().getFullYear();
  const vehicleAgeNow = currentYear - vehicle.year;
  
  // Simple heuristic: if more than 365 days old, likely crossed year boundary
  if (daysSinceUpdate > 365) return true;

  return false;
}

/**
 * Create initial pending appraisal for new vehicle
 */
export function createPendingAppraisal(vehicle: UserVehicle): VehicleAppraisal {
  const market = inferCountryFromVehicle(vehicle);
  const currency = market === 'CA' ? 'CAD' : 'USD';

  return {
    min: null,
    max: null,
    currency,
    market,
    source: 'estimated',
    status: 'pending',
    lastUpdated: new Date().toISOString(),
  };
}

/**
 * Ensure vehicle has appraisal, generate if missing
 */
export function ensureAppraisal(vehicle: UserVehicle): UserVehicle {
  if (!vehicle.appraisal) {
    // First time: create pending appraisal immediately
    return {
      ...vehicle,
      appraisal: createPendingAppraisal(vehicle),
    };
  }
  
  if (needsAppraisalRefresh(vehicle)) {
    return {
      ...vehicle,
      appraisal: generateUnifiedAppraisal(vehicle),
    };
  }
  
  return vehicle;
}
