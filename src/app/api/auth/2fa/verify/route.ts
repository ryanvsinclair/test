import { NextRequest, NextResponse } from 'next/server';
import { verify2FAEnrollment } from '@/lib/auth/auth-provider';

/**
 * POST /api/auth/2fa/verify
 * Verify 2FA code and complete enrollment
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, code } = body;

    if (!userId || !code) {
      return NextResponse.json(
        { error: 'User ID and code required' },
        { status: 400 }
      );
    }

    const result = await verify2FAEnrollment(code);

    if (result.success) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json(
        { error: result.error || 'Invalid verification code' },
        { status: 400 }
      );
    }
  } catch (error: unknown) {
    console.error('Failed to verify 2FA code:', error);
    return NextResponse.json(
      { error: 'Failed to verify code' },
      { status: 500 }
    );
  }
}
