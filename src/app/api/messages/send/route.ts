import { NextRequest, NextResponse } from 'next/server';
import type { SendMessageRequest } from '@/lib/messaging/types';
import * as messagingDb from '@/lib/db/messaging-db';
import { requireAuth, validateMessagingPermission } from '@/lib/auth/session';

/**
 * POST /api/messages/send
 * 
 * Send a message
 * Headers:
 * - Cookie: session (HTTP-only JWT)
 * - X-Idempotency-Key: Client-generated UUID (optional)
 * 
 * Body:
 * - id: Message ID (UUID, client-generated)
 * - conversation_id: Conversation ID
 * - content: Message content
 */
export async function POST(req: NextRequest) {
  try {
    // Authenticate user
    const session = await requireAuth(req);

    const body: SendMessageRequest = await req.json();
    const { id, conversation_id, content } = body;

    if (!id || !conversation_id || !content) {
      return NextResponse.json(
        { error: 'Missing required fields: id, conversation_id, content' },
        { status: 400 }
      );
    }

    if (content.trim().length === 0) {
      return NextResponse.json(
        { error: 'Message content cannot be empty' },
        { status: 400 }
      );
    }

    if (content.length > 5000) {
      return NextResponse.json(
        { error: 'Message content too long (max 5000 characters)' },
        { status: 400 }
      );
    }

    // Get conversation to determine seller_type and validate participation
    const isParticipant = await messagingDb.isParticipant(conversation_id, session.userId);
    if (!isParticipant) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get conversation details to enforce role-based permissions
    const conversations = await messagingDb.getConversations(session.userId, session.role, 1, 0);
    const conversation = conversations.find(c => c.id === conversation_id);

    if (!conversation) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Determine sender identity and validate permissions
    let actingAs: 'buyer_id' | 'seller_id';
    
    if (conversation.buyer_id === session.userId) {
      actingAs = 'buyer_id';
    } else if (conversation.seller_id === session.userId) {
      actingAs = 'seller_id';
    } else {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Validate role-based messaging permission
    const hasPermission = validateMessagingPermission(
      session,
      {
        buyer_id: conversation.buyer_id,
        seller_id: conversation.seller_id,
        seller_type: conversation.seller_type,
      },
      actingAs
    );

    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Forbidden: Invalid role for conversation type' },
        { status: 403 }
      );
    }

    // Derive sender_type from session role
    const sender_type = session.role;

    // Send message
    const message = await messagingDb.sendMessage({
      conversationId: conversation_id,
      senderId: session.userId,
      senderName: session.email.split('@')[0], // TODO: Get from user profile
      senderType: sender_type,
      content: content.trim(),
    });

    console.log(`[API] Message sent: ${message.id} by ${session.role} ${session.userId}`);

    return NextResponse.json(
      {
        message_id: message.id,
        timestamp: message.timestamp,
        sequence: message.timestamp,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[API] Error sending message:', error);
    
    if ((error as Error).message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    if ((error as Error).message.startsWith('Forbidden')) {
      return NextResponse.json({ error: (error as Error).message }, { status: 403 });
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
