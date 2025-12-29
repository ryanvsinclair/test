import { NextRequest, NextResponse } from 'next/server';
import { requestReclassification } from '@/lib/api/market-lanes';

/**
 * POST /api/listings/reclassify
 * Request reclassification from secondary to primary market
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { request, sellerId } = body;
    
    if (!sellerId) {
      return NextResponse.json(
        { error: 'Seller ID required' },
        { status: 400 }
      );
    }
    
    if (!request) {
      return NextResponse.json(
        { error: 'Reclassification request data required' },
        { status: 400 }
      );
    }
    
    const result = await requestReclassification(request, sellerId);
    
    if (result.success) {
      return NextResponse.json({
        success: true,
        requestId: result.requestId,
        message: 'Reclassification request submitted for review'
      });
    } else {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }
  } catch (error: unknown) {
    console.error('[Reclassification API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to submit reclassification request' },
      { status: 500 }
    );
  }
}
