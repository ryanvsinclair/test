import { NextRequest, NextResponse } from 'next/server';
import { syncGooglePlacesSnapshot } from '@/lib/reputation/googlePlaces';
import { recomputeDealershipScore } from '@/lib/reputation/recompute';

export async function POST(req: NextRequest) {
  try {
    const { dealershipId } = await req.json();

    if (!dealershipId) {
      return NextResponse.json({ error: 'dealershipId is required' }, { status: 400 });
    }

    const success = await syncGooglePlacesSnapshot(dealershipId);

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to sync Google Places data' },
        { status: 500 }
      );
    }

    // Trigger score recompute
    await recomputeDealershipScore(dealershipId);

    return NextResponse.json({
      success: true,
      message: 'Google Places data synced and score recomputed',
    });
  } catch (error) {
    console.error('Error syncing Google Places:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
