import { NextRequest, NextResponse } from 'next/server';
import { sendPasswordResetEmail } from '@/lib/auth/auth-provider';

/**
 * POST /api/auth/password-reset
 * Send password reset email
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { error: 'Email required' },
        { status: 400 }
      );
    }

    const result = await sendPasswordResetEmail(
      email,
      `${req.nextUrl.origin}/auth/reset-password`
    );

    if (result.success) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json(
        { error: result.error || 'Failed to send reset email' },
        { status: 500 }
      );
    }
  } catch (error: unknown) {
    console.error('Failed to send password reset email:', error);
    return NextResponse.json(
      { error: 'Failed to send reset email' },
      { status: 500 }
    );
  }
}
