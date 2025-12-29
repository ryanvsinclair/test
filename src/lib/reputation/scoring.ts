/**
 * LEGACY REPUTATION SCORING ENGINE (v0.x)
 * 
 * ⚠️ DEPRECATED - Being replaced by CarlyScore v1.0 (carly-score-v1.ts)
 * This system remains operational during migration and validation phase.
 * DO NOT DELETE - Required for rollback capability.
 * 
 * See REPUTATION_V1_MIGRATION.md for migration plan.
 */

import type { ReputationBreakdown, ConfidenceLevel, ReviewStage } from '@/types/reputation';
import { reputationDb } from './db';

const STAGE_WEIGHTS = {
  A: 0.2,
  B: 0.2,
  C: 0.15,
  D: 0.1,
  E: 0.35,
};

const DEPTH_WEIGHTS: Record<ReviewStage, number> = {
  A: 0.2,
  B: 0.35,
  C: 0.55,
  D: 0.75,
  E: 1.0,
};

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

// ============================================================
// 4A) Google Score (Soft Baseline)
// ============================================================
export function computeGoogleScore(
  rating_avg: number,
  rating_count: number
): number | null {
  if (!rating_avg || rating_count === 0) return null;

  // Convert 1..5 to 0..100
  const G_raw = ((rating_avg - 1) / 4) * 100;

  // Confidence dampener
  const conf = 1 - Math.exp(-rating_count / 50);

  return G_raw * conf;
}

// ============================================================
// 4B) Sentiment Score (User Reviews)
// ============================================================
export async function computeSentimentScore(
  dealershipId: string,
  staffId?: string
): Promise<number | null> {
  const since = new Date();
  since.setFullYear(since.getFullYear() - 1); // 12 months

  const reviews = staffId
    ? await reputationDb.getReviewsByStaff(staffId, since)
    : await reputationDb.getReviewsByDealership(dealershipId, since);

  if (reviews.length === 0) return null;

  let totalWeightedScore = 0;
  let totalWeight = 0;

  const now = Date.now();

  for (const review of reviews) {
    const depthWeight = DEPTH_WEIGHTS[review.stage];
    const daysSince = (now - review.created_at.getTime()) / (1000 * 60 * 60 * 24);
    const timeWeight = Math.exp(-daysSince / 180); // 6 month half-life

    const stars_to_100 = ((review.stars - 1) / 4) * 100;
    const weight = depthWeight * timeWeight;

    totalWeightedScore += stars_to_100 * weight;
    totalWeight += weight;
  }

  if (totalWeight === 0) return null;

  return totalWeightedScore / totalWeight;
}

// ============================================================
// 4C) Process Score (PRIMARY AUTHORITY)
// ============================================================
export async function computeProcessScore(dealershipId: string): Promise<{
  score: number;
  counts: Record<ReviewStage, number>;
  rates: Record<string, number>;
}> {
  const since = new Date();
  since.setFullYear(since.getFullYear() - 1); // 12 months

  const events = await reputationDb.getInteractionEventsByDealership(dealershipId, since);

  const counts = {
    A: events.filter((e) => e.event_type === 'A_APPOINTMENT_CONFIRMED').length,
    B: events.filter((e) => e.event_type === 'B_TEST_DRIVE_CONFIRMED').length,
    C: events.filter((e) => e.event_type === 'C_FINANCE_SESSION_CONFIRMED').length,
    D: events.filter((e) => e.event_type === 'D_PURCHASE_CONFIRMED').length,
    E: events.filter((e) => e.event_type === 'E_DELIVERY_CONFIRMED').length,
  };

  // Compute rates (safe divide-by-zero)
  const P_A = counts.A > 0 ? 1 : 0; // Simplified: confirmed appointments assumed scheduled
  const P_B = counts.A > 0 ? counts.B / counts.A : 0;
  const P_C = counts.B > 0 ? counts.C / counts.B : 0;
  const P_D = counts.C > 0 ? counts.D / counts.C : 0;
  const P_E = counts.D > 0 ? counts.E / counts.D : 0;

  const rates = { P_A, P_B, P_C, P_D, P_E };

  const P =
    100 *
    (STAGE_WEIGHTS.A * P_A +
      STAGE_WEIGHTS.B * P_B +
      STAGE_WEIGHTS.C * P_C +
      STAGE_WEIGHTS.D * P_D +
      STAGE_WEIGHTS.E * P_E);

  return {
    score: clamp(P, 0, 100),
    counts,
    rates,
  };
}

// ============================================================
// 4D) Resolution Overlay
// ============================================================
export async function computeResolutionOverlay(dealershipId: string): Promise<{
  overlay: number;
  issue_rate: number;
  resolved_rate: number;
  median_resolution_days: number | null;
}> {
  const since = new Date();
  since.setFullYear(since.getFullYear() - 1);

  const events = await reputationDb.getInteractionEventsByDealership(dealershipId, since);
  const E_count = events.filter((e) => e.event_type === 'E_DELIVERY_CONFIRMED').length;

  const issues = await reputationDb.getIssuesByDealership(dealershipId, since);

  if (issues.length === 0) {
    return {
      overlay: 0,
      issue_rate: 0,
      resolved_rate: 0,
      median_resolution_days: null,
    };
  }

  const issue_rate = E_count > 0 ? issues.length / E_count : 0;
  const resolved_issues = issues.filter((i) => i.status === 'RESOLVED' || i.status === 'CLOSED');
  const resolved_rate = resolved_issues.length / issues.length;

  // Compute median resolution days
  const resolution_days = resolved_issues
    .filter((i) => i.resolved_at)
    .map((i) => {
      const days =
        (i.resolved_at!.getTime() - i.opened_at.getTime()) / (1000 * 60 * 60 * 24);
      return days;
    })
    .sort((a, b) => a - b);

  const median_resolution_days =
    resolution_days.length > 0
      ? resolution_days[Math.floor(resolution_days.length / 2)]
      : null;

  // Compute overlay
  const basePenalty = clamp(issue_rate * 30, 0, 20);
  const unresolvedPenalty = clamp((1 - resolved_rate) * 15, 0, 15);
  const speedBonus =
    resolved_rate > 0.7 && median_resolution_days && median_resolution_days < 7 ? 5 : 0;

  const R = clamp(-(basePenalty + unresolvedPenalty) + speedBonus, -25, 10);

  return {
    overlay: R,
    issue_rate,
    resolved_rate,
    median_resolution_days,
  };
}

// ============================================================
// 4E) Variance / Consistency Overlay
// ============================================================
export async function computeVarianceOverlay(dealershipId: string): Promise<{
  overlay: number;
  volatility: number;
}> {
  const history = await reputationDb.getReputationScoreHistory(dealershipId, 6);

  if (history.length < 3) {
    return { overlay: 0, volatility: 0 };
  }

  // Compute monthly scores
  const scores = history.map((s) => s.final_score_0_100);
  const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
  const variance =
    scores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / scores.length;
  const volatility = Math.sqrt(variance);

  let V = 0;
  if (volatility > 15) {
    V = -8;
  } else if (volatility < 5 && mean > 75) {
    V = 3;
  }

  return {
    overlay: clamp(V, -10, 5),
    volatility,
  };
}

// ============================================================
// 4F) Individual vs Dealership Isolation
// ============================================================
export async function checkSystemicPattern(dealershipId: string): Promise<boolean> {
  const since = new Date();
  since.setDate(since.getDate() - 90); // 90 days

  const reviews = await reputationDb.getReviewsByDealership(dealershipId, since);

  const individualNegativeReviews = reviews.filter(
    (r) => r.complaint_scope === 'INDIVIDUAL' && r.stars <= 2
  );

  // Systemic threshold 1: >= 3 distinct staff members flagged
  const flaggedStaff = new Set(
    individualNegativeReviews.filter((r) => r.staff_id).map((r) => r.staff_id!)
  );

  if (flaggedStaff.size >= 3) return true;

  // Systemic threshold 2: >= 8 individual-scoped negative reviews overall
  if (individualNegativeReviews.length >= 8) return true;

  return false;
}

export async function computeSentimentWithIsolation(
  dealershipId: string
): Promise<number | null> {
  const isSystemic = await checkSystemicPattern(dealershipId);

  const since = new Date();
  since.setFullYear(since.getFullYear() - 1);

  const reviews = await reputationDb.getReviewsByDealership(dealershipId, since);

  if (reviews.length === 0) return null;

  let totalWeightedScore = 0;
  let totalWeight = 0;

  const now = Date.now();

  for (const review of reviews) {
    const depthWeight = DEPTH_WEIGHTS[review.stage];
    const daysSince = (now - review.created_at.getTime()) / (1000 * 60 * 60 * 24);
    const timeWeight = Math.exp(-daysSince / 180);

    const stars_to_100 = ((review.stars - 1) / 4) * 100;

    // Apply isolation logic
    let effectiveWeight = depthWeight * timeWeight;
    if (review.complaint_scope === 'INDIVIDUAL' && !isSystemic) {
      effectiveWeight *= 0.25; // Reduced effect unless systemic
    }

    totalWeightedScore += stars_to_100 * effectiveWeight;
    totalWeight += effectiveWeight;
  }

  if (totalWeight === 0) return null;

  return totalWeightedScore / totalWeight;
}

// ============================================================
// 4G) Combine Scores into Final
// ============================================================
export async function computeFinalScore(dealershipId: string): Promise<{
  final_score: number;
  final_stars: number;
  confidence_level: ConfidenceLevel;
  breakdown: ReputationBreakdown;
}> {
  // Get Google score
  const googleSnapshot = await reputationDb.getLatestExternalSnapshot(dealershipId, 'GOOGLE');
  const G = googleSnapshot
    ? computeGoogleScore(googleSnapshot.rating_avg, googleSnapshot.rating_count)
    : null;

  // Get process score
  const processResult = await computeProcessScore(dealershipId);
  const P = processResult.score;

  // Get sentiment score with isolation
  const S = await computeSentimentWithIsolation(dealershipId);

  // Get overlays
  const resolutionResult = await computeResolutionOverlay(dealershipId);
  const R = resolutionResult.overlay;

  const varianceResult = await computeVarianceOverlay(dealershipId);
  const V = varianceResult.overlay;

  // Compute n_verified
  const since = new Date();
  since.setFullYear(since.getFullYear() - 1);
  const events = await reputationDb.getInteractionEventsByDealership(dealershipId, since);
  const n_verified = events.length;

  // Compute dynamic weights
  const w_carly = clamp(n_verified / 50, 0.2, 0.75);
  let w_google = clamp(1 - w_carly, 0.15, 0.35);
  let w_process = 0.65 * w_carly;
  let w_sentiment = 0.35 * w_carly;

  // Handle null scores
  if (G === null) {
    w_google = 0;
    // Redistribute into process/sentiment
    const redistribute = 0.35;
    w_process += redistribute * 0.65;
    w_sentiment += redistribute * 0.35;
  }

  if (S === null) {
    // Redistribute sentiment weight into process
    w_process += w_sentiment;
    w_sentiment = 0;
  }

  // Compute final score
  let final = 0;
  if (G !== null) final += w_google * G;
  final += w_process * P;
  if (S !== null) final += w_sentiment * S;
  final += R;
  final += V;

  final = clamp(final, 0, 100);

  // Convert to stars
  const stars = clamp(1 + 4 * (final / 100), 1, 5);
  const final_stars = Math.round(stars * 10) / 10; // Round to 1 decimal

  // Determine confidence level
  let confidence_level: ConfidenceLevel = 'LOW';
  if (n_verified >= 50) confidence_level = 'HIGH';
  else if (n_verified >= 10) confidence_level = 'MED';

  // Get review counts
  const reviews = await reputationDb.getReviewsByDealership(dealershipId);
  const review_count = reviews.length;
  const google_review_count = googleSnapshot?.rating_count || 0;

  const breakdown: ReputationBreakdown = {
    n_verified,
    counts: processResult.counts,
    rates: processResult.rates,
    issue_rate: resolutionResult.issue_rate,
    resolved_rate: resolutionResult.resolved_rate,
    median_resolution_days: resolutionResult.median_resolution_days,
    volatility: varianceResult.volatility,
    weights: {
      w_google,
      w_process,
      w_sentiment,
    },
    review_count,
    google_review_count,
  };

  return {
    final_score: final,
    final_stars,
    confidence_level,
    breakdown,
  };
}

// ============================================================
// Staff Scoring
// ============================================================
export async function computeStaffScore(staffId: string): Promise<{
  sentiment_score: number | null;
  flags_count: number;
  final_score: number;
  confidence_level: ConfidenceLevel;
}> {
  const since = new Date();
  since.setDate(since.getDate() - 90); // 90 days rolling

  const S = await computeSentimentScore('', staffId);
  const reviews = await reputationDb.getReviewsByStaff(staffId, since);
  const flags_count = reviews.filter(
    (r) => r.complaint_scope === 'INDIVIDUAL' && r.stars <= 2
  ).length;

  // Staff final score is primarily sentiment-based
  let final_score = S || 50; // Default to neutral if no reviews

  // Apply penalty for repeated flags
  if (flags_count >= 5) final_score -= 15;
  else if (flags_count >= 3) final_score -= 8;

  final_score = clamp(final_score, 0, 100);

  const events = await reputationDb.getInteractionEventsByStaff(staffId, since);
  const confidence_level: ConfidenceLevel = events.length >= 20 ? 'HIGH' : events.length >= 5 ? 'MED' : 'LOW';

  return {
    sentiment_score: S,
    flags_count,
    final_score,
    confidence_level,
  };
}
