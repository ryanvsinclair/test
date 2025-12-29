/**
 * CARLY REPUTATION API v1.0
 * 
 * Returns reputation data calculated from the event ledger using CarlyScore engine.
 * Replaces derived-metric logic with event-driven calculation.
 */

import { NextRequest, NextResponse } from 'next/server';
import { calculateDealershipScore } from '@/lib/reputation/carly-score-v1';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const dealershipId = searchParams.get('dealershipId');
    const includeAgents = searchParams.get('includeAgents') === 'true';

    if (!dealershipId) {
      return NextResponse.json(
        { error: 'Missing dealershipId parameter' },
        { status: 400 }
      );
    }

    // TODO: Fetch Google Business Profile data from database
    // For now, assume NOT connected (strict fallback rule applies)
    const googleData = undefined; // { connected: false, rating: 0, reviewCount: 0 }

    // Calculate reputation using CarlyScore v1.0 engine
    const reputationData = await calculateDealershipScore(dealershipId, {
      includeAgents,
      googleData,
    });

    // Transform to API response format
    const response = {
      score: {
        overallScore: reputationData.carlyScore,
        grade: reputationData.grade,
        reputationComposite: reputationData.reputationComposite,
        googleRating: googleData?.connected ? googleData.rating : null,
        googleConnected: googleData?.connected || false,
        totalVerifiedReviews: reputationData.metadata.verifiedInteractions,
        trustSignals: reputationData.recentEvents.filter(e => 
          e.type === 'APPOINTMENT_ATTENDED' || e.type === 'VERIFIED_REVIEW_SUBMITTED'
        ).length,
      },
      
      factors: {
        behavior: Math.round(reputationData.components.behavior * 100),
        reliability: Math.round(reputationData.components.reliability * 100),
        trustSafety: Math.round(reputationData.components.trustSafety * 100),
        penaltyMultiplier: reputationData.components.penaltyMultiplier,
        interactionsRequired: 10,
        currentInteractions: reputationData.metadata.verifiedInteractions,
      },
      
      breakdown: {
        behavior: {
          label: 'Behavior Quality',
          score: Math.round(reputationData.components.behavior * 100),
          description: 'Response speed, conversation progression, verified sentiment',
        },
        reliability: {
          label: 'Reliability',
          score: Math.round(reputationData.components.reliability * 100),
          description: 'Appointment follow-through, listing accuracy',
        },
        trustSafety: {
          label: 'Trust & Safety',
          score: Math.round(reputationData.components.trustSafety * 100),
          description: 'Dispute history, safety record',
        },
      },
      
      events: reputationData.recentEvents.map(e => ({
        id: e.id,
        type: e.type,
        timestamp: e.timestamp.toISOString(),
        description: formatEventDescription(e),
        impact: determineEventImpact(e.type),
      })),
      
      drivers: reputationData.drivers,
      nextBestActions: reputationData.nextBestActions,
      
      reviewSources: [
        {
          name: 'Carly Verified Reviews',
          active: reputationData.metadata.verifiedInteractions > 0,
          count: reputationData.metadata.verifiedInteractions,
          requirementsToActivate: reputationData.metadata.verifiedInteractions === 0 
            ? 'Complete at least 1 verified transaction' 
            : undefined,
        },
        {
          name: 'Google Reviews',
          active: googleData?.connected || false,
          count: googleData?.reviewCount || 0,
          rating: googleData?.rating || null,
          requirementsToActivate: !googleData?.connected 
            ? 'Google Business Profile not connected (optional)' 
            : undefined,
        },
        {
          name: 'External Platforms',
          active: false,
          count: 0,
          requirementsToActivate: 'Future integration',
        },
      ],
      
      metadata: {
        confidenceLevel: reputationData.metadata.confidenceLevel,
        isColdStart: reputationData.metadata.isColdStart,
        totalEvents: reputationData.metadata.totalEvents,
        outlierAgentCount: reputationData.outlierAgentCount,
        googleConnected: googleData?.connected || false,
        compositeCalculation: !googleData?.connected 
          ? 'ReputationComposite = CarlyScore (Google not connected)'
          : 'ReputationComposite = 75% CarlyScore + 15% Sentiment + 10% Google',
      },
      
      agents: includeAgents ? reputationData.agentScores.map(a => ({
        agentId: a.agentId,
        carlyScore: a.carlyScore,
        grade: a.grade,
        isOutlier: a.isOutlier,
        components: {
          behavior: Math.round(a.components.behavior * 100),
          reliability: Math.round(a.components.reliability * 100),
          trustSafety: Math.round(a.components.trustSafety * 100),
        },
      })) : undefined,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('[Reputation v1 API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reputation data' },
      { status: 500 }
    );
  }
}

function formatEventDescription(event: any): string {
  const typeMap: Record<string, string> = {
    MESSAGE_FIRST_REPLY: 'First reply to buyer inquiry',
    APPOINTMENT_CONFIRMED: 'Appointment confirmed',
    APPOINTMENT_ATTENDED: 'Appointment completed',
    APPOINTMENT_NO_SHOW_DEALER: 'Missed appointment',
    LISTING_VIN_MISMATCH: 'Listing accuracy issue detected',
    DISPUTE_OPENED: 'Buyer dispute opened',
    DISPUTE_RESOLVED: 'Dispute resolved',
    VERIFIED_REVIEW_SUBMITTED: 'Verified buyer review received',
    DEAL_COMPLETED: 'Vehicle deal completed',
  };
  
  return typeMap[event.type] || event.type;
}

function determineEventImpact(type: string): 'positive' | 'negative' | 'neutral' {
  const positiveEvents = ['APPOINTMENT_ATTENDED', 'VERIFIED_REVIEW_SUBMITTED', 'DEAL_COMPLETED', 'DISPUTE_RESOLVED'];
  const negativeEvents = ['APPOINTMENT_NO_SHOW_DEALER', 'LISTING_VIN_MISMATCH', 'DISPUTE_OPENED', 'SAFETY_VIOLATION'];
  
  if (positiveEvents.includes(type)) return 'positive';
  if (negativeEvents.includes(type)) return 'negative';
  return 'neutral';
}
