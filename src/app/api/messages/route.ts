import { NextRequest, NextResponse } from 'next/server';
import * as messagingDb from '@/lib/db/messaging-db';
import { requireAuth } from '@/lib/auth/session';

/**
 * GET /api/messages
 * 
 * Get messages for a conversation
 * Query params:
 * - conversation_id (required)
 * - cursor (optional): ISO timestamp for pagination
 * - limit (optional): Default 50
 */
export async function GET(req: NextRequest) {
  try {
    // Authenticate user
    const session = await requireAuth(req);

    const { searchParams } = new URL(req.url);
    const conversation_id = searchParams.get('conversation_id');
    const cursor = searchParams.get('cursor');
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    if (!conversation_id) {
      return NextResponse.json(
        { error: 'conversation_id is required' },
        { status: 400 }
      );
    }

    // Validate user is participant in conversation
    const isParticipant = await messagingDb.isParticipant(conversation_id, session.userId);
    if (!isParticipant) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get messages
    const messages = await messagingDb.getMessages(conversation_id, limit, cursor || undefined);

    return NextResponse.json(messages, { status: 200 });
  } catch (error) {
    console.error('[API] Error fetching messages:', error);
    
    if ((error as Error).message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
