/**
 * Marketplace Mode Filtering
 * 
 * Determines vehicle eligibility for each marketplace mode
 * Vehicles can only appear in ONE mode at a time
 */

import { Vehicle, MarketplaceMode, IssueSeverity, IntendedUse } from '@/types';

/**
 * Check if a vehicle qualifies for Road Ready mode
 * 
 * Requirements:
 * - running = true
 * - inspection_uploaded = true
 * - issue_severity <= minor
 */
export function isRoadReady(vehicle: Vehicle): boolean {
  return (
    vehicle.running === true &&
    vehicle.inspectionUploaded === true &&
    (vehicle.issueSeverity === 'none' || vehicle.issueSeverity === 'minor')
  );
}

/**
 * Check if a vehicle qualifies for Near Road Ready mode
 * 
 * Requirements:
 * - running = true
 * - inspection_uploaded optional
 * - issue_severity = minor
 * - estimated_fixes_required = true
 */
export function isNearRoadReady(vehicle: Vehicle): boolean {
  return (
    vehicle.running === true &&
    vehicle.issueSeverity === 'minor' &&
    vehicle.estimatedFixesRequired === true
  );
}

/**
 * Check if a vehicle qualifies for Builder's Market mode
 * 
 * Requirements (any of):
 * - running = false
 * - inspection_uploaded = false
 * - intended_use IN (export, restoration, parts, track)
 */
export function isBuildersMarket(vehicle: Vehicle): boolean {
  const builderIntendedUses: IntendedUse[] = ['export', 'restoration', 'parts', 'track'];
  
  return (
    vehicle.running === false ||
    vehicle.inspectionUploaded === false ||
    (vehicle.intendedUse && builderIntendedUses.includes(vehicle.intendedUse))
  );
}

/**
 * Determine which marketplace mode a vehicle belongs to
 * Vehicles are assigned to ONLY ONE mode, with priority:
 * 1. Builder's Market (if disqualified from others)
 * 2. Road Ready (if fully qualified)
 * 3. Near Road Ready (if needs minor fixes)
 * 4. Builder's Market (fallback)
 */
export function getVehicleMarketplaceMode(vehicle: Vehicle): MarketplaceMode {
  // Builder's Market takes precedence for disqualified vehicles
  if (isBuildersMarket(vehicle)) {
    return 'builders-market';
  }
  
  // Road Ready if fully qualified
  if (isRoadReady(vehicle)) {
    return 'road-ready';
  }
  
  // Near Road Ready if running but needs fixes
  if (isNearRoadReady(vehicle)) {
    return 'near-road-ready';
  }
  
  // Default to Builder's Market for anything else
  return 'builders-market';
}

/**
 * Filter vehicles by marketplace mode
 * Ensures strict separation - vehicles appear in only ONE mode
 */
export function filterVehiclesByMode(
  vehicles: Vehicle[],
  mode: MarketplaceMode
): Vehicle[] {
  return vehicles.filter(vehicle => {
    const vehicleMode = getVehicleMarketplaceMode(vehicle);
    return vehicleMode === mode;
  });
}

/**
 * Check if personalization should apply to this mode
 * Only Road Ready and Near Road Ready use preference scoring
 * Builder's Market uses deterministic sorting only
 */
export function shouldApplyPersonalization(mode: MarketplaceMode): boolean {
  return mode === 'road-ready' || mode === 'near-road-ready';
}

/**
 * Validate vehicle data for marketplace mode assignment
 */
export function validateVehicleForMode(vehicle: Vehicle): {
  valid: boolean;
  errors: string[];
  suggestedMode: MarketplaceMode;
} {
  const errors: string[] = [];
  
  // Check required fields
  if (vehicle.running === undefined) {
    errors.push('running status is required');
  }
  
  if (vehicle.inspectionUploaded === undefined) {
    errors.push('inspection upload status is required');
  }
  
  if (!vehicle.issueSeverity) {
    errors.push('issue severity is required');
  }
  
  const suggestedMode = getVehicleMarketplaceMode(vehicle);
  
  return {
    valid: errors.length === 0,
    errors,
    suggestedMode
  };
}
