import { appointmentsDb } from './db';
import type {
  Appointment,
  AppointmentStep,
  StepEvent,
  StepType,
  ConfirmationActor,
  ReputationSignal,
} from '@/types/appointments';

const STEP_ORDER: Record<StepType, number> = {
  created: 1,
  confirmed: 2,
  arrived: 3,
  activity_completed: 4,
  outcome_declared: 5,
  reviewed: 6,
};

export async function initializeAppointmentSteps(
  appointment_id: string
): Promise<AppointmentStep[]> {
  const steps: StepType[] = [
    'created',
    'confirmed',
    'arrived',
    'activity_completed',
    'outcome_declared',
    'reviewed',
  ];

  const createdSteps: AppointmentStep[] = [];

  for (const step_type of steps) {
    const step = await appointmentsDb.createAppointmentStep({
      appointment_id,
      step_type,
      step_order: STEP_ORDER[step_type],
      status: step_type === 'created' ? 'completed' : 'pending',
      locked_at: step_type === 'created' ? new Date() : undefined,
      completed_at: step_type === 'created' ? new Date() : undefined,
      metadata: {},
    });
    createdSteps.push(step);
  }

  return createdSteps;
}

export async function confirmStep(
  appointment_id: string,
  step_type: StepType,
  actor: ConfirmationActor,
  actor_id: string
): Promise<{ step: AppointmentStep; event: StepEvent; signals: ReputationSignal[] }> {
  const steps = await appointmentsDb.getAppointmentSteps(appointment_id);
  const step = steps.find((s) => s.step_type === step_type);

  if (!step) {
    throw new Error('Step not found');
  }

  if (step.status === 'locked' || step.status === 'completed') {
    throw new Error('Step already completed and locked');
  }

  const now = new Date();
  const isFirstConfirmation =
    !step.buyer_confirmed_at && !step.seller_confirmed_at;

  // Update step confirmation
  const updates: Partial<AppointmentStep> = {};
  if (actor === 'buyer') {
    updates.buyer_confirmed_at = now;
  } else {
    updates.seller_confirmed_at = now;
  }

  // Check if both confirmed
  const buyerConfirmed = actor === 'buyer' || step.buyer_confirmed_at;
  const sellerConfirmed = actor === 'seller' || step.seller_confirmed_at;

  if (buyerConfirmed && sellerConfirmed) {
    updates.status = 'completed';
    updates.completed_at = now;
    updates.locked_at = now;
  } else {
    updates.status =
      actor === 'buyer' ? 'pending_seller' : 'pending_buyer';
  }

  const updatedStep = await appointmentsDb.updateAppointmentStep(
    step.id,
    updates
  );

  if (!updatedStep) {
    throw new Error('Failed to update step');
  }

  // Create step event
  const event = await appointmentsDb.createStepEvent({
    appointment_step_id: step.id,
    appointment_id,
    event_type: 'confirmation',
    actor,
    actor_id,
    timestamp: now,
    metadata: {
      step_type,
      is_final: buyerConfirmed && sellerConfirmed,
    },
  });

  // Generate reputation signals
  const signals: ReputationSignal[] = [];

  // Response time signal (only for first confirmation)
  if (isFirstConfirmation) {
    const responseTime =
      now.getTime() - step.created_at.getTime();
    const responseHours = responseTime / (1000 * 60 * 60);
    
    let responseScore = 100;
    if (responseHours < 1) responseScore = 100;
    else if (responseHours < 4) responseScore = 90;
    else if (responseHours < 24) responseScore = 75;
    else if (responseHours < 48) responseScore = 50;
    else responseScore = 25;

    const signal = await appointmentsDb.createReputationSignal({
      appointment_id,
      signal_type: 'response_time',
      target_type: actor,
      target_id: actor_id,
      value: responseScore,
      weight: step_type === 'confirmed' ? 0.8 : 0.5,
      context: {
        step_type,
        response_hours: responseHours,
      },
    });
    signals.push(signal);
  }

  // Step completion signal (when both confirm)
  if (buyerConfirmed && sellerConfirmed) {
    const appointment = await appointmentsDb.getAppointment(appointment_id);
    if (appointment) {
      await appointmentsDb.updateAppointment(appointment_id, {
        current_step: step_type,
      });
    }

    // Punctuality signal for arrival step
    if (step_type === 'arrived' && appointment?.confirmed_datetime) {
      const scheduledTime = appointment.confirmed_datetime.getTime();
      const arrivalTime = now.getTime();
      const diffMinutes = (arrivalTime - scheduledTime) / (1000 * 60);

      let punctualityScore = 100;
      if (Math.abs(diffMinutes) <= 5) punctualityScore = 100;
      else if (Math.abs(diffMinutes) <= 15) punctualityScore = 85;
      else if (Math.abs(diffMinutes) <= 30) punctualityScore = 70;
      else punctualityScore = 50;

      for (const target of [
        { type: actor, id: actor_id },
        {
          type: actor === 'buyer' ? 'seller' : 'buyer',
          id: actor === 'buyer' ? appointment.seller_id : appointment.buyer_id,
        },
      ]) {
        const signal = await appointmentsDb.createReputationSignal({
          appointment_id,
          signal_type: 'punctuality',
          target_type: target.type as 'buyer' | 'seller',
          target_id: target.id,
          value: punctualityScore,
          weight: 1.0,
          context: {
            diff_minutes: diffMinutes,
            scheduled_time: appointment.confirmed_datetime,
            arrival_time: now,
          },
        });
        signals.push(signal);
      }
    }

    // Completion rate signal
    const completionSignal = await appointmentsDb.createReputationSignal({
      appointment_id,
      signal_type: 'completion_rate',
      target_type: actor,
      target_id: actor_id,
      value: 100,
      weight: step_type === 'activity_completed' ? 1.0 : 0.6,
      context: {
        step_type,
      },
    });
    signals.push(completionSignal);
  }

  return { step: updatedStep, event, signals };
}

export async function recordNoShow(
  appointment_id: string,
  no_show_actor: ConfirmationActor,
  no_show_actor_id: string,
  reporting_actor_id: string
): Promise<{ event: StepEvent; signals: ReputationSignal[] }> {
  const appointment = await appointmentsDb.getAppointment(appointment_id);
  if (!appointment) {
    throw new Error('Appointment not found');
  }

  await appointmentsDb.updateAppointment(appointment_id, {
    status: 'no_show',
  });

  const event = await appointmentsDb.createStepEvent({
    appointment_step_id: '', // Not tied to specific step
    appointment_id,
    event_type: 'no_show',
    actor: no_show_actor,
    actor_id: no_show_actor_id,
    timestamp: new Date(),
    metadata: {
      reported_by: reporting_actor_id,
    },
  });

  // Heavy penalty for no-show
  const signal = await appointmentsDb.createReputationSignal({
    appointment_id,
    signal_type: 'no_show',
    target_type: no_show_actor,
    target_id: no_show_actor_id,
    value: 0,
    weight: 2.0, // High weight for pattern detection
    context: {
      reported_by: reporting_actor_id,
    },
  });

  return { event, signals: [signal] };
}

export async function recordRescheduling(
  appointment_id: string,
  actor: ConfirmationActor,
  actor_id: string,
  new_datetime: Date,
  reason?: string
): Promise<{ event: StepEvent; signals: ReputationSignal[] }> {
  const steps = await appointmentsDb.getAppointmentSteps(appointment_id);
  const confirmedStep = steps.find((s) => s.step_type === 'confirmed');

  if (!confirmedStep) {
    throw new Error('Confirmed step not found');
  }

  const event = await appointmentsDb.createStepEvent({
    appointment_step_id: confirmedStep.id,
    appointment_id,
    event_type: 'revision',
    actor,
    actor_id,
    timestamp: new Date(),
    metadata: {
      new_datetime,
      reason,
    },
  });

  // Get reschedule count
  const allEvents = await appointmentsDb.getStepEvents(appointment_id);
  const rescheduleCount = allEvents.filter(
    (e) => e.event_type === 'revision'
  ).length;

  // Penalty increases with frequency
  let reschedulingScore = 100;
  if (rescheduleCount === 1) reschedulingScore = 90;
  else if (rescheduleCount === 2) reschedulingScore = 70;
  else if (rescheduleCount >= 3) reschedulingScore = 40;

  const signal = await appointmentsDb.createReputationSignal({
    appointment_id,
    signal_type: 'rescheduling',
    target_type: actor,
    target_id: actor_id,
    value: reschedulingScore,
    weight: 0.7,
    context: {
      reschedule_count: rescheduleCount,
      reason,
    },
  });

  return { event, signals: [signal] };
}

export async function getAppointmentTimeline(appointment_id: string) {
  const appointment = await appointmentsDb.getAppointment(appointment_id);
  if (!appointment) throw new Error('Appointment not found');

  const steps = await appointmentsDb.getAppointmentSteps(appointment_id);
  const events = await appointmentsDb.getStepEvents(appointment_id);
  const reviews = await appointmentsDb.getStepReviews(appointment_id);
  const outcomes = await appointmentsDb.getOutcomeDeclarations(
    appointment_id
  );

  return {
    appointment,
    steps,
    events,
    reviews,
    outcomes,
  };
}
