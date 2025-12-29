import { reputationDb } from './db';
import { computeFinalScore, computeStaffScore } from './scoring';

export async function recomputeDealershipScore(dealershipId: string): Promise<void> {
  const dealership = await reputationDb.getDealership(dealershipId);

  if (!dealership) {
    throw new Error('Dealership not found');
  }

  const result = await computeFinalScore(dealershipId);

  // Get Google snapshot for storing score
  const googleSnapshot = await reputationDb.getLatestExternalSnapshot(dealershipId, 'GOOGLE');
  const google_score = googleSnapshot
    ? ((googleSnapshot.rating_avg - 1) / 4) * 100
    : null;

  await reputationDb.createReputationScore({
    dealership_id: dealershipId,
    computed_at: new Date(),
    google_score_0_100: google_score,
    sentiment_score_0_100: null, // Will be populated by scoring logic
    process_score_0_100: result.breakdown.rates.P_A * 100, // Simplified for storage
    resolution_overlay: result.breakdown.issue_rate > 0 ? -10 : 0, // Simplified
    variance_overlay: result.breakdown.volatility > 10 ? -5 : 0, // Simplified
    final_score_0_100: result.final_score,
    final_stars_1_5: result.final_stars,
    confidence_level: result.confidence_level,
    breakdown_json: result.breakdown,
  });
}

export async function recomputeStaffScores(dealershipId: string): Promise<void> {
  const staff = await reputationDb.getStaffByDealership(dealershipId);

  for (const member of staff) {
    if (!member.active) continue;

    const result = await computeStaffScore(member.id);

    await reputationDb.createStaffReputationScore({
      staff_id: member.id,
      computed_at: new Date(),
      sentiment_score_0_100: result.sentiment_score,
      flags_count_rolling: result.flags_count,
      final_score_0_100: result.final_score,
      confidence_level: result.confidence_level,
      breakdown_json: {
        flags_count: result.flags_count,
      },
    });
  }
}

export async function recomputeAllDealerships(limit: number = 25): Promise<number> {
  const dealerships = await reputationDb.getAllDealerships();
  const batch = dealerships.slice(0, limit);

  for (const dealership of batch) {
    try {
      await recomputeDealershipScore(dealership.id);
      await recomputeStaffScores(dealership.id);
    } catch (error) {
      console.error(`Failed to recompute dealership ${dealership.id}:`, error);
    }
  }

  return batch.length;
}
