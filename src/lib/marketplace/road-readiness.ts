/**
 * Road Readiness State Determination
 * Server-side logic for unified marketplace
 */

import { IssueSeverity, IntendedUse } from '@/types';
import { 
  RoadReadinessState, 
  ROAD_READINESS_STATES,
  getStateExplanation,
  getStateRankingScore,
  qualifiesAsNewInventory
} from '@/lib/marketplace/roadReadinessStates';

export interface VehicleConditionData {
  running: boolean;
  inspectionUploaded: boolean;
  issueSeverity: IssueSeverity;
  intendedUse?: IntendedUse[];
  // New Inventory detection
  condition?: string;
  mileage?: number;
  sellerType?: 'private' | 'dealer';
  explicitlyMarkedNew?: boolean;
}

/**
 * CRITICAL: Server-side determination of road readiness state
 * Sellers cannot manually override this
 */
export function determineRoadReadinessState(
  data: VehicleConditionData
): RoadReadinessState {
  const { 
    running, 
    inspectionUploaded, 
    issueSeverity, 
    intendedUse,
    condition,
    mileage,
    sellerType,
    explicitlyMarkedNew
  } = data;
  
  // FIRST: Check if vehicle qualifies as New Inventory
  if (condition && mileage !== undefined && sellerType) {
    const isNewInventory = qualifiesAsNewInventory({
      condition,
      mileage,
      sellerType,
      explicitlyMarkedNew
    });
    
    if (isNewInventory) {
      return ROAD_READINESS_STATES.NEW_INVENTORY;
    }
  }
  
  // Builder's Market if:
  // - Not running
  // - OR no inspection AND has builder intent
  // - OR major/critical issues
  const builderIntents: IntendedUse[] = ['export', 'restoration', 'parts', 'track'];
  const hasBuilderIntent = intendedUse?.some(use => builderIntents.includes(use));
  
  if (
    !running ||
    (!inspectionUploaded && hasBuilderIntent) ||
    issueSeverity === 'major' ||
    issueSeverity === 'critical'
  ) {
    return ROAD_READINESS_STATES.BUILDERS_MARKET;
  }
  
  // Carly Verified if:
  // - Running
  // - Has inspection
  // - No issues or minor only
  if (
    running &&
    inspectionUploaded &&
    (issueSeverity === 'none' || issueSeverity === 'minor')
  ) {
    return ROAD_READINESS_STATES.CARLY_VERIFIED;
  }
  
  // The Hub (default for in-between states)
  return ROAD_READINESS_STATES.THE_HUB;
}

// Re-export from single source of truth
export { getStateExplanation, getStateRankingScore };

/**
 * Check if state should influence personalization
 */
export function shouldInfluencePersonalization(state: RoadReadinessState): boolean {
  // Builder's Market only influences if saved/engaged
  return state !== ROAD_READINESS_STATES.BUILDERS_MARKET;
}

