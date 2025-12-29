import { NextRequest, NextResponse } from 'next/server';
import { recomputeDealershipScore, recomputeAllDealerships } from '@/lib/reputation/recompute';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { dealershipId } = body;

    if (dealershipId) {
      // Recompute single dealership
      await recomputeDealershipScore(dealershipId);
      return NextResponse.json({
        success: true,
        message: 'Dealership score recomputed',
        dealershipId,
      });
    } else {
      // Recompute all dealerships (batched)
      const count = await recomputeAllDealerships();
      return NextResponse.json({
        success: true,
        message: `Recomputed ${count} dealerships`,
        count,
      });
    }
  } catch (error) {
    console.error('Error recomputing scores:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
