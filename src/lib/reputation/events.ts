import type { EventType, VerificationMethod, ReviewStage } from '@/types/reputation';
import { reputationDb } from './db';

export interface RecordEventParams {
  dealershipId: string;
  staffId?: string;
  userId: string;
  eventType: EventType;
  verificationMethod: VerificationMethod;
  metadata?: Record<string, any>;
  occurredAt?: Date;
}

export async function recordInteractionEvent(params: RecordEventParams) {
  const event = await reputationDb.createInteractionEvent({
    dealership_id: params.dealershipId,
    staff_id: params.staffId || null,
    user_id: params.userId,
    event_type: params.eventType,
    occurred_at: params.occurredAt || new Date(),
    verification_method: params.verificationMethod,
    metadata: params.metadata || {},
  });

  return event;
}

export interface ReviewEligibility {
  eligible: boolean;
  highestVerifiedStage: ReviewStage | null;
  eligibleEvents: Array<{
    id: string;
    event_type: EventType;
    stage: ReviewStage;
    occurred_at: Date;
    hasReview: boolean;
  }>;
}

const EVENT_TO_STAGE: Record<EventType, ReviewStage> = {
  A_APPOINTMENT_CONFIRMED: 'A',
  B_TEST_DRIVE_CONFIRMED: 'B',
  C_FINANCE_SESSION_CONFIRMED: 'C',
  D_PURCHASE_CONFIRMED: 'D',
  E_DELIVERY_CONFIRMED: 'E',
};

const STAGE_ORDER = ['A', 'B', 'C', 'D', 'E'];

export async function validateReviewEligibility(
  userId: string,
  dealershipId: string
): Promise<ReviewEligibility> {
  const events = await reputationDb.getInteractionEventsByUser(userId, dealershipId);

  if (events.length === 0) {
    return {
      eligible: false,
      highestVerifiedStage: null,
      eligibleEvents: [],
    };
  }

  const eligibleEvents = await Promise.all(
    events.map(async (event) => {
      const existingReview = await reputationDb.getUserReviewForEvent(userId, event.id);
      return {
        id: event.id,
        event_type: event.event_type,
        stage: EVENT_TO_STAGE[event.event_type],
        occurred_at: event.occurred_at,
        hasReview: !!existingReview,
      };
    })
  );

  const stages = eligibleEvents.map((e) => e.stage);
  const highestStage = STAGE_ORDER.filter((s) => stages.includes(s as ReviewStage)).pop() as
    | ReviewStage
    | undefined;

  return {
    eligible: true,
    highestVerifiedStage: highestStage || null,
    eligibleEvents,
  };
}

export function getStageFromEventType(eventType: EventType): ReviewStage {
  return EVENT_TO_STAGE[eventType];
}
