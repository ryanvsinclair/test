/**
 * Road Readiness States — Single Source of Truth
 * 
 * CRITICAL: All marketplace condition states MUST use values from this file.
 * No string literals allowed elsewhere in the codebase.
 */

export type RoadReadinessState = 'new_inventory' | 'carly_verified' | 'the_hub' | 'builders_market';

export const ROAD_READINESS_STATES = {
  NEW_INVENTORY: 'new_inventory',
  CARLY_VERIFIED: 'carly_verified',
  THE_HUB: 'the_hub',
  BUILDERS_MARKET: 'builders_market'
} as const;

/**
 * Type guard for RoadReadinessState
 */
export function isRoadReadinessState(x: unknown): x is RoadReadinessState {
  return (
    typeof x === 'string' &&
    (x === ROAD_READINESS_STATES.NEW_INVENTORY ||
     x === ROAD_READINESS_STATES.CARLY_VERIFIED ||
     x === ROAD_READINESS_STATES.THE_HUB ||
     x === ROAD_READINESS_STATES.BUILDERS_MARKET)
  );
}

/**
 * Display labels for UI rendering
 */
export function labelForState(state: RoadReadinessState): string {
  switch (state) {
    case ROAD_READINESS_STATES.NEW_INVENTORY:
      return 'New';
    case ROAD_READINESS_STATES.CARLY_VERIFIED:
      return 'Carly Verified';
    case ROAD_READINESS_STATES.THE_HUB:
      return 'The Hub';
    case ROAD_READINESS_STATES.BUILDERS_MARKET:
      return "Builder's Market";
  }
}

/**
 * Tooltip explanations for each state
 */
export function tooltipForState(state: RoadReadinessState): string {
  switch (state) {
    case ROAD_READINESS_STATES.NEW_INVENTORY:
      return 'New vehicles from dealers. No inspection required.';
    case ROAD_READINESS_STATES.CARLY_VERIFIED:
      return 'Inspection-backed, running, and road-ready vehicles.';
    case ROAD_READINESS_STATES.THE_HUB:
      return 'Running vehicles that may need minor work before full road readiness.';
    case ROAD_READINESS_STATES.BUILDERS_MARKET:
      return 'Project vehicles, non-running, uninspected, or export-only.';
  }
}

/**
 * BACKWARD COMPATIBILITY MAPPER
 * 
 * Maps legacy state values to new canonical values.
 * Use ONLY at input boundaries (DB reads, API payloads).
 * 
 * After migration stabilizes, this can be removed.
 */
export function normalizeRoadReadinessState(x: string): RoadReadinessState {
  // Already normalized - pass through
  if (isRoadReadinessState(x)) {
    return x;
  }
  
  // Legacy mappings
  if (x === 'road_ready') {
    return ROAD_READINESS_STATES.CARLY_VERIFIED;
  }
  
  if (x === 'near_road_ready') {
    return ROAD_READINESS_STATES.THE_HUB;
  }
  
  // Fail-safe: unknown values default to builders_market
  console.warn(`[normalizeRoadReadinessState] Unknown state value: "${x}", defaulting to builders_market`);
  return ROAD_READINESS_STATES.BUILDERS_MARKET;
}

/**
 * Get full state explanation
 */
export function getStateExplanation(state: RoadReadinessState): {
  title: string;
  description: string;
  requirements: string[];
} {
  switch (state) {
    case ROAD_READINESS_STATES.NEW_INVENTORY:
      return {
        title: 'New Inventory',
        description: 'Your vehicle is classified as new inventory. It will appear in the New filter but NOT in Carly Verified.',
        requirements: [
          'Vehicle condition is "new"',
          'Low mileage (< 500 km)',
          'Dealer-listed',
          'No inspection required'
        ]
      };
    
    case ROAD_READINESS_STATES.CARLY_VERIFIED:
      return {
        title: 'Carly Verified',
        description: 'Your vehicle qualifies as Carly Verified and will receive highest ranking in browse.',
        requirements: [
          'Vehicle is running',
          'Inspection uploaded',
          'No issues or minor issues only'
        ]
      };
    
    case ROAD_READINESS_STATES.THE_HUB:
      return {
        title: 'The Hub',
        description: 'Your vehicle is operational but may need minor attention. It will be ranked slightly lower than Carly Verified vehicles.',
        requirements: [
          'Vehicle is running',
          'May have minor issues requiring fixes',
          'Inspection optional but encouraged'
        ]
      };
    
    case ROAD_READINESS_STATES.BUILDERS_MARKET:
      return {
        title: "Builder's Market",
        description: "Your vehicle is classified for project use. It will only appear when buyers explicitly enable Builder's Market filter.",
        requirements: [
          'Vehicle not running OR',
          'No inspection with project intent OR',
          'Major or critical issues'
        ]
      };
  }
}

/**
 * Get ranking score for state (used in sorting/filtering)
 */
export function getStateRankingScore(state: RoadReadinessState): number {
  switch (state) {
    case ROAD_READINESS_STATES.CARLY_VERIFIED:
      return 100;
    case ROAD_READINESS_STATES.NEW_INVENTORY:
      return 80; // Below Carly Verified, separate ranking pool
    case ROAD_READINESS_STATES.THE_HUB:
      return 75;
    case ROAD_READINESS_STATES.BUILDERS_MARKET:
      return 0; // Only shown when explicitly enabled
  }
}

/**
 * Validation: Check if state transition is allowed
 */
export function canTransitionToState(
  fromState: RoadReadinessState,
  toState: RoadReadinessState
): { allowed: boolean; reason?: string } {
  // New Inventory cannot become Carly Verified
  if (fromState === ROAD_READINESS_STATES.NEW_INVENTORY && 
      toState === ROAD_READINESS_STATES.CARLY_VERIFIED) {
    return {
      allowed: false,
      reason: 'New inventory vehicles cannot be marked as Carly Verified'
    };
  }
  
  // Carly Verified cannot become New Inventory
  if (fromState === ROAD_READINESS_STATES.CARLY_VERIFIED && 
      toState === ROAD_READINESS_STATES.NEW_INVENTORY) {
    return {
      allowed: false,
      reason: 'Carly Verified vehicles cannot be reclassified as new inventory'
    };
  }
  
  return { allowed: true };
}

/**
 * Determine if a vehicle qualifies as New Inventory based on condition data
 */
export function qualifiesAsNewInventory(data: {
  condition: string;
  mileage: number;
  sellerType: 'private' | 'dealer';
  explicitlyMarkedNew?: boolean;
}): boolean {
  const NEW_MILEAGE_THRESHOLD = 500; // km
  
  return (
    data.condition === 'new' ||
    (data.mileage < NEW_MILEAGE_THRESHOLD && data.sellerType === 'dealer') ||
    data.explicitlyMarkedNew === true
  );
}
