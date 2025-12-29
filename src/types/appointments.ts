export type AppointmentType = 
  | 'test_drive'
  | 'viewing'
  | 'inspection'
  | 'paperwork'
  | 'delivery';

export type AppointmentStatus = 
  | 'pending_confirmation'
  | 'confirmed'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'no_show';

export type StepType = 
  | 'created'
  | 'confirmed'
  | 'arrived'
  | 'activity_completed'
  | 'outcome_declared'
  | 'reviewed';

export type StepStatus = 
  | 'pending'
  | 'pending_both'
  | 'pending_buyer'
  | 'pending_seller'
  | 'completed'
  | 'locked';

export type OutcomeType = 
  | 'interested'
  | 'not_interested'
  | 'needs_followup';

export type ConfirmationActor = 'buyer' | 'seller';

export interface Appointment {
  id: string;
  listing_id: string;
  buyer_id: string;
  seller_id: string;
  seller_type: 'dealer' | 'buyer';
  staff_id?: string; // For dealerships
  appointment_type: AppointmentType;
  proposed_datetime: Date;
  confirmed_datetime?: Date;
  location: string;
  status: AppointmentStatus;
  current_step: StepType;
  created_at: Date;
  updated_at: Date;
  metadata: Record<string, any>;
}

export interface AppointmentStep {
  id: string;
  appointment_id: string;
  step_type: StepType;
  step_order: number;
  status: StepStatus;
  buyer_confirmed_at?: Date;
  seller_confirmed_at?: Date;
  locked_at?: Date;
  completed_at?: Date;
  metadata: Record<string, any>;
  created_at: Date;
}

export interface StepEvent {
  id: string;
  appointment_step_id: string;
  appointment_id: string;
  event_type: 'confirmation' | 'delay' | 'revision' | 'cancellation' | 'no_show';
  actor: ConfirmationActor;
  actor_id: string;
  timestamp: Date;
  metadata: Record<string, any>;
  reputation_signal_type?: string;
  reputation_signal_value?: number;
}

export interface StepReview {
  id: string;
  appointment_id: string;
  appointment_step_id: string;
  reviewer_type: ConfirmationActor;
  reviewer_id: string;
  punctuality_rating: number; // 1-5
  professionalism_rating: number; // 1-5
  communication_rating: number; // 1-5
  accuracy_rating: number; // 1-5
  text_comment?: string;
  created_at: Date;
}

export interface OutcomeDeclaration {
  id: string;
  appointment_id: string;
  actor: ConfirmationActor;
  actor_id: string;
  outcome: OutcomeType;
  submitted_at: Date;
  revealed_at?: Date;
}

export interface AppointmentTimeline {
  appointment: Appointment;
  steps: AppointmentStep[];
  events: StepEvent[];
  reviews: StepReview[];
  outcomes: OutcomeDeclaration[];
}

export interface ReputationSignal {
  appointment_id: string;
  signal_type: 
    | 'response_time'
    | 'punctuality'
    | 'completion_rate'
    | 'consistency'
    | 'no_show'
    | 'rescheduling'
    | 'professionalism';
  target_type: 'buyer' | 'seller' | 'staff';
  target_id: string;
  value: number; // Normalized score
  weight: number; // Importance multiplier
  timestamp: Date;
  context: Record<string, any>;
}
