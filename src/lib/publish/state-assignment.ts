/**
 * Road Readiness State Assignment Logic
 * Server-side determination based on publish flow inputs
 */

import { PublishFlowData, StateAssignmentExplanation } from '@/types/publish-flow';
import { 
  RoadReadinessState, 
  ROAD_READINESS_STATES,
  qualifiesAsNewInventory
} from '@/lib/marketplace/roadReadinessStates';

/**
 * Determine road readiness state from publish flow inputs
 * CRITICAL: Server-side only, cannot be overridden by user
 */
export function assignRoadReadinessState(
  data: PublishFlowData,
  vehicleData?: {
    condition: string;
    mileage: number;
    sellerType: 'private' | 'dealer';
    explicitlyMarkedNew?: boolean;
  }
): RoadReadinessState {
  const { isRunning, isDrivable, isLegallyOperable, inspectionStatus, issueSeverity } = data;
  
  // FIRST: Check if vehicle qualifies as New Inventory
  if (vehicleData) {
    const isNewInventory = qualifiesAsNewInventory(vehicleData);
    if (isNewInventory) {
      return ROAD_READINESS_STATES.NEW_INVENTORY;
    }
  }
  
  // Builder's Market if:
  // - Not running
  // - Not drivable
  // - Not legally operable
  // - Major issues
  if (
    !isRunning ||
    !isDrivable ||
    !isLegallyOperable ||
    issueSeverity === 'major'
  ) {
    return ROAD_READINESS_STATES.BUILDERS_MARKET;
  }
  
  // Carly Verified if:
  // - Running, drivable, legally operable
  // - Has inspection (verified or uploaded)
  // - No issues or minor only
  if (
    isRunning &&
    isDrivable &&
    isLegallyOperable &&
    (inspectionStatus === 'verified' || inspectionStatus === 'uploaded') &&
    (issueSeverity === 'none' || issueSeverity === 'minor')
  ) {
    return ROAD_READINESS_STATES.CARLY_VERIFIED;
  }
  
  // The Hub (default for in-between states)
  return ROAD_READINESS_STATES.THE_HUB;
}

/**
 * Generate explanation for assigned state
 */
export function getStateAssignmentExplanation(
  data: PublishFlowData,
  assignedState: RoadReadinessState
): StateAssignmentExplanation {
  const { isRunning, isDrivable, isLegallyOperable, inspectionStatus, issueSeverity } = data;
  
  switch (assignedState) {
    case ROAD_READINESS_STATES.NEW_INVENTORY:
      return {
        state: ROAD_READINESS_STATES.NEW_INVENTORY,
        reason: 'Your vehicle is classified as new inventory.',
        requirements: [
          '✓ New vehicle condition',
          '✓ Low mileage',
          '✓ Dealer listing',
          'ℹ No inspection required'
        ]
      };
    
    case ROAD_READINESS_STATES.CARLY_VERIFIED:
      return {
        state: ROAD_READINESS_STATES.CARLY_VERIFIED,
        reason: 'Your vehicle meets all requirements for Carly Verified status.',
        requirements: [
          '✓ Vehicle is running',
          '✓ Vehicle is drivable',
          '✓ Legally operable on public roads',
          '✓ Inspection uploaded',
          `✓ ${issueSeverity === 'none' ? 'No known issues' : 'Only minor issues'}`
        ]
      };
    
    case ROAD_READINESS_STATES.THE_HUB:
      return {
        state: ROAD_READINESS_STATES.THE_HUB,
        reason: 'Your vehicle is operational but doesn\'t meet all Carly Verified requirements.',
        requirements: [
          `${isRunning ? '✓' : '✗'} Vehicle is running`,
          `${isDrivable ? '✓' : '✗'} Vehicle is drivable`,
          `${isLegallyOperable ? '✓' : '✗'} Legally operable`,
          `${inspectionStatus && inspectionStatus !== 'none' ? '✓' : '✗'} Inspection ${inspectionStatus || 'none'}`,
          `${issueSeverity === 'none' || issueSeverity === 'minor' ? '✓' : '✗'} Issue severity: ${issueSeverity || 'unknown'}`
        ],
        improvementSteps: getImprovementSteps(data, ROAD_READINESS_STATES.CARLY_VERIFIED)
      };
    
    case ROAD_READINESS_STATES.BUILDERS_MARKET:
      return {
        state: ROAD_READINESS_STATES.BUILDERS_MARKET,
        reason: 'Your vehicle is classified for project use, export, or restoration.',
        requirements: [
          `${isRunning ? '✓' : '✗'} Vehicle is running`,
          `${isDrivable ? '✓' : '✗'} Vehicle is drivable`,
          `${isLegallyOperable ? '✓' : '✗'} Legally operable`,
          `Issue severity: ${issueSeverity || 'unknown'}`
        ],
        improvementSteps: getImprovementSteps(data, ROAD_READINESS_STATES.THE_HUB)
      };
  }
}

/**
 * Get improvement steps to reach target state
 */
function getImprovementSteps(
  data: PublishFlowData,
  targetState: RoadReadinessState
): string[] {
  const steps: string[] = [];
  
  if (targetState === ROAD_READINESS_STATES.CARLY_VERIFIED) {
    if (!data.isRunning) {
      steps.push('Get the vehicle running');
    }
    if (!data.isDrivable) {
      steps.push('Make the vehicle drivable');
    }
    if (!data.isLegallyOperable) {
      steps.push('Ensure vehicle is legally operable (registration, safety inspection)');
    }
    if (!data.inspectionStatus || data.inspectionStatus === 'none') {
      steps.push('Upload a valid inspection document');
    }
    if (data.issueSeverity === 'major') {
      steps.push('Address major issues (currently disqualifies from Carly Verified)');
    }
  } else if (targetState === ROAD_READINESS_STATES.THE_HUB) {
    if (!data.isRunning) {
      steps.push('Get the vehicle running');
    }
    if (!data.isDrivable) {
      steps.push('Make the vehicle drivable');
    }
    if (!data.isLegallyOperable) {
      steps.push('Ensure vehicle is legally operable');
    }
  }
  
  return steps;
}

/**
 * Validate publish flow data completeness
 */
export function validatePublishFlowData(data: PublishFlowData): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  // Step 1 validation
  if (data.isRunning === null) {
    errors.push('Vehicle running status is required');
  }
  if (data.isDrivable === null) {
    errors.push('Vehicle drivable status is required');
  }
  if (data.isLegallyOperable === null) {
    errors.push('Vehicle legal operability status is required');
  }
  
  // Step 2 validation
  if (!data.inspectionStatus) {
    errors.push('Inspection status is required');
  }
  
  // Step 3 validation
  if (!data.issueSeverity) {
    errors.push('Issue severity is required');
  }
  if (data.issueSeverity && data.issueSeverity !== 'none' && !data.issueDescription) {
    errors.push('Issue description is required when issues are present');
  }
  
  // Step 5 validation
  if (!data.acknowledgementConfirmed) {
    errors.push('User acknowledgement is required');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}
