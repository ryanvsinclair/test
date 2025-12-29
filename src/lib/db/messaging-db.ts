/**
 * MESSAGING SERVICE (RLS-ENFORCED)
 * 
 * All queries use Supabase client with RLS enforcement.
 * Access control handled by database policies - no manual filtering needed.
 * 
 * RLS Policies (defined in schema-rls.sql):
 * - Conversations: Only participants can view/update
 * - Messages: Only conversation participants can view/send
 */

import { createClient } from '@/lib/supabase/server';
import type { Message, Conversation } from '@/lib/messaging/types';

// ... rest of file unchanged ...

/**
 * Get or create conversation (idempotent)
 * RLS enforced: Only participants can create/view conversations
 */
export async function getOrCreateConversation(params: {
  listingId: string;
  buyerId: string;
  buyerName: string;
  sellerType: 'dealer' | 'buyer';
  sellerId: string;
  sellerName: string;
  listingTitle: string | null;
}): Promise<Conversation> {
  const { listingId, buyerId, sellerType, sellerId } = params;
  
  const supabase = await createClient();

  // Try to find existing conversation (RLS automatically filters to participant-only)
  const { data: existing, error: fetchError } = await supabase
    .from('conversations')
    .select('*')
    .eq('listing_id', listingId)
    .eq('buyer_id', buyerId)
    .eq('dealer_id', sellerId)
    .maybeSingle();

  if (fetchError) {
    throw new Error(`Failed to fetch conversation: ${fetchError.message}`);
  }

  if (existing) {
    return mapConversationFromSupabase(existing);
  }

  // Create new conversation
  // RLS WITH CHECK ensures user is a participant (buyer_id or dealer_id matches auth.uid())
  const { data: created, error: insertError } = await supabase
    .from('conversations')
    .insert({
      buyer_id: buyerId,
      dealer_id: sellerId,
      listing_id: listingId,
      last_message_at: null,
      unread_count_buyer: 0,
      unread_count_dealer: 0,
      archived_by_buyer: false,
      archived_by_dealer: false
    })
    .select()
    .single();

  if (insertError) {
    // Handle duplicate - might have been created by another request
    if (insertError.code === '23505') {
      const { data: retry } = await supabase
        .from('conversations')
        .select('*')
        .eq('listing_id', listingId)
        .eq('buyer_id', buyerId)
        .eq('dealer_id', sellerId)
        .single();
      
      if (retry) return mapConversationFromSupabase(retry);
    }
    throw new Error(`Failed to create conversation: ${insertError.message}`);
  }

  return mapConversationFromSupabase(created);
}

/**
 * Get conversations for a user
 * RLS enforced: Automatically filters to conversations where user is participant
 * @param userId - User ID (not used - RLS uses auth.uid())
 * @param role - User role (not used - RLS handles filtering)
 */
export async function getConversations(
  userId: string, // Kept for API compatibility, not used (RLS uses auth.uid())
  role: 'buyer' | 'dealer', // Kept for API compatibility, not used
  limit: number = 50,
  offset: number = 0
): Promise<Conversation[]> {
  const supabase = await createClient();

  // RLS policy "Participants can view conversations" automatically filters
  // to conversations where buyer_id = auth.uid() OR dealer_id = auth.uid()
  const { data, error } = await supabase
    .from('conversations')
    .select('*, listing:listings(title)')
    .order('last_message_at', { ascending: false, nullsFirst: false })
    .range(offset, offset + limit - 1);

  if (error) {
    throw new Error(`Failed to fetch conversations: ${error.message}`);
  }

  return (data || []).map(mapConversationFromSupabase);
}

/**
 * Get messages for a conversation
 * RLS enforced: Only conversation participants can view messages
 */
export async function getMessages(
  conversationId: string,
  limit: number = 50,
  cursor?: string
): Promise<Message[]> {
  const supabase = await createClient();

  let query = supabase
    .from('messages')
    .select('*, sender:profiles!messages_sender_id_fkey(name)')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (cursor) {
    query = query.gt('created_at', cursor);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch messages: ${error.message}`);
  }

  return (data || []).map(mapMessageFromSupabase);
}

/**
 * Send message
 * RLS enforced: Only conversation participants can send messages
 */
export async function sendMessage(params: {
  conversationId: string;
  senderId: string; // Kept for API compatibility, not used (RLS uses auth.uid())
  senderName: string; // Not needed - can fetch from profiles
  senderType: 'buyer' | 'dealer'; // Not needed - determined from conversation
  content: string;
}): Promise<Message> {
  const { conversationId, content } = params;
  
  const supabase = await createClient();

  // Insert message - RLS WITH CHECK validates sender is participant
  const { data, error } = await supabase
    .from('messages')
    .insert({
      conversation_id: conversationId,
      sender_id: (await supabase.auth.getUser()).data.user?.id,
      content: content,
      status: 'sent'
    })
    .select('*, sender:profiles!messages_sender_id_fkey(name)')
    .single();

  if (error) {
    throw new Error(`Failed to send message: ${error.message}`);
  }

  // Update conversation last_message_at
  await supabase
    .from('conversations')
    .update({ last_message_at: new Date().toISOString() })
    .eq('id', conversationId);

  return mapMessageFromSupabase(data);
}
      ) VALUES (
        gen_random_uuid(), $1, $2, $3, $4, $5, NOW(), 'sent'
      )
      RETURNING *`,
      [conversationId, senderId, senderName, senderType, content.trim()]
    );

    const messageRow = messageResult.rows[0];

    // Update conversation (triggers will handle last_message_at and unread counts)
    await client.query(
      `UPDATE conversations
       SET updated_at = NOW()
       WHERE id = $1`,
      [conversationId]
    );

    await client.query('COMMIT');
    
    return mapMessage(messageRow);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Mark conversation as read
 * RLS enforced: Only participants can mark their side as read
 */
export async function markAsRead(conversationId: string, userId: string): Promise<void> {
  const supabase = await createClient();
  
  // Mark messages as read
  await supabase
    .from('messages')
    .update({ read_at: new Date().toISOString() })
    .eq('conversation_id', conversationId)
    .neq('sender_id', userId)
    .is('read_at', null);

  // Get conversation to determine if user is buyer or dealer
  const { data: conv } = await supabase
    .from('conversations')
    .select('buyer_id, dealer_id')
    .eq('id', conversationId)
    .single();

  if (!conv) return;

  const isBuyer = conv.buyer_id === userId;
  const field = isBuyer ? 'unread_count_buyer' : 'unread_count_dealer';

  // Reset unread count
  await supabase
    .from('conversations')
    .update({ [field]: 0 })
    .eq('id', conversationId);
}

/**
 * Check if user is participant in conversation
 * RLS enforced: Query will return empty if user is not participant
 */
export async function isParticipant(conversationId: string, userId: string): Promise<boolean> {
  const supabase = await createClient();
  
  const { data } = await supabase
    .from('conversations')
    .select('id')
    .eq('id', conversationId)
    .maybeSingle();

  // If RLS allows us to see the conversation, user is a participant
  return data !== null;
}

// Mapping helpers
function mapConversationFromSupabase(row: any): Conversation {
  return {
    id: row.id,
    buyer_id: row.buyer_id,
    buyer_name: '', // Can fetch from profiles if needed
    seller_id: row.dealer_id,
    seller_name: '', // Can fetch from profiles if needed
    seller_type: 'dealer',
    listing_id: row.listing_id,
    listing_title: row.listing?.title || null,
    last_message_timestamp: row.last_message_at ? new Date(row.last_message_at).getTime() : 0,
    unread_count_buyer: row.unread_count_buyer,
    unread_count_seller: row.unread_count_dealer,
    created_at: row.created_at,
    updated_at: row.updated_at,
    status: 'active', // Simplified - can add archived status if needed
  };
}

function mapMessageFromSupabase(row: any): Message {
  return {
    id: row.id,
    conversation_id: row.conversation_id,
    sender_id: row.sender_id,
    sender_name: row.sender?.name || '',
    sender_type: 'buyer', // Can determine from conversation if needed
    content: row.content,
    timestamp: new Date(row.created_at).getTime(),
    created_at: row.created_at,
    delivery_status: row.delivery_status === 'sent' ? 'confirmed' : row.delivery_status,
    read_at: row.read_at ? new Date(row.read_at).getTime() : undefined,
  };
}
