import { NextRequest, NextResponse } from 'next/server';
import { disable2FA } from '@/lib/auth/auth-provider';

/**
 * POST /api/auth/2fa/disable
 * Disable two-factor authentication for user
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

    const result = await disable2FA(userId);

    if (result.success) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json(
        { error: result.error || 'Failed to disable 2FA' },
        { status: 500 }
      );
    }
  } catch (error: unknown) {
    console.error('Failed to disable 2FA:', error);
    return NextResponse.json(
      { error: 'Failed to disable 2FA' },
      { status: 500 }
    );
  }
}
