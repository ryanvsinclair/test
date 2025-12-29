import { NextRequest, NextResponse } from 'next/server';
import { recordInteractionEvent } from '@/lib/reputation/events';
import { recomputeDealershipScore } from '@/lib/reputation/recompute';
import type { EventType, VerificationMethod } from '@/types/reputation';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      dealershipId,
      staffId,
      userId,
      eventType,
      verificationMethod,
      metadata,
      occurredAt,
    } = body;

    if (!dealershipId || !userId || !eventType || !verificationMethod) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const event = await recordInteractionEvent({
      dealershipId,
      staffId,
      userId,
      eventType: eventType as EventType,
      verificationMethod: verificationMethod as VerificationMethod,
      metadata,
      occurredAt: occurredAt ? new Date(occurredAt) : undefined,
    });

    // Trigger score recompute
    await recomputeDealershipScore(dealershipId);

    return NextResponse.json({ success: true, event });
  } catch (error) {
    console.error('Error recording interaction event:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
