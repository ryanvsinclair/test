import { NextRequest, NextResponse } from 'next/server';
import { validateReviewEligibility, getStageFromEventType } from '@/lib/reputation/events';
import { reputationDb } from '@/lib/reputation/db';
import { recomputeDealershipScore, recomputeStaffScores } from '@/lib/reputation/recompute';
import type { ComplaintScope } from '@/types/reputation';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      dealershipId,
      staffId,
      userId,
      linkedInteractionEventId,
      stars,
      text,
      complaintScope,
      tags,
    } = body;

    if (!dealershipId || !userId || !linkedInteractionEventId || !stars || !text) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Validate eligibility
    const eligibility = await validateReviewEligibility(userId, dealershipId);

    if (!eligibility.eligible) {
      return NextResponse.json(
        { error: 'User has no verified interactions with this dealership' },
        { status: 403 }
      );
    }

    // Check if review already exists for this event
    const existingReview = await reputationDb.getUserReviewForEvent(
      userId,
      linkedInteractionEventId
    );

    if (existingReview) {
      return NextResponse.json(
        { error: 'Review already exists for this interaction' },
        { status: 409 }
      );
    }

    // Get event to determine stage
    const event = await reputationDb.getInteractionEvent(linkedInteractionEventId);

    if (!event) {
      return NextResponse.json({ error: 'Interaction event not found' }, { status: 404 });
    }

    const stage = getStageFromEventType(event.event_type);

    // Validate low rating requires reason
    if (stars <= 2 && (!tags || tags.length === 0)) {
      return NextResponse.json(
        { error: 'Low ratings require at least one reason tag' },
        { status: 400 }
      );
    }

    const review = await reputationDb.createReview({
      dealership_id: dealershipId,
      staff_id: staffId || null,
      user_id: userId,
      linked_interaction_event_id: linkedInteractionEventId,
      stage,
      stars,
      text,
      complaint_scope: (complaintScope as ComplaintScope) || 'PROCESS',
      tags: tags || [],
    });

    // Trigger score recompute
    await recomputeDealershipScore(dealershipId);
    if (staffId) {
      await recomputeStaffScores(dealershipId);
    }

    return NextResponse.json({ success: true, review });
  } catch (error) {
    console.error('Error creating review:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const dealershipId = searchParams.get('dealershipId');

    if (!userId || !dealershipId) {
      return NextResponse.json(
        { error: 'userId and dealershipId are required' },
        { status: 400 }
      );
    }

    const eligibility = await validateReviewEligibility(userId, dealershipId);

    return NextResponse.json(eligibility);
  } catch (error) {
    console.error('Error checking review eligibility:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
