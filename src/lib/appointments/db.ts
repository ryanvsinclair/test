// Mock database layer for Appointments system
// In production, replace with actual Prisma/Supabase queries

import type {
  Appointment,
  AppointmentStep,
  StepEvent,
  StepReview,
  OutcomeDeclaration,
  ReputationSignal,
  AppointmentType,
  AppointmentStatus,
  StepType,
  StepStatus,
  ConfirmationActor,
  OutcomeType,
} from '@/types/appointments';

// In-memory storage
const db = {
  appointments: new Map<string, Appointment>(),
  appointment_steps: new Map<string, AppointmentStep>(),
  step_events: new Map<string, StepEvent>(),
  step_reviews: new Map<string, StepReview>(),
  outcome_declarations: new Map<string, OutcomeDeclaration>(),
  reputation_signals: new Map<string, ReputationSignal>(),
};

export const appointmentsDb = {
  // Appointments
  async createAppointment(
    data: Omit<Appointment, 'id' | 'created_at' | 'updated_at'>
  ): Promise<Appointment> {
    const appointment: Appointment = {
      id: crypto.randomUUID(),
      ...data,
      created_at: new Date(),
      updated_at: new Date(),
    };
    db.appointments.set(appointment.id, appointment);
    return appointment;
  },

  async getAppointment(id: string): Promise<Appointment | null> {
    return db.appointments.get(id) || null;
  },

  async updateAppointment(
    id: string,
    data: Partial<Appointment>
  ): Promise<Appointment | null> {
    const appointment = db.appointments.get(id);
    if (!appointment) return null;
    const updated = { ...appointment, ...data, updated_at: new Date() };
    db.appointments.set(id, updated);
    return updated;
  },

  async getAppointmentsByBuyer(buyer_id: string): Promise<Appointment[]> {
    return Array.from(db.appointments.values()).filter(
      (a) => a.buyer_id === buyer_id
    );
  },

  async getAppointmentsBySeller(seller_id: string): Promise<Appointment[]> {
    return Array.from(db.appointments.values()).filter(
      (a) => a.seller_id === seller_id
    );
  },

  async getAppointmentsByStaff(staff_id: string): Promise<Appointment[]> {
    return Array.from(db.appointments.values()).filter(
      (a) => a.staff_id === staff_id
    );
  },

  // Appointment Steps
  async createAppointmentStep(
    data: Omit<AppointmentStep, 'id' | 'created_at'>
  ): Promise<AppointmentStep> {
    const step: AppointmentStep = {
      id: crypto.randomUUID(),
      ...data,
      created_at: new Date(),
    };
    db.appointment_steps.set(step.id, step);
    return step;
  },

  async getAppointmentSteps(appointment_id: string): Promise<AppointmentStep[]> {
    return Array.from(db.appointment_steps.values())
      .filter((s) => s.appointment_id === appointment_id)
      .sort((a, b) => a.step_order - b.step_order);
  },

  async getAppointmentStep(id: string): Promise<AppointmentStep | null> {
    return db.appointment_steps.get(id) || null;
  },

  async updateAppointmentStep(
    id: string,
    data: Partial<AppointmentStep>
  ): Promise<AppointmentStep | null> {
    const step = db.appointment_steps.get(id);
    if (!step) return null;
    const updated = { ...step, ...data };
    db.appointment_steps.set(id, updated);
    return updated;
  },

  // Step Events
  async createStepEvent(
    data: Omit<StepEvent, 'id'>
  ): Promise<StepEvent> {
    const event: StepEvent = {
      id: crypto.randomUUID(),
      ...data,
    };
    db.step_events.set(event.id, event);
    return event;
  },

  async getStepEvents(appointment_id: string): Promise<StepEvent[]> {
    return Array.from(db.step_events.values())
      .filter((e) => e.appointment_id === appointment_id)
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  },

  async getStepEventsByStep(step_id: string): Promise<StepEvent[]> {
    return Array.from(db.step_events.values())
      .filter((e) => e.appointment_step_id === step_id)
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  },

  // Step Reviews
  async createStepReview(
    data: Omit<StepReview, 'id' | 'created_at'>
  ): Promise<StepReview> {
    const review: StepReview = {
      id: crypto.randomUUID(),
      ...data,
      created_at: new Date(),
    };
    db.step_reviews.set(review.id, review);
    return review;
  },

  async getStepReviews(appointment_id: string): Promise<StepReview[]> {
    return Array.from(db.step_reviews.values()).filter(
      (r) => r.appointment_id === appointment_id
    );
  },

  async getStepReview(
    appointment_id: string,
    reviewer_id: string
  ): Promise<StepReview | null> {
    return (
      Array.from(db.step_reviews.values()).find(
        (r) => r.appointment_id === appointment_id && r.reviewer_id === reviewer_id
      ) || null
    );
  },

  // Outcome Declarations
  async createOutcomeDeclaration(
    data: Omit<OutcomeDeclaration, 'id'>
  ): Promise<OutcomeDeclaration> {
    const outcome: OutcomeDeclaration = {
      id: crypto.randomUUID(),
      ...data,
    };
    db.outcome_declarations.set(outcome.id, outcome);
    return outcome;
  },

  async getOutcomeDeclarations(appointment_id: string): Promise<OutcomeDeclaration[]> {
    return Array.from(db.outcome_declarations.values()).filter(
      (o) => o.appointment_id === appointment_id
    );
  },

  async getOutcomeDeclaration(
    appointment_id: string,
    actor_id: string
  ): Promise<OutcomeDeclaration | null> {
    return (
      Array.from(db.outcome_declarations.values()).find(
        (o) => o.appointment_id === appointment_id && o.actor_id === actor_id
      ) || null
    );
  },

  async revealOutcomes(appointment_id: string): Promise<OutcomeDeclaration[]> {
    const outcomes = await this.getOutcomeDeclarations(appointment_id);
    const now = new Date();
    outcomes.forEach((o) => {
      if (!o.revealed_at) {
        o.revealed_at = now;
        db.outcome_declarations.set(o.id, o);
      }
    });
    return outcomes;
  },

  // Reputation Signals
  async createReputationSignal(
    data: Omit<ReputationSignal, 'timestamp'> & { timestamp?: Date }
  ): Promise<ReputationSignal> {
    const signal: ReputationSignal = {
      ...data,
      timestamp: data.timestamp || new Date(),
    };
    const id = crypto.randomUUID();
    db.reputation_signals.set(id, signal);
    return signal;
  },

  async getReputationSignals(target_id: string): Promise<ReputationSignal[]> {
    return Array.from(db.reputation_signals.values())
      .filter((s) => s.target_id === target_id)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  },

  async getReputationSignalsByAppointment(
    appointment_id: string
  ): Promise<ReputationSignal[]> {
    return Array.from(db.reputation_signals.values()).filter(
      (s) => s.appointment_id === appointment_id
    );
  },
};
