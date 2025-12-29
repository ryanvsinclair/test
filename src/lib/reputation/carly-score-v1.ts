/**
 * CARLY REPUTATION SCORING ENGINE v1.0
 * 
 * Production-grade trust engine with:
 * - Event-driven calculation from immutable ledger
 * - Explainable component breakdown
 * - Cold-start Bayesian priors
 * - Agent vs Dealership separation
 * - Exponential time decay
 * 
 * Formula: CarlyScore = 100 × (0.45 × B + 0.35 × R + 0.20 × T) × P
 */

import { ReputationEvent, ReputationEventType, queryReputationEvents } from './event-ledger';

// ============================================================================
// CONFIGURATION
// ============================================================================

const WEIGHTS = {
  BEHAVIOR: 0.45,
  RELIABILITY: 0.35,
  TRUST_SAFETY: 0.20,
};

const BAYESIAN_PRIORS = {
  BEHAVIOR: 0.60,
  RELIABILITY: 0.60,
  TRUST_SAFETY: 0.85,
  VIRTUAL_INTERACTIONS: 30,
};

const TIME_DECAY = {
  HALF_LIFE_DAYS: 120,
  LAMBDA: Math.LN2 / 120, // λ for exponential decay
};

// ============================================================================
// TYPES
// ============================================================================

export interface CarlyScoreBreakdown {
  carlyScore: number; // 0-100
  grade: 'A' | 'B' | 'C' | 'D' | 'E';
  reputationComposite: number; // Public-facing score
  
  components: {
    behavior: number; // 0-1
    reliability: number; // 0-1
    trustSafety: number; // 0-1
    penaltyMultiplier: number; // 0-1
  };
  
  drivers: {
    positive: string[];
    negative: string[];
  };
  
  recentEvents: ReputationEvent[];
  nextBestActions: string[];
  
  metadata: {
    totalEvents: number;
    verifiedInteractions: number;
    confidenceLevel: 'HIGH' | 'MED' | 'LOW';
    isColdStart: boolean;
    googleConnected: boolean; // New: tracks if Google Business Profile is connected
  };
}

export interface AgentScore extends CarlyScoreBreakdown {
  agentId: string;
  isOutlier: boolean;
}

export interface DealershipScore extends CarlyScoreBreakdown {
  dealershipId: string;
  agentScores: AgentScore[];
  outlierAgentCount: number;
}

// ============================================================================
// CORE CALCULATION ENGINE
// ============================================================================

/**
 * Calculate CarlyScore for a dealership
 */
export async function calculateDealershipScore(
  dealershipId: string,
  options?: {
    includeAgents?: boolean;
    startDate?: Date;
    endDate?: Date;
    googleData?: { connected: boolean; rating: number; reviewCount: number };
  }
): Promise<DealershipScore> {
  // Fetch all events for dealership
  const events = await queryReputationEvents(dealershipId, {
    startDate: options?.startDate,
    endDate: options?.endDate,
  });

  // Calculate agent-level scores if requested
  const agentScores: AgentScore[] = [];
  if (options?.includeAgents) {
    const agentIds = [...new Set(events.filter(e => e.agentId).map(e => e.agentId!))];
    for (const agentId of agentIds) {
      const agentScore = await calculateAgentScore(dealershipId, agentId, events, options?.googleData);
      agentScores.push(agentScore);
    }
  }

  // Compute dealership score (volume-weighted aggregate with outlier dampening)
  const dealershipBreakdown = computeScore(events, 'dealership', options?.googleData);
  
  // Apply outlier agent dampening
  const outlierAgents = agentScores.filter(a => a.isOutlier);
  const outlierDampening = computeOutlierDampening(outlierAgents.length, agentScores.length);
  
  const finalCarlyScore = Math.round(dealershipBreakdown.carlyScore * outlierDampening);
  const reputationComposite = computeReputationComposite(finalCarlyScore, events, options?.googleData);

  return {
    dealershipId,
    carlyScore: finalCarlyScore,
    grade: scoreToGrade(finalCarlyScore, dealershipBreakdown.components.penaltyMultiplier),
    reputationComposite,
    components: dealershipBreakdown.components,
    drivers: dealershipBreakdown.drivers,
    recentEvents: events.slice(0, 10),
    nextBestActions: generateNextBestActions(dealershipBreakdown, events),
    metadata: dealershipBreakdown.metadata,
    agentScores,
    outlierAgentCount: outlierAgents.length,
  };
}

/**
 * Calculate CarlyScore for an individual agent
 */
export async function calculateAgentScore(
  dealershipId: string,
  agentId: string,
  allEvents?: ReputationEvent[],
  googleData?: { connected: boolean; rating: number; reviewCount: number }
): Promise<AgentScore> {
  const events = allEvents 
    ? allEvents.filter(e => e.agentId === agentId)
    : await queryReputationEvents(dealershipId, { agentId });

  const breakdown = computeScore(events, 'agent', googleData);
  
  // Detect if agent is statistical outlier
  // TODO: Implement proper statistical outlier detection
  const isOutlier = breakdown.carlyScore < 60; // Placeholder

  return {
    agentId,
    isOutlier,
    ...breakdown,
    grade: scoreToGrade(breakdown.carlyScore, breakdown.components.penaltyMultiplier),
    reputationComposite: computeReputationComposite(breakdown.carlyScore, events, googleData),
    recentEvents: events.slice(0, 10),
    nextBestActions: generateNextBestActions(breakdown, events),
  };
}

/**
 * Core scoring computation from events
 */
function computeScore(
  events: ReputationEvent[],
  context: 'agent' | 'dealership',
  googleData?: { connected: boolean; rating: number; reviewCount: number }
): Omit<CarlyScoreBreakdown, 'grade' | 'reputationComposite' | 'nextBestActions'> {
  const verifiedInteractions = countVerifiedInteractions(events);
  const isColdStart = verifiedInteractions < 10;
  
  // Calculate component scores
  const behavior = calculateBehavior(events, isColdStart);
  const reliability = calculateReliability(events, isColdStart);
  const trustSafety = calculateTrustSafety(events, isColdStart);
  const penaltyMultiplier = calculatePenaltyMultiplier(events);

  // Apply CarlyScore formula
  const carlyScore = Math.round(
    100 * (
      WEIGHTS.BEHAVIOR * behavior +
      WEIGHTS.RELIABILITY * reliability +
      WEIGHTS.TRUST_SAFETY * trustSafety
    ) * penaltyMultiplier
  );

  return {
    carlyScore,
    components: {
      behavior,
      reliability,
      trustSafety,
      penaltyMultiplier,
    },
    drivers: identifyDrivers(events, { behavior, reliability, trustSafety }),
    recentEvents: events.slice(0, 10),
    metadata: {
      totalEvents: events.length,
      verifiedInteractions,
      confidenceLevel: getConfidenceLevel(verifiedInteractions),
      isColdStart,
      googleConnected: googleData?.connected || false,
    },
  };
}

// ============================================================================
// COMPONENT CALCULATIONS
// ============================================================================

/**
 * B (Behavior Quality): 0-1
 * - Response speed (log-scaled median first reply time)
 * - Conversation progression toward outcomes
 * - Verified buyer sentiment only
 */
function calculateBehavior(events: ReputationEvent[], isColdStart: boolean): number {
  const replyEvents = events.filter(e => e.type === 'MESSAGE_FIRST_REPLY');
  const reviewEvents = events.filter(e => e.type === 'VERIFIED_REVIEW_SUBMITTED');
  
  if (isColdStart && replyEvents.length === 0) {
    return BAYESIAN_PRIORS.BEHAVIOR;
  }

  // Response speed score (0-1)
  const responseTimes = replyEvents.map(e => (e.metadata as any).responseTimeMinutes || 0);
  const medianResponseTime = median(responseTimes) || 60;
  const responseScore = 1 / (1 + Math.log10(medianResponseTime + 1)); // Log-scaled

  // Sentiment score from verified reviews
  const sentimentScore = reviewEvents.length > 0
    ? reviewEvents.reduce((sum, e) => sum + ((e.metadata as any).stars || 3) / 5, 0) / reviewEvents.length
    : BAYESIAN_PRIORS.BEHAVIOR;

  // Conversation progression (TODO: implement based on appointment conversion)
  const progressionScore = 0.7; // Placeholder

  // Blend with Bayesian prior
  const observedScore = (0.4 * responseScore + 0.3 * sentimentScore + 0.3 * progressionScore);
  return blendWithPrior(observedScore, BAYESIAN_PRIORS.BEHAVIOR, replyEvents.length, BAYESIAN_PRIORS.VIRTUAL_INTERACTIONS);
}

/**
 * R (Reliability): 0-1
 * - Appointment follow-through
 * - Dealer no-show penalties (buyer no-shows excluded)
 * - Listing integrity (VIN mismatches, misleading edits)
 */
function calculateReliability(events: ReputationEvent[], isColdStart: boolean): number {
  const appointmentEvents = events.filter(e => e.type.startsWith('APPOINTMENT_'));
  const listingIntegrityEvents = events.filter(e => 
    e.type === 'LISTING_VIN_MISMATCH' || e.type === 'LISTING_MISLEADING_EDIT'
  );

  if (isColdStart && appointmentEvents.length === 0) {
    return BAYESIAN_PRIORS.RELIABILITY;
  }

  // Appointment follow-through
  const confirmed = appointmentEvents.filter(e => e.type === 'APPOINTMENT_CONFIRMED').length;
  const attended = appointmentEvents.filter(e => e.type === 'APPOINTMENT_ATTENDED').length;
  const dealerNoShows = appointmentEvents.filter(e => e.type === 'APPOINTMENT_NO_SHOW_DEALER').length;
  
  const followThroughScore = confirmed > 0 ? attended / confirmed : BAYESIAN_PRIORS.RELIABILITY;
  const noShowPenalty = dealerNoShows * 0.1; // -10% per no-show

  // Listing integrity
  const integrityPenalty = listingIntegrityEvents.length * 0.05; // -5% per violation

  const observedScore = Math.max(0, followThroughScore - noShowPenalty - integrityPenalty);
  return blendWithPrior(observedScore, BAYESIAN_PRIORS.RELIABILITY, appointmentEvents.length, BAYESIAN_PRIORS.VIRTUAL_INTERACTIONS);
}

/**
 * T (Trust & Safety): 0-1
 * - Severity-weighted disputes with time decay
 */
function calculateTrustSafety(events: ReputationEvent[], isColdStart: boolean): number {
  const disputeEvents = events.filter(e => e.type.startsWith('DISPUTE_'));
  const safetyEvents = events.filter(e => 
    e.type === 'SAFETY_VIOLATION' || e.type === 'INTEGRITY_VIOLATION'
  );

  if (isColdStart && disputeEvents.length === 0 && safetyEvents.length === 0) {
    return BAYESIAN_PRIORS.TRUST_SAFETY;
  }

  // Dispute impact with time decay
  const disputeImpact = disputeEvents.reduce((total, event) => {
    const severity = event.severity || 'MEDIUM';
    const severityWeight = { LOW: 0.02, MEDIUM: 0.05, HIGH: 0.10, CRITICAL: 0.20 }[severity];
    const timeWeight = applyTimeDecay(event.timestamp);
    return total + (severityWeight * timeWeight);
  }, 0);

  // Safety violation impact
  const safetyImpact = safetyEvents.reduce((total, event) => {
    const severity = event.severity || 'CRITICAL';
    const severityWeight = { LOW: 0.05, MEDIUM: 0.10, HIGH: 0.20, CRITICAL: 0.40 }[severity];
    const timeWeight = applyTimeDecay(event.timestamp);
    return total + (severityWeight * timeWeight);
  }, 0);

  const observedScore = Math.max(0, 1 - disputeImpact - safetyImpact);
  return blendWithPrior(observedScore, BAYESIAN_PRIORS.TRUST_SAFETY, disputeEvents.length + safetyEvents.length, BAYESIAN_PRIORS.VIRTUAL_INTERACTIONS);
}

/**
 * P (Penalty Multiplier): 0-1
 * Centralized final penalty for severe safety or integrity issues
 */
function calculatePenaltyMultiplier(events: ReputationEvent[]): number {
  const criticalEvents = events.filter(e => e.severity === 'CRITICAL');
  
  if (criticalEvents.length === 0) return 1.0;
  
  // Heavy penalty for critical violations
  const recentCritical = criticalEvents.filter(e => 
    daysSince(e.timestamp) < 90
  ).length;
  
  return Math.max(0.5, 1 - (recentCritical * 0.15)); // -15% per recent critical event, floor at 50%
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function applyTimeDecay(timestamp: Date): number {
  const days = daysSince(timestamp);
  return Math.exp(-TIME_DECAY.LAMBDA * days);
}

function daysSince(timestamp: Date): number {
  return (Date.now() - timestamp.getTime()) / (1000 * 60 * 60 * 24);
}

function blendWithPrior(observed: number, prior: number, n: number, virtualN: number): number {
  return (n * observed + virtualN * prior) / (n + virtualN);
}

function countVerifiedInteractions(events: ReputationEvent[]): number {
  return events.filter(e => 
    e.type === 'APPOINTMENT_ATTENDED' || 
    e.type === 'DEAL_COMPLETED' ||
    e.type === 'VERIFIED_REVIEW_SUBMITTED'
  ).length;
}

function getConfidenceLevel(verifiedInteractions: number): 'HIGH' | 'MED' | 'LOW' {
  if (verifiedInteractions >= 50) return 'HIGH';
  if (verifiedInteractions >= 10) return 'MED';
  return 'LOW';
}

function scoreToGrade(score: number, penaltyMultiplier: number): 'A' | 'B' | 'C' | 'D' | 'E' {
  // Cap grade if severe penalties applied
  if (penaltyMultiplier < 0.7) return score >= 85 ? 'B' : scoreToGradeRaw(score);
  return scoreToGradeRaw(score);
}

function scoreToGradeRaw(score: number): 'A' | 'B' | 'C' | 'D' | 'E' {
  if (score >= 90) return 'A';
  if (score >= 75) return 'B';
  if (score >= 60) return 'C';
  if (score >= 45) return 'D';
  return 'E';
}

/**
 * Compute public-facing ReputationComposite
 * 
 * WITH Google connected: 75% CarlyScore, 15% verified sentiment, 10% Google
 * WITHOUT Google connected: ReputationComposite = CarlyScore (no penalty, no advantage)
 */
function computeReputationComposite(
  carlyScore: number, 
  events: ReputationEvent[],
  googleData?: { connected: boolean; rating: number; reviewCount: number }
): number {
  // STRICT RULE: If Google is NOT connected, ReputationComposite = CarlyScore
  if (!googleData || !googleData.connected) {
    return carlyScore;
  }

  // Google IS connected - apply weighted composite
  const reviewEvents = events.filter(e => e.type === 'VERIFIED_REVIEW_SUBMITTED');
  const sentimentScore = reviewEvents.length > 0
    ? reviewEvents.reduce((sum, e) => sum + ((e.metadata as any).stars || 3) * 20, 0) / reviewEvents.length
    : 70; // Neutral baseline

  // Convert Google 1-5 star rating to 0-100 scale with confidence weighting
  const googleConfidence = Math.min(1, googleData.reviewCount / 50); // Confidence dampening
  const googleBaseScore = (googleData.rating / 5) * 100;
  const googleScore = googleBaseScore * googleConfidence + 70 * (1 - googleConfidence); // Blend with neutral

  return Math.round(
    0.75 * carlyScore +
    0.15 * sentimentScore +
    0.10 * googleScore
  );
}

function computeOutlierDampening(outlierCount: number, totalAgents: number): number {
  if (totalAgents === 0) return 1.0;
  const outlierRatio = outlierCount / totalAgents;
  return Math.max(0.90, 1 - (outlierRatio * 0.10)); // Minor dampening, max -10%
}

function identifyDrivers(
  events: ReputationEvent[],
  components: { behavior: number; reliability: number; trustSafety: number }
): { positive: string[]; negative: string[] } {
  const positive: string[] = [];
  const negative: string[] = [];

  if (components.behavior > 0.8) positive.push('Fast response times');
  if (components.behavior < 0.5) negative.push('Slow or inconsistent responses');

  if (components.reliability > 0.85) positive.push('Strong appointment follow-through');
  if (components.reliability < 0.6) negative.push('Missed appointments or listing inaccuracies');

  if (components.trustSafety > 0.9) positive.push('Clean trust record');
  if (components.trustSafety < 0.7) negative.push('Recent disputes or safety concerns');

  return { positive, negative };
}

function generateNextBestActions(
  breakdown: Omit<CarlyScoreBreakdown, 'grade' | 'reputationComposite' | 'nextBestActions'>,
  events: ReputationEvent[]
): string[] {
  const actions: string[] = [];

  if (breakdown.components.behavior < 0.7) {
    actions.push('Improve response times to buyer inquiries (target: <30 minutes)');
  }

  if (breakdown.components.reliability < 0.7) {
    actions.push('Ensure all confirmed appointments are attended');
    actions.push('Review listings for accuracy and completeness');
  }

  if (breakdown.components.trustSafety < 0.8) {
    actions.push('Address open disputes promptly');
    actions.push('Review recent buyer complaints');
  }

  if (breakdown.metadata.verifiedInteractions < 10) {
    actions.push('Complete more verified transactions to unlock full reputation tracking');
  }

  return actions.slice(0, 3); // Top 3 actions
}

function median(arr: number[]): number {
  if (arr.length === 0) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}
