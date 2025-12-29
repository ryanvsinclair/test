import { appointmentsDb } from './db';
import { reputationDb } from '@/lib/reputation/db';
import { recordInteractionEvent } from '@/lib/reputation/events';
import type { ReputationSignal } from '@/types/appointments';
import type { EventType, VerificationMethod } from '@/types/reputation';

/**
 * Reputation Integration for Appointments
 * 
 * Maps appointment lifecycle events to Carly's A-E reputation system
 */

const APPOINTMENT_TO_REPUTATION_EVENT: Record<string, EventType> = {
  confirmed: 'A_APPOINTMENT_CONFIRMED',
  activity_completed: 'B_TEST_DRIVE_CONFIRMED', // Generalized from test drive
};

export async function syncAppointmentToReputation(
  appointment_id: string,
  step_completed: string
): Promise<void> {
  const appointment = await appointmentsDb.getAppointment(appointment_id);
  if (!appointment) return;

  const reputationEventType = APPOINTMENT_TO_REPUTATION_EVENT[step_completed];
  if (!reputationEventType) return;

  // Only sync if seller is a dealer
  if (appointment.seller_type !== 'dealer') return;

  // Record interaction event in reputation system
  await recordInteractionEvent({
    dealershipId: appointment.seller_id,
    staffId: appointment.staff_id,
    userId: appointment.buyer_id,
    eventType: reputationEventType,
    verificationMethod: 'DOUBLE_CONFIRM' as VerificationMethod,
    metadata: {
      appointment_id,
      appointment_type: appointment.appointment_type,
      listing_id: appointment.listing_id,
    },
  });
}

export async function aggregateReputationSignals(
  target_id: string,
  target_type: 'buyer' | 'seller' | 'staff',
  lookback_days: number = 90
): Promise<{
  response_time_avg: number;
  punctuality_avg: number;
  completion_rate: number;
  no_show_count: number;
  rescheduling_frequency: number;
  total_appointments: number;
}> {
  const signals = await appointmentsDb.getReputationSignals(target_id);
  
  const since = new Date();
  since.setDate(since.getDate() - lookback_days);
  
  const recentSignals = signals.filter(
    (s) => s.timestamp >= since && s.target_type === target_type
  );

  const byType = recentSignals.reduce((acc, signal) => {
    if (!acc[signal.signal_type]) acc[signal.signal_type] = [];
    acc[signal.signal_type].push(signal);
    return acc;
  }, {} as Record<string, ReputationSignal[]>);

  const avg = (signals: ReputationSignal[]) =>
    signals.length > 0
      ? signals.reduce((sum, s) => sum + s.value, 0) / signals.length
      : 0;

  return {
    response_time_avg: avg(byType.response_time || []),
    punctuality_avg: avg(byType.punctuality || []),
    completion_rate: avg(byType.completion_rate || []),
    no_show_count: (byType.no_show || []).length,
    rescheduling_frequency:
      (byType.rescheduling || []).length / Math.max(recentSignals.length, 1),
    total_appointments: recentSignals.length,
  };
}

export async function calculateConsistencyScore(
  target_id: string,
  target_type: 'buyer' | 'seller' | 'staff'
): Promise<number> {
  const aggregated = await aggregateReputationSignals(
    target_id,
    target_type,
    90
  );

  if (aggregated.total_appointments < 3) {
    return 50; // Neutral score for insufficient data
  }

  // Weighted consistency formula
  let score = 0;
  let totalWeight = 0;

  // Response time (20%)
  if (aggregated.response_time_avg > 0) {
    score += aggregated.response_time_avg * 0.2;
    totalWeight += 0.2;
  }

  // Punctuality (25%)
  if (aggregated.punctuality_avg > 0) {
    score += aggregated.punctuality_avg * 0.25;
    totalWeight += 0.25;
  }

  // Completion rate (30%)
  score += aggregated.completion_rate * 0.3;
  totalWeight += 0.3;

  // No-show penalty (15%)
  const noShowPenalty = Math.min(aggregated.no_show_count * 15, 15);
  score -= noShowPenalty;

  // Rescheduling penalty (10%)
  const reschedulePenalty = aggregated.rescheduling_frequency * 10;
  score -= reschedulePenalty;

  totalWeight += 0.15 + 0.1;

  // Normalize
  const finalScore = Math.max(0, Math.min(100, score));

  return finalScore;
}

export async function detectPatternAnomalies(
  target_id: string,
  target_type: 'buyer' | 'seller' | 'staff'
): Promise<{
  has_anomaly: boolean;
  anomaly_type?: string;
  severity?: 'low' | 'medium' | 'high';
  description?: string;
}> {
  const aggregated = await aggregateReputationSignals(
    target_id,
    target_type,
    90
  );

  if (aggregated.total_appointments < 5) {
    return { has_anomaly: false };
  }

  // Detect repeated no-shows
  if (aggregated.no_show_count >= 3) {
    return {
      has_anomaly: true,
      anomaly_type: 'repeated_no_show',
      severity: 'high',
      description: 'Multiple no-show incidents detected',
    };
  }

  // Detect excessive rescheduling
  if (aggregated.rescheduling_frequency > 0.5) {
    return {
      has_anomaly: true,
      anomaly_type: 'excessive_rescheduling',
      severity: 'medium',
      description: 'High frequency of appointment changes',
    };
  }

  // Detect poor punctuality pattern
  if (
    aggregated.punctuality_avg < 60 &&
    aggregated.total_appointments >= 5
  ) {
    return {
      has_anomaly: true,
      anomaly_type: 'poor_punctuality',
      severity: 'low',
      description: 'Consistent late arrivals',
    };
  }

  return { has_anomaly: false };
}

export async function isolateStaffReputation(
  staff_id: string,
  dealership_id: string
): Promise<{
  staff_score: number;
  should_escalate: boolean;
  reason?: string;
}> {
  const staffScore = await calculateConsistencyScore(staff_id, 'staff');
  const staffAnomalies = await detectPatternAnomalies(staff_id, 'staff');

  // Check if staff issues are systemic
  const dealershipStaff = await reputationDb.getStaffByDealership(
    dealership_id
  );

  let flaggedStaffCount = 0;
  for (const member of dealershipStaff) {
    const memberAnomalies = await detectPatternAnomalies(member.id, 'staff');
    if (memberAnomalies.has_anomaly) {
      flaggedStaffCount++;
    }
  }

  const shouldEscalate =
    flaggedStaffCount >= 3 || // Multiple staff flagged
    (staffAnomalies.has_anomaly &&
      staffAnomalies.severity === 'high' &&
      staffScore < 40); // Single severe case

  return {
    staff_score: staffScore,
    should_escalate: shouldEscalate,
    reason: shouldEscalate
      ? flaggedStaffCount >= 3
        ? 'Multiple staff members showing pattern issues'
        : 'Individual staff showing severe pattern issues'
      : undefined,
  };
}
