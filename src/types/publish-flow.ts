/**
 * Publish to Marketplace Flow Types
 */

import { RoadReadinessState } from './index';

export interface PublishFlowData {
  // Step 1: Vehicle Condition
  isRunning: boolean | null;
  isDrivable: boolean | null;
  isLegallyOperable: boolean | null;
  
  // Step 2: Inspection & Documentation
  inspectionStatus: 'verified' | 'uploaded' | 'none' | null;
  inspectionFile?: File;
  inspectionFileUrl?: string;
  
  // Step 3: Known Issues Disclosure
  issueSeverity: 'none' | 'minor' | 'major' | null;
  issueDescription?: string;
  
  // Step 4: Final State Review (computed)
  assignedState?: RoadReadinessState;
  
  // Step 5: User Acknowledgement
  acknowledgementConfirmed: boolean;
  acknowledgementTimestamp?: string;
}

export interface PublishFlowStep {
  number: 1 | 2 | 3 | 4 | 5;
  title: string;
  completed: boolean;
}

export interface StateAssignmentExplanation {
  state: RoadReadinessState;
  reason: string;
  requirements: string[];
  improvementSteps?: string[];
}
