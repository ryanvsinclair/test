// OEM Warranty Estimator
// Provides warranty estimates based on authoritative manufacturer data
// Uses warranties.aws.json dataset

import warranties from "@/lib/data/warranties.aws.json";

// CANONICAL UNIT: All calculations are performed in MILES internally
// Conversion to KM happens only at display time if required

export interface WarrantyRule {
  warrantyType: 'bumper' | 'powertrain' | 'battery';
  timeLimitYears: number;
  mileageLimit: number; // CANONICAL UNIT: miles
}

export interface WarrantyEstimate {
  type: 'bumper' | 'powertrain' | 'battery';
  status: 'active' | 'expired';
  timeRangeMonths?: [number, number]; // [min, max] when in-service date unknown
  timeRemainingMonths?: number; // single value when in-service date is known
  mileageRemaining: number; // CANONICAL UNIT: miles
  isActive: boolean;
  expiresFirst: 'time' | 'mileage';
  inServiceDateKnown: boolean; // flag for UI transparency
}

interface VehicleWarrantyInput {
  make: string;
  model: string;
  year: number;
  currentMileage: number; // CANONICAL UNIT: miles
  fuelType: 'gasoline' | 'diesel' | 'electric' | 'hybrid';
  inServiceDate?: Date;
}

// Normalize make key for warranty lookup
function normalizeMakeKey(make: string): string {
  return make.toLowerCase().trim().replace(/\s+/g, '-');
}

// Lookup warranty data from authoritative dataset
// CRITICAL: warranties.aws.json is authoritative
// This dataset takes precedence over hardcoded fallback rules
function getWarrantyData(make: string, modelYear: number): WarrantyRule[] | null {
  const makeKey = normalizeMakeKey(make);
  const yearStr = String(modelYear);
  
  try {
    const makeBlock = (warranties as any)[makeKey];
    if (!makeBlock) return null;
    
    const yearBlock = makeBlock[yearStr];
    if (!yearBlock) return null;
    
    const warrantyList = yearBlock.warranties;
    if (!warrantyList || !Array.isArray(warrantyList) || warrantyList.length === 0) {
      return null;
    }
    
    // Convert dataset format to WarrantyRule format
    const rules: WarrantyRule[] = [];
    
    for (const w of warrantyList) {
      if (!w.type || typeof w.months !== 'number' || typeof w.miles !== 'number') {
        continue; // Skip malformed entries
      }
      
      let warrantyType: 'bumper' | 'powertrain' | 'battery';
      const typeStr = String(w.type).toLowerCase();
      
      if (typeStr.includes('bumper') || typeStr.includes('basic') || typeStr.includes('comprehensive')) {
        warrantyType = 'bumper';
      } else if (typeStr.includes('powertrain') || typeStr.includes('drivetrain')) {
        warrantyType = 'powertrain';
      } else if (typeStr.includes('battery') || typeStr.includes('electric')) {
        warrantyType = 'battery';
      } else {
        continue; // Unknown type, skip
      }
      
      // CRITICAL: Dataset uses MILES - store directly (no conversion needed)
      const mileageLimit = w.miles;
      const timeLimitYears = w.months / 12;
      
      rules.push({
        warrantyType,
        timeLimitYears,
        mileageLimit,
      });
    }
    
    // DATASET AUTHORITY: Return dataset values, never override
    return rules.length > 0 ? rules : null;
  } catch (error) {
    // Defensive: Never throw, return null if any access fails
    return null;
  }
}

/**
 * FALLBACK ONLY
 * Used only when warranties.aws.json lacks make/year data.
 * Must never override dataset values.
 * Dataset is authoritative and takes precedence.
 */
const warrantyRules: Record<string, WarrantyRule[]> = {
  // Toyota/Lexus (3yr/36k basic, 5yr/60k powertrain)
  'toyota': [
    { warrantyType: 'bumper', timeLimitYears: 3, mileageLimit: 36000 },
    { warrantyType: 'powertrain', timeLimitYears: 5, mileageLimit: 60000 },
  ],
  // Lexus (Premium - 4yr/50k basic, 6yr/70k powertrain)
  'lexus': [
    { warrantyType: 'bumper', timeLimitYears: 4, mileageLimit: 50000 },
    { warrantyType: 'powertrain', timeLimitYears: 6, mileageLimit: 70000 },
  ],
  
  // Honda/Acura (3yr/36k basic, 5yr/60k powertrain)
  'honda': [
    { warrantyType: 'bumper', timeLimitYears: 3, mileageLimit: 36000 },
    { warrantyType: 'powertrain', timeLimitYears: 5, mileageLimit: 60000 },
  ],
  'acura': [
    { warrantyType: 'bumper', timeLimitYears: 4, mileageLimit: 50000 },
    { warrantyType: 'powertrain', timeLimitYears: 6, mileageLimit: 70000 },
  ],
  
  // Ford/Lincoln (3yr/36k basic, 5yr/60k powertrain)
  'ford': [
    { warrantyType: 'bumper', timeLimitYears: 3, mileageLimit: 36000 },
    { warrantyType: 'powertrain', timeLimitYears: 5, mileageLimit: 60000 },
  ],
  'lincoln': [
    { warrantyType: 'bumper', timeLimitYears: 4, mileageLimit: 50000 },
    { warrantyType: 'powertrain', timeLimitYears: 6, mileageLimit: 70000 },
  ],
  
  // GM (Chevrolet, GMC, Cadillac, Buick) - 3yr/36k basic, 5yr/60k powertrain
  'chevrolet': [
    { warrantyType: 'bumper', timeLimitYears: 3, mileageLimit: 36000 },
    { warrantyType: 'powertrain', timeLimitYears: 5, mileageLimit: 60000 },
  ],
  'gmc': [
    { warrantyType: 'bumper', timeLimitYears: 3, mileageLimit: 36000 },
    { warrantyType: 'powertrain', timeLimitYears: 5, mileageLimit: 60000 },
  ],
  'cadillac': [
    { warrantyType: 'bumper', timeLimitYears: 4, mileageLimit: 50000 },
    { warrantyType: 'powertrain', timeLimitYears: 6, mileageLimit: 70000 },
  ],
  'buick': [
    { warrantyType: 'bumper', timeLimitYears: 4, mileageLimit: 50000 },
    { warrantyType: 'powertrain', timeLimitYears: 6, mileageLimit: 70000 },
  ],
  
  // Stellantis (Chrysler, Dodge, Jeep, Ram) - 3yr/36k basic, 5yr/60k powertrain
  'chrysler': [
    { warrantyType: 'bumper', timeLimitYears: 3, mileageLimit: 36000 },
    { warrantyType: 'powertrain', timeLimitYears: 5, mileageLimit: 60000 },
  ],
  'dodge': [
    { warrantyType: 'bumper', timeLimitYears: 3, mileageLimit: 36000 },
    { warrantyType: 'powertrain', timeLimitYears: 5, mileageLimit: 60000 },
  ],
  'jeep': [
    { warrantyType: 'bumper', timeLimitYears: 3, mileageLimit: 36000 },
    { warrantyType: 'powertrain', timeLimitYears: 5, mileageLimit: 60000 },
  ],
  'ram': [
    { warrantyType: 'bumper', timeLimitYears: 3, mileageLimit: 36000 },
    { warrantyType: 'powertrain', timeLimitYears: 5, mileageLimit: 60000 },
  ],
  
  // Nissan/Infiniti (3yr/36k basic, 5yr/60k powertrain)
  'nissan': [
    { warrantyType: 'bumper', timeLimitYears: 3, mileageLimit: 36000 },
    { warrantyType: 'powertrain', timeLimitYears: 5, mileageLimit: 60000 },
  ],
  'infiniti': [
    { warrantyType: 'bumper', timeLimitYears: 4, mileageLimit: 60000 },
    { warrantyType: 'powertrain', timeLimitYears: 6, mileageLimit: 70000 },
  ],
  
  // Hyundai/Kia/Genesis (5yr/60k basic, 10yr/100k powertrain)
  'hyundai': [
    { warrantyType: 'bumper', timeLimitYears: 5, mileageLimit: 60000 },
    { warrantyType: 'powertrain', timeLimitYears: 10, mileageLimit: 100000 },
  ],
  'kia': [
    { warrantyType: 'bumper', timeLimitYears: 5, mileageLimit: 60000 },
    { warrantyType: 'powertrain', timeLimitYears: 10, mileageLimit: 100000 },
  ],
  'genesis': [
    { warrantyType: 'bumper', timeLimitYears: 5, mileageLimit: 60000 },
    { warrantyType: 'powertrain', timeLimitYears: 10, mileageLimit: 100000 },
  ],
  
  // Mazda (3yr/36k basic, 5yr/60k powertrain)
  'mazda': [
    { warrantyType: 'bumper', timeLimitYears: 3, mileageLimit: 36000 },
    { warrantyType: 'powertrain', timeLimitYears: 5, mileageLimit: 60000 },
  ],
  
  // Subaru (3yr/36k basic, 5yr/60k powertrain)
  'subaru': [
    { warrantyType: 'bumper', timeLimitYears: 3, mileageLimit: 36000 },
    { warrantyType: 'powertrain', timeLimitYears: 5, mileageLimit: 60000 },
  ],
  
  // Volkswagen/Audi/Porsche (4yr/50k)
  'volkswagen': [
    { warrantyType: 'bumper', timeLimitYears: 4, mileageLimit: 50000 },
    { warrantyType: 'powertrain', timeLimitYears: 4, mileageLimit: 50000 },
  ],
  'audi': [
    { warrantyType: 'bumper', timeLimitYears: 4, mileageLimit: 50000 },
    { warrantyType: 'powertrain', timeLimitYears: 4, mileageLimit: 50000 },
  ],
  'porsche': [
    { warrantyType: 'bumper', timeLimitYears: 4, mileageLimit: 50000 },
    { warrantyType: 'powertrain', timeLimitYears: 4, mileageLimit: 50000 },
  ],
  
  // BMW/Mini/Mercedes (4yr/50k)
  'bmw': [
    { warrantyType: 'bumper', timeLimitYears: 4, mileageLimit: 50000 },
    { warrantyType: 'powertrain', timeLimitYears: 4, mileageLimit: 50000 },
  ],
  'mini': [
    { warrantyType: 'bumper', timeLimitYears: 4, mileageLimit: 50000 },
    { warrantyType: 'powertrain', timeLimitYears: 4, mileageLimit: 50000 },
  ],
  'mercedes-benz': [
    { warrantyType: 'bumper', timeLimitYears: 4, mileageLimit: 50000 },
    { warrantyType: 'powertrain', timeLimitYears: 4, mileageLimit: 50000 },
  ],
  
  // Tesla (4yr/50k basic, 8yr/120-150k battery depending on model)
  'tesla': [
    { warrantyType: 'bumper', timeLimitYears: 4, mileageLimit: 50000 },
    { warrantyType: 'battery', timeLimitYears: 8, mileageLimit: 120000 },
  ],
  
  // Rivian (5yr/60k basic, 8yr/175k battery)
  'rivian': [
    { warrantyType: 'bumper', timeLimitYears: 5, mileageLimit: 60000 },
    { warrantyType: 'battery', timeLimitYears: 8, mileageLimit: 175000 },
  ],
  
  // Default fallback for unlisted makes (3yr/36k basic, 5yr/60k powertrain)
  'default': [
    { warrantyType: 'bumper', timeLimitYears: 3, mileageLimit: 36000 },
    { warrantyType: 'powertrain', timeLimitYears: 5, mileageLimit: 60000 },
  ],
};

// Add hybrid/EV battery warranty based on fuel type
function augmentRulesForPowertrain(
  rules: WarrantyRule[],
  fuelType: 'gasoline' | 'diesel' | 'electric' | 'hybrid'
): WarrantyRule[] {
  const augmented = [...rules];
  
  // Add battery warranty for hybrids and EVs if not already present
  const hasBatteryWarranty = rules.some(r => r.warrantyType === 'battery');
  
  if (!hasBatteryWarranty) {
    if (fuelType === 'electric') {
      augmented.push({ warrantyType: 'battery', timeLimitYears: 8, mileageLimit: 160000 });
    } else if (fuelType === 'hybrid') {
      augmented.push({ warrantyType: 'battery', timeLimitYears: 8, mileageLimit: 160000 });
    }
  }
  
  return augmented;
}

// Estimate in-service date if not provided
// CRITICAL FIX: Use safe midpoint estimate (July 1st) instead of January 1st
// This prevents overestimating remaining warranty for recent model years
function estimateInServiceDate(modelYear: number): Date {
  // Safe assumption: July 1st of model year (middle of calendar year)
  // Rationale: Model years typically launch in fall of prior year,
  // but most sales occur spring/summer. July 1st is a conservative midpoint.
  return new Date(modelYear, 6, 1); // Month 6 = July (0-indexed)
}

// Calculate warranty remaining
export function calculateWarrantyEstimates(input: VehicleWarrantyInput): WarrantyEstimate[] {
  const make = input.make;
  const modelYear = input.year;
  
  // Defensive: Validate inputs
  if (!make || typeof modelYear !== 'number' || typeof input.currentMileage !== 'number') {
    return [];
  }
  
  // Try to get warranty data from authoritative dataset
  let rules = getWarrantyData(make, modelYear);
  
  // Fallback to hardcoded rules if dataset doesn't have this make/year
  if (!rules) {
    const makeKey = make.toLowerCase();
    rules = warrantyRules[makeKey] || warrantyRules['default'];
    // Augment rules based on powertrain type
    rules = augmentRulesForPowertrain(rules, input.fuelType);
  }
  
  // CRITICAL: Flag whether in-service date is known or estimated
  const inServiceDateKnown = !!input.inServiceDate;
  
  const now = new Date();
  const estimates: WarrantyEstimate[] = [];
  
  for (const rule of rules) {
    // Defensive: Skip if rule is malformed
    if (typeof rule.timeLimitYears !== 'number' || typeof rule.mileageLimit !== 'number') {
      continue;
    }
    
    const totalWarrantyMonths = rule.timeLimitYears * 12;
    
    // CRITICAL FIX: Mileage remaining calculation (strict cap enforcement)
    // remaining_miles = MAX(0, warranty_mileage_limit − current_mileage)
    const mileageRemaining = Math.max(0, rule.mileageLimit - input.currentMileage);
    
    // TIME CALCULATION: Different logic based on whether in-service date is known
    if (inServiceDateKnown) {
      // Known in-service date: Calculate single remaining time value
      const monthsSinceInService = (now.getTime() - input.inServiceDate!.getTime()) / (1000 * 60 * 60 * 24 * 30.44);
      const timeRemainingMonths = Math.max(0, totalWarrantyMonths - monthsSinceInService);
      
      // CRITICAL FIX: Warranty is expired if EITHER time OR mileage has run out
      const isActive = timeRemainingMonths > 0 && mileageRemaining > 0;
      const status: 'active' | 'expired' = isActive ? 'active' : 'expired';
      
      const monthsPerMile = totalWarrantyMonths / rule.mileageLimit;
      const mileageEquivalentMonths = mileageRemaining * monthsPerMile;
      
      // CRITICAL FIX: expiresFirst logic - conservative estimation
      // For expired warranties, short-circuit based on what expired
      const expiresFirst: 'time' | 'mileage' = !isActive
        ? mileageRemaining <= 0
          ? 'mileage'
          : 'time'
        : timeRemainingMonths < mileageEquivalentMonths
          ? 'time'
          : 'mileage';
      
      // Development-only invariant check
      if (process.env.NODE_ENV === 'development') {
        if (isActive && mileageRemaining <= 0) {
          console.warn('Invariant violated: active warranty with zero mileage', { rule, mileageRemaining });
        }
        if (isActive && timeRemainingMonths <= 0) {
          console.warn('Invariant violated: active warranty with zero time', { rule, timeRemainingMonths });
        }
      }
      
      // CRITICAL FIX: Include expired warranties in output for display
      estimates.push({
        type: rule.warrantyType,
        status,
        timeRemainingMonths: Math.round(timeRemainingMonths),
        mileageRemaining: Math.round(mileageRemaining),
        isActive,
        expiresFirst,
        inServiceDateKnown: true,
      });
    } else {
      // Unknown in-service date: Calculate range based on earliest/latest possible dates
      // Earliest: January 1 of model year
      // Latest: December 31 of model year
      const earliestInService = new Date(modelYear, 0, 1);
      const latestInService = new Date(modelYear, 11, 31);
      
      const monthsSinceEarliest = (now.getTime() - earliestInService.getTime()) / (1000 * 60 * 60 * 24 * 30.44);
      const monthsSinceLatest = (now.getTime() - latestInService.getTime()) / (1000 * 60 * 60 * 24 * 30.44);
      
      const timeRemainingMin = Math.max(0, totalWarrantyMonths - monthsSinceEarliest);
      const timeRemainingMax = Math.max(0, totalWarrantyMonths - monthsSinceLatest);
      
      // CRITICAL FIX: Coverage is expired if EITHER time OR mileage has run out
      // Time is expired if even the max (latest in-service) is <= 0
      const isActive = timeRemainingMax > 0 && mileageRemaining > 0;
      const status: 'active' | 'expired' = isActive ? 'active' : 'expired';
      
      // CRITICAL FIX: Use conservative time value for expiry determination
      // Always use minimum of timeRangeMonths (most conservative estimate)
      const conservativeTime = timeRemainingMin;
      const monthsPerMile = totalWarrantyMonths / rule.mileageLimit;
      const mileageEquivalentMonths = mileageRemaining * monthsPerMile;
      
      // CRITICAL FIX: expiresFirst logic - conservative estimation
      // For expired warranties, short-circuit based on what expired
      const expiresFirst: 'time' | 'mileage' = !isActive
        ? mileageRemaining <= 0
          ? 'mileage'
          : 'time'
        : conservativeTime < mileageEquivalentMonths
          ? 'time'
          : 'mileage';
      
      // Development-only invariant check
      if (process.env.NODE_ENV === 'development') {
        if (isActive && mileageRemaining <= 0) {
          console.warn('Invariant violated: active warranty with zero mileage', { rule, mileageRemaining });
        }
        if (isActive && timeRemainingMax <= 0) {
          console.warn('Invariant violated: active warranty with zero time', { rule, timeRemainingMax });
        }
      }
      
      // CRITICAL FIX: Include expired warranties in output for display
      estimates.push({
        type: rule.warrantyType,
        status,
        timeRangeMonths: [Math.round(timeRemainingMin), Math.round(timeRemainingMax)],
        mileageRemaining: Math.round(mileageRemaining),
        isActive,
        expiresFirst,
        inServiceDateKnown: false,
      });
    }
  }
  
  return estimates;
}

// Get primary warranty summary (shortest remaining)
export function getPrimaryWarrantySummary(estimates: WarrantyEstimate[]): WarrantyEstimate | null {
  if (estimates.length === 0) return null;
  
  // Only consider active warranties
  const active = estimates.filter(e => e.status === 'active');
  if (active.length === 0) return null;
  
  // Return the warranty with the shortest combined time/mileage remaining (most restrictive)
  return active.reduce((shortest, current) => {
    // CRITICAL FIX: Use conservative time value (minimum of range for unknown dates)
    const shortestTime = shortest.inServiceDateKnown 
      ? shortest.timeRemainingMonths! 
      : shortest.timeRangeMonths![0]; // Use MIN, not MAX
    const currentTime = current.inServiceDateKnown 
      ? current.timeRemainingMonths! 
      : current.timeRangeMonths![0]; // Use MIN, not MAX
    
    // Compare based on which expires first (most restrictive)
    const shortestScore = Math.min(shortestTime / 12, shortest.mileageRemaining / 10000);
    const currentScore = Math.min(currentTime / 12, current.mileageRemaining / 10000);
    return currentScore < shortestScore ? current : shortest;
  });
}

// GLOBAL HELPER: Check if vehicle has ANY active warranty coverage
export function hasAnyActiveWarranty(estimates: WarrantyEstimate[]): boolean {
  return estimates.some(estimate => estimate.status === 'active');
}

// GLOBAL HELPER: Get only active warranties (for View B)
export function getActiveWarranties(estimates: WarrantyEstimate[]): WarrantyEstimate[] {
  return estimates.filter(estimate => estimate.status === 'active');
}

// GLOBAL HELPER: Check if ALL warranties are expired
export function allWarrantiesExpired(estimates: WarrantyEstimate[]): boolean {
  if (estimates.length === 0) return true;
  return estimates.every(estimate => estimate.status === 'expired');
}

// Generate concise warranty summary for collapsed views
// ABSOLUTE RULES:
// 1. Only active warranties may be summarized
// 2. If all warranties are expired, return null
// 3. Never show "Factory warranty available" fallback
// 4. Never show "0–0 months" or zero values
// 5. Use conservative estimates (minimum of range)
export function getWarrantySummaryText(estimates: WarrantyEstimate[]): string | null {
  if (estimates.length === 0 || allWarrantiesExpired(estimates)) {
    return null;
  }

  // Get only active warranties
  const activeEstimates = getActiveWarranties(estimates);
  if (activeEstimates.length === 0) return null;

  const primary = getPrimaryWarrantySummary(activeEstimates);
  if (!primary || primary.status !== 'active') return null;

  const parts: string[] = [];

  // Add time component if active and valid
  if (primary.timeRemainingMonths !== undefined && primary.timeRemainingMonths > 0) {
    parts.push(`${primary.timeRemainingMonths} mo`);
  } else if (primary.timeRangeMonths) {
    // CRITICAL FIX: Use conservative estimate (minimum of range)
    const minTime = primary.timeRangeMonths[0];
    const maxTime = primary.timeRangeMonths[1];
    
    // Never show if max is 0 (expired)
    if (maxTime > 0) {
      // Show range if min is also positive, otherwise show "up to max"
      if (minTime > 0) {
        parts.push(`${minTime}–${maxTime} mo`);
      } else {
        // minTime is 0, maxTime > 0 (could expire any day)
        parts.push(`up to ${maxTime} mo`);
      }
    }
    // If both are 0, don't add time component
  }

  // Add mileage component if active and valid
  if (primary.mileageRemaining > 0) {
    const miles = Math.round(primary.mileageRemaining / 1000);
    // Never show 0k mi
    if (miles > 0) {
      parts.push(`${miles}k mi`);
    }
  }

  // If we have both components
  if (parts.length === 2) {
    return `~${parts[0]} / ~${parts[1]} remaining`;
  }

  // If we have only one component
  if (parts.length === 1) {
    return `~${parts[0]} remaining`;
  }

  // If no valid parts, return null (should not happen if primary is active)
  return null;
}
