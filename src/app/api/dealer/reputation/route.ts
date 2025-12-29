import { NextRequest, NextResponse } from 'next/server';

/**
 * LEGACY DEALER REPUTATION API (v0.x)
 * 
 * ⚠️ DEPRECATED - Use /api/dealer/reputation-v1 for new implementations
 * This endpoint remains operational during migration phase.
 * 
 * Returns reputation data from:
 * - Carly internal reputation algorithm
 * - Google Places API (future integration)
 * - Verified buyer interactions
 * 
 * NO MOCK DATA - Returns empty/null for unavailable data
 */

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// PHASE 2: Database Integration Placeholder
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// TODO: Connect to real database
// When Prisma is reintroduced:
// 1. Uncomment: import { PrismaClient } from '@prisma/client';
// 2. Initialize: const prisma = new PrismaClient();
// 3. Replace TODO comments with actual database queries
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export interface ReputationScore {
  overallScore: number | null; // 0-100 or null if no data
  grade: 'A' | 'B' | 'C' | 'D' | 'E' | null;
  googleRating: number | null; // Future: from Google Places API
  totalVerifiedReviews: number;
  trustSignals: number;
}

export interface ReputationFactors {
  responseTime: number | null; // Percentage or null
  appointmentCompletionRate: number | null;
  buyerFollowThrough: number | null;
  listingAccuracy: number | null;
  disputeRate: number | null;
  reviewConsistency: number | null;
  interactionsRequired: number; // Minimum to unlock
  currentInteractions: number;
}

export interface ReputationEvent {
  id: string;
  type: 'appointment_completed' | 'test_drive' | 'vehicle_delivered' | 'verified_review' | 'dispute_resolved';
  timestamp: string;
  description: string;
  impact: 'positive' | 'negative' | 'neutral';
}

export interface ReviewSource {
  name: string;
  active: boolean;
  count: number;
  requirementsToActivate?: string;
}

export interface ReputationData {
  score: ReputationScore;
  factors: ReputationFactors;
  events: ReputationEvent[];
  reviewSources: ReviewSource[];
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const dealerId = searchParams.get('dealerId');

    if (!dealerId) {
      return NextResponse.json(
        { error: 'Missing dealerId parameter' },
        { status: 400 }
      );
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // PHASE 2: Replace with actual Prisma queries
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // const reputationScore = await prisma.reputationScore.findFirst({
    //   where: { dealerId },
    // });
    // const events = await prisma.reputationEvent.findMany({
    //   where: { dealerId },
    //   orderBy: { timestamp: 'desc' },
    //   take: 50,
    // });
    // const metrics = await prisma.dealerMetrics.findFirst({
    //   where: { dealerId },
    // });
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    // TODO: Connect to real database

    // Build response (all null-safe)
    const data: ReputationData = {
      score: {
        overallScore: null,
        grade: null,
        googleRating: null,
        totalVerifiedReviews: 0,
        trustSignals: 0,
      },
      factors: {
        responseTime: null,
        appointmentCompletionRate: null,
        buyerFollowThrough: null,
        listingAccuracy: null,
        disputeRate: null,
        reviewConsistency: null,
        interactionsRequired: 10,
        currentInteractions: 0,
      },
      events: [],
      reviewSources: [
        {
          name: 'Carly Verified Reviews',
          active: false,
          count: 0,
          requirementsToActivate: 'Complete at least 1 verified transaction',
        },
        {
          name: 'Google Reviews',
          active: false,
          count: 0,
          requirementsToActivate: 'Connect your Google Business Profile',
        },
        {
          name: 'External Platforms',
          active: false,
          count: 0,
          requirementsToActivate: 'Future integration',
        },
      ],
    };

    return NextResponse.json(data);
  } catch (error) {
    console.error('[Reputation API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reputation data' },
      { status: 500 }
    );
  }
}
