import { NextRequest, NextResponse } from 'next/server';
import { enable2FA } from '@/lib/auth/auth-provider';

/**
 * POST /api/auth/2fa/enable
 * Enable two-factor authentication for user
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

    const result = await enable2FA(userId);

    if (result.secret && result.qrCode) {
      return NextResponse.json({
        secret: result.secret,
        qrCode: result.qrCode,
      });
    } else {
      return NextResponse.json(
        { error: result.error || 'Failed to enable 2FA' },
        { status: 500 }
      );
    }
  } catch (error: unknown) {
    console.error('Failed to enable 2FA:', error);
    return NextResponse.json(
      { error: 'Failed to enable 2FA' },
      { status: 500 }
    );
  }
}
