import { NextRequest, NextResponse } from 'next/server';
import { getNotificationPreferences, saveNotificationPreferences } from '@/lib/api/notification-preferences';

/**
 * GET /api/notifications/preferences
 * Fetch user notification preferences
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json({ error: 'User ID required' }, { status: 400 });
  }

  try {
    const preferences = await getNotificationPreferences(userId);
    return NextResponse.json({ preferences });
  } catch (error: unknown) {
    console.error('Failed to fetch notification preferences:', error);
    return NextResponse.json(
      { error: 'Failed to fetch preferences' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/notifications/preferences
 * Save user notification preferences
 */
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, preferences } = body;

    if (!userId || !preferences) {
      return NextResponse.json(
        { error: 'User ID and preferences required' },
        { status: 400 }
      );
    }

    const success = await saveNotificationPreferences(userId, preferences);

    if (success) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json(
        { error: 'Failed to save preferences' },
        { status: 500 }
      );
    }
  } catch (error: unknown) {
    console.error('Failed to save notification preferences:', error);
    return NextResponse.json(
      { error: 'Failed to save preferences' },
      { status: 500 }
    );
  }
}
