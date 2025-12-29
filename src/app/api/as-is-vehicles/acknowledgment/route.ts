import { NextRequest, NextResponse } from 'next/server';
import { hasUserAcknowledgedAsIs, recordAsIsAcknowledgment } from '@/lib/api/as-is-vehicles';

/**
 * GET /api/as-is-vehicles/acknowledgment
 * Check if user has acknowledged AS-IS disclaimer
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId');
  
  if (!userId) {
    return NextResponse.json(
      { error: 'User ID required' },
      { status: 400 }
    );
  }
  
  try {
    const acknowledged = await hasUserAcknowledgedAsIs(userId);
    return NextResponse.json({ acknowledged });
  } catch (error: unknown) {
    console.error('[AS-IS API] Error checking acknowledgment:', error);
    return NextResponse.json(
      { error: 'Failed to check acknowledgment' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/as-is-vehicles/acknowledgment
 * Record user acknowledgment of AS-IS disclaimer
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId } = body;
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID required' },
        { status: 400 }
      );
    }
    
    // Get IP and User-Agent from headers
    const ipAddress = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || undefined;
    const userAgent = req.headers.get('user-agent') || undefined;
    
    const success = await recordAsIsAcknowledgment(userId, ipAddress, userAgent);
    
    if (success) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json(
        { error: 'Failed to record acknowledgment' },
        { status: 500 }
      );
    }
  } catch (error: unknown) {
    console.error('[AS-IS API] Error recording acknowledgment:', error);
    return NextResponse.json(
      { error: 'Failed to record acknowledgment' },
      { status: 500 }
    );
  }
}
