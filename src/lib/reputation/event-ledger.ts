/**
 * CARLY REPUTATION EVENT LEDGER v1.0
 * 
 * Immutable, append-only event log as the single source of truth for reputation calculation.
 * Every meaningful dealer/agent action is recorded here.
 * 
 * NO DERIVED METRICS - All reputation math computed from this ledger.
 */

export type ReputationEventType =
  // Messaging
  | 'MESSAGE_SENT'
  | 'MESSAGE_RECEIVED'
  | 'MESSAGE_FIRST_REPLY'
  
  // Appointments
  | 'APPOINTMENT_PROPOSED'
  | 'APPOINTMENT_CONFIRMED'
  | 'APPOINTMENT_ATTENDED'
  | 'APPOINTMENT_NO_SHOW_BUYER'
  | 'APPOINTMENT_NO_SHOW_DEALER'
  | 'APPOINTMENT_CANCELLED_BUYER'
  | 'APPOINTMENT_CANCELLED_DEALER'
  
  // Listings
  | 'LISTING_CREATED'
  | 'LISTING_VIEW'
  | 'LISTING_SAVE'
  | 'LISTING_EDIT'
  | 'LISTING_VIN_MISMATCH'
  | 'LISTING_MISLEADING_EDIT'
  
  // Disputes
  | 'DISPUTE_OPENED'
  | 'DISPUTE_RESOLVED'
  | 'DISPUTE_ESCALATED'
  
  // Outcomes
  | 'DEAL_COMPLETED'
  | 'VERIFIED_REVIEW_SUBMITTED'
  
  // Trust & Safety
  | 'SAFETY_VIOLATION'
  | 'INTEGRITY_VIOLATION';

export interface ReputationEvent {
  id: string;
  dealershipId: string;
  agentId: string | null; // null if dealership-level action
  buyerId: string | null;
  listingId: string | null;
  conversationId: string | null;
  appointmentId: string | null;
  type: ReputationEventType;
  timestamp: Date;
  metadata: Record<string, any>; // Type-safe payload per event type
  severity?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'; // For violations
}

/**
 * Event metadata schemas by type
 */
export interface EventMetadata {
  MESSAGE_FIRST_REPLY: {
    responseTimeMinutes: number;
  };
  
  APPOINTMENT_PROPOSED: {
    proposedSlots: string[];
  };
  
  APPOINTMENT_NO_SHOW_DEALER: {
    scheduledTime: string;
    notificationSent: boolean;
  };
  
  LISTING_VIN_MISMATCH: {
    declaredVIN: string;
    actualVIN: string;
    source: string;
  };
  
  DISPUTE_OPENED: {
    category: string;
    description: string;
  };
  
  DISPUTE_RESOLVED: {
    resolutionTimeHours: number;
    resolutionType: 'DEALER_ACTION' | 'MUTUAL' | 'ESCALATED';
  };
  
  VERIFIED_REVIEW_SUBMITTED: {
    stars: number;
    comment: string;
    verificationLevel: 'APPOINTMENT' | 'TEST_DRIVE' | 'PURCHASE';
  };
  
  SAFETY_VIOLATION: {
    violationType: string;
    details: string;
  };
}

/**
 * Append event to ledger
 * MUST be called for every reputation-relevant action
 */
export async function appendReputationEvent(
  event: Omit<ReputationEvent, 'id' | 'timestamp'>
): Promise<ReputationEvent> {
  const fullEvent: ReputationEvent = {
    ...event,
    id: generateEventId(),
    timestamp: new Date(),
  };

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // PHASE 2: Replace with actual database insert
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // await prisma.reputationEventLedger.create({ data: fullEvent });
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  return fullEvent;
}

/**
 * Query events for reputation calculation
 */
export async function queryReputationEvents(
  dealershipId: string,
  options?: {
    agentId?: string;
    eventTypes?: ReputationEventType[];
    startDate?: Date;
    endDate?: Date;
  }
): Promise<ReputationEvent[]> {
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // PHASE 2: Replace with actual database query
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // return await prisma.reputationEventLedger.findMany({
  //   where: {
  //     dealershipId,
  //     agentId: options?.agentId,
  //     type: options?.eventTypes ? { in: options.eventTypes } : undefined,
  //     timestamp: {
  //       gte: options?.startDate,
  //       lte: options?.endDate,
  //     },
  //   },
  //   orderBy: { timestamp: 'desc' },
  // });
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  // Stub implementation for production build
  return [];
}

function generateEventId(): string {
  return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
