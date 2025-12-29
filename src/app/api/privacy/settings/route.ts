import { NextRequest, NextResponse } from 'next/server';
import { getPrivacySettings, savePrivacySettings } from '@/lib/api/privacy-settings';

/**
 * GET /api/privacy/settings
 * Fetch user privacy settings
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json({ error: 'User ID required' }, { status: 400 });
  }

  try {
    const settings = await getPrivacySettings(userId);
    return NextResponse.json({ settings });
  } catch (error: unknown) {
    console.error('Failed to fetch privacy settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/privacy/settings
 * Save user privacy settings
 */
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, settings } = body;

    if (!userId || !settings) {
      return NextResponse.json(
        { error: 'User ID and settings required' },
        { status: 400 }
      );
    }

    const success = await savePrivacySettings(userId, settings);

    if (success) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json(
        { error: 'Failed to save settings' },
        { status: 500 }
      );
    }
  } catch (error: unknown) {
    console.error('Failed to save privacy settings:', error);
    return NextResponse.json(
      { error: 'Failed to save settings' },
      { status: 500 }
    );
  }
}
