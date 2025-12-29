/**
 * Publish Flow State Assignment Logic
 * Server-side enforcement of road readiness states
 */

import { PublishFlowData, StateAssignmentExplanation } from '@/types/publish-flow';
import { 
  RoadReadinessState, 
  ROAD_READINESS_STATES 
} from '@/lib/marketplace/roadReadinessStates';

/**
 * Determine road readiness state based on publish flow data
 * CRITICAL: This logic runs server-side and cannot be overridden
 */
export function assignRoadReadinessState(
  data: PublishFlowData
): StateAssignmentExplanation {
  const { isRunning, isDrivable, isLegallyOperable, inspectionStatus, issueSeverity } = data;
  
  // Builder's Market: Major issues OR not running OR not drivable OR not legal
  if (
    issueSeverity === 'major' ||
    !isRunning ||
    !isDrivable ||
    !isLegallyOperable
  ) {
    return {
      state: ROAD_READINESS_STATES.BUILDERS_MARKET,
      reason: 'Vehicle does not meet road-ready requirements',
      requirements: [
        issueSeverity === 'major' ? '❌ Major issues present' : '✓ No major issues',
        isRunning ? '✓ Vehicle is running' : '❌ Vehicle is not running',
        isDrivable ? '✓ Vehicle is drivable' : '❌ Vehicle is not drivable',
        isLegallyOperable ? '✓ Legally operable' : '❌ Not legally operable'
      ],
      improvementSteps: [
        'Repair all major mechanical issues',
        'Ensure vehicle is running and drivable',
        'Complete all required safety and emissions inspections',
        'Re-publish after improvements'
      ]
    };
  }
  
  // Carly Verified: Running + Drivable + Legal + Inspection + No/Minor issues only
  if (
    isRunning &&
    isDrivable &&
    isLegallyOperable &&
    (inspectionStatus === 'verified' || inspectionStatus === 'uploaded') &&
    (issueSeverity === 'none' || issueSeverity === 'minor')
  ) {
    return {
      state: ROAD_READINESS_STATES.CARLY_VERIFIED,
      reason: 'Vehicle meets all Carly Verified requirements',
      requirements: [
        '✓ Vehicle is running',
        '✓ Vehicle is drivable',
        '✓ Legally operable on public roads',
        '✓ Inspection verified/uploaded',
        issueSeverity === 'none' ? '✓ No known issues' : '✓ Only minor issues'
      ]
    };
  }
  
  // The Hub: Everything else (running, drivable, legal but missing inspection or has minor issues)
  return {
    state: ROAD_READINESS_STATES.THE_HUB,
    reason: 'Vehicle is operational but not fully Carly Verified',
    requirements: [
      '✓ Vehicle is running',
      '✓ Vehicle is drivable',
      '✓ Legally operable on public roads',
      inspectionStatus === 'verified' || inspectionStatus === 'uploaded' 
        ? '✓ Inspection verified/uploaded' 
        : '⚠️ No inspection available',
      issueSeverity === 'none' ? '✓ No known issues' : '⚠️ Minor issues present'
    ],
    improvementSteps: inspectionStatus === 'none' 
      ? [
          'Upload a valid inspection document',
          'Re-publish to achieve Carly Verified status'
        ]
      : undefined
  };
}

/**
 * Validate that all required steps are completed
 */
export function validatePublishFlowCompletion(data: PublishFlowData): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  // Step 1: Vehicle Condition
  if (data.isRunning === null) {
    errors.push('Please indicate if the vehicle is currently running');
  }
  if (data.isDrivable === null) {
    errors.push('Please indicate if the vehicle is drivable today');
  }
  if (data.isLegallyOperable === null) {
    errors.push('Please indicate if the vehicle is legally operable on public roads');
  }
  
  // Step 2: Inspection
  if (!data.inspectionStatus) {
    errors.push('Please provide inspection status');
  }
  
  // Step 3: Known Issues
  if (!data.issueSeverity) {
    errors.push('Please indicate issue severity');
  }
  if (data.issueSeverity && data.issueSeverity !== 'none' && !data.issueDescription) {
    errors.push('Please provide a description of known issues');
  }
  
  // Step 5: Acknowledgement
  if (!data.acknowledgementConfirmed) {
    errors.push('You must confirm the accuracy of the information provided');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}
