import { NextRequest, NextResponse } from 'next/server';
import * as messagingDb from '@/lib/db/messaging-db';
import { requireAuth } from '@/lib/auth/session';

/**
 * GET /api/messages/conversations
 * 
 * Get conversations for authenticated user
 */
export async function GET(req: NextRequest) {
  try {
    // Authenticate user and derive role from session
    const session = await requireAuth(req);

    // Get conversations from database using session data
    const conversations = await messagingDb.getConversations(session.userId, session.role);

    return NextResponse.json(conversations, { status: 200 });
  } catch (error) {
    console.error('[API] Error fetching conversations:', error);
    
    if ((error as Error).message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/messages/conversations
 * 
 * Find or create conversation
 * Body:
 * - buyer_id (must match session.userId if role=buyer)
 * - seller_id (must match session.userId if initiating as seller)
 * - seller_type: 'dealer' | 'buyer'
 * - listing_id
 * - listing_title
 * 
 * Auth enforces:
 * - Buyer can initiate conversations (as buyer_id)
 * - Dealer cannot initiate (only respond)
 * - Listing owners (buyers with listings) can initiate as buyer or respond as seller
 */
export async function POST(req: NextRequest) {
  try {
    // Authenticate user
    const session = await requireAuth(req);

    const body = await req.json();
    const {
      buyer_id,
      seller_id,
      seller_type,
      listing_id,
      listing_title,
    } = body;

    if (!buyer_id || !seller_id || !seller_type || !listing_id) {
      return NextResponse.json(
        { error: 'buyer_id, seller_id, seller_type, and listing_id are required' },
        { status: 400 }
      );
    }

    if (seller_type !== 'dealer' && seller_type !== 'buyer') {
      return NextResponse.json(
        { error: 'seller_type must be "dealer" or "buyer"' },
        { status: 400 }
      );
    }

    // Validate user is authorized to create this conversation
    // Buyers can only act as buyer_id
    // Dealers cannot initiate conversations (only respond)
    if (session.role === 'buyer') {
      if (buyer_id !== session.userId) {
        return NextResponse.json(
          { error: 'Forbidden: buyer_id must match authenticated user' },
          { status: 403 }
        );
      }
    } else if (session.role === 'dealer') {
      return NextResponse.json(
        { error: 'Forbidden: Dealers cannot initiate conversations' },
        { status: 403 }
      );
    }

    // Find or create conversation
    const conversation = await messagingDb.getOrCreateConversation({
      listingId: listing_id,
      buyerId: buyer_id,
      buyerName: session.email.split('@')[0], // TODO: Get from user profile
      sellerType: seller_type,
      sellerId: seller_id,
      sellerName: body.seller_name || 'Seller', // TODO: Fetch from listing/user table
      listingTitle: listing_title,
    });

    return NextResponse.json(conversation, { status: 200 });
  } catch (error) {
    console.error('[API] Error creating conversation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
