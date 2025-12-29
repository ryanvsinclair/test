import { NextRequest, NextResponse } from 'next/server';
import { reputationDb } from '@/lib/reputation/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const dealershipId = searchParams.get('dealershipId');

    if (!dealershipId) {
      return NextResponse.json({ error: 'dealershipId is required' }, { status: 400 });
    }

    const score = await reputationDb.getLatestReputationScore(dealershipId);

    if (!score) {
      return NextResponse.json({ error: 'No reputation score found' }, { status: 404 });
    }

    const reviews = await reputationDb.getReviewsByDealership(dealershipId);
    const googleSnapshot = await reputationDb.getLatestExternalSnapshot(
      dealershipId,
      'GOOGLE'
    );

    const staff = await reputationDb.getStaffByDealership(dealershipId);
    const staffScores = await Promise.all(
      staff.map(async (member) => {
        const staffScore = await reputationDb.getLatestStaffReputationScore(member.id);
        return {
          ...member,
          score: staffScore,
        };
      })
    );

    return NextResponse.json({
      score,
      reviews: reviews.slice(0, 10), // Latest 10 reviews
      googleSnapshot,
      staffScores,
    });
  } catch (error) {
    console.error('Error fetching reputation data:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
