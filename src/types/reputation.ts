export type EventType =
  | 'A_APPOINTMENT_CONFIRMED'
  | 'B_TEST_DRIVE_CONFIRMED'
  | 'C_FINANCE_SESSION_CONFIRMED'
  | 'D_PURCHASE_CONFIRMED'
  | 'E_DELIVERY_CONFIRMED';

export type VerificationMethod =
  | 'DOUBLE_CONFIRM'
  | 'DOCUMENT_PROOF'
  | 'SYSTEM_LOG'
  | 'OTHER';

export type ReviewStage = 'A' | 'B' | 'C' | 'D' | 'E';

export type ComplaintScope = 'PROCESS' | 'INDIVIDUAL';

export type IssueCategory =
  | 'PAPERWORK'
  | 'MECHANICAL'
  | 'COMMUNICATION'
  | 'DELIVERY'
  | 'PRICING'
  | 'OTHER';

export type IssueStatus = 'OPEN' | 'RESOLVED' | 'DISPUTED' | 'CLOSED';

export type ResolutionOutcome = 'FAIR' | 'PARTIAL' | 'DENIED' | 'UNKNOWN';

export type ExternalSource = 'GOOGLE';

export type ConfidenceLevel = 'LOW' | 'MED' | 'HIGH';

export type StaffRole = 'sales' | 'finance' | 'delivery' | 'manager' | 'other';

export interface Dealership {
  id: string;
  name: string;
  google_place_id: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface StaffMember {
  id: string;
  dealership_id: string;
  name: string;
  role: StaffRole;
  active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface InteractionEvent {
  id: string;
  dealership_id: string;
  staff_id: string | null;
  user_id: string;
  event_type: EventType;
  occurred_at: Date;
  verification_method: VerificationMethod;
  metadata: Record<string, any>;
  created_at: Date;
}

export interface Review {
  id: string;
  dealership_id: string;
  staff_id: string | null;
  user_id: string;
  linked_interaction_event_id: string;
  stage: ReviewStage;
  stars: number;
  text: string;
  complaint_scope: ComplaintScope;
  tags: string[];
  created_at: Date;
}

export interface Issue {
  id: string;
  dealership_id: string;
  staff_id: string | null;
  user_id: string;
  linked_purchase_event_id: string | null;
  linked_delivery_event_id: string | null;
  category: IssueCategory;
  status: IssueStatus;
  opened_at: Date;
  resolved_at: Date | null;
  resolution_outcome: ResolutionOutcome | null;
  notes: string | null;
}

export interface ExternalRatingSnapshot {
  id: string;
  dealership_id: string;
  source: ExternalSource;
  rating_avg: number;
  rating_count: number;
  raw_sample_reviews: any;
  fetched_at: Date;
}

export interface ReputationScore {
  id: string;
  dealership_id: string;
  computed_at: Date;
  google_score_0_100: number | null;
  sentiment_score_0_100: number | null;
  process_score_0_100: number;
  resolution_overlay: number;
  variance_overlay: number;
  final_score_0_100: number;
  final_stars_1_5: number;
  confidence_level: ConfidenceLevel;
  breakdown_json: ReputationBreakdown;
  created_at: Date;
}

export interface StaffReputationScore {
  id: string;
  staff_id: string;
  computed_at: Date;
  sentiment_score_0_100: number | null;
  flags_count_rolling: number;
  final_score_0_100: number;
  confidence_level: ConfidenceLevel;
  breakdown_json: Record<string, any>;
}

export interface ReputationBreakdown {
  n_verified: number;
  counts: {
    A: number;
    B: number;
    C: number;
    D: number;
    E: number;
  };
  rates: {
    P_A: number;
    P_B: number;
    P_C: number;
    P_D: number;
    P_E: number;
  };
  issue_rate: number;
  resolved_rate: number;
  median_resolution_days: number | null;
  volatility: number;
  weights: {
    w_google: number;
    w_process: number;
    w_sentiment: number;
  };
  review_count: number;
  google_review_count: number;
}
