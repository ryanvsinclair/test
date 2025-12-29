/**
 * UNIFIED MESSAGING SERVICE (CLIENT)
 * 
 * Single API client for all messaging operations.
 * All state lives in database, accessed via API calls.
 * 
 * Supports: Buyer↔Buyer, Buyer↔Dealer
 * Listing owners are buyers.
 */

import type { Message, Conversation, SendMessageRequest } from '@/lib/messaging/types';

const API_BASE = '/api/messages';

export const messagingService = {
  /**
   * Get conversations for any user
   * @param userId - User ID (buyer or dealer)
   * @param role - User role ('buyer' | 'dealer')
   */
  async getConversations(userId: string, role: 'buyer' | 'dealer'): Promise<Conversation[]> {
    try {
      const res = await fetch(`${API_BASE}/conversations?user_id=${userId}&role=${role}`, {
        credentials: 'include',
      });
      
      if (!res.ok) {
        throw new Error(`Failed to fetch conversations: ${res.status}`);
      }
      
      return res.json();
    } catch (error) {
      console.error('[MessagingService] Error fetching conversations:', error);
      return [];
    }
  },

  /**
   * Get messages for a specific conversation
   * @param conversationId - Conversation ID
   * @param cursor - Optional cursor for pagination (ISO timestamp)
   */
  async getMessages(conversationId: string, cursor?: string): Promise<Message[]> {
    try {
      const params = new URLSearchParams({ conversation_id: conversationId });
      if (cursor) {
        params.append('cursor', cursor);
      }

      const res = await fetch(`${API_BASE}?${params}`, {
        credentials: 'include',
      });

      if (!res.ok) {
        throw new Error(`Failed to fetch messages: ${res.status}`);
      }

      return res.json();
    } catch (error) {
      console.error('[MessagingService] Error fetching messages:', error);
      return [];
    }
  },

  /**
   * Send message
   * @param request - Message request with client-generated ID
   */
  async sendMessage(request: {
    id: string;
    conversation_id: string;
    content: string;
    sender_id: string;
    sender_name: string;
    sender_type: 'buyer' | 'dealer';
  }): Promise<{ success: boolean; message?: Message }> {
    try {
      const res = await fetch(`${API_BASE}/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Idempotency-Key': request.id,
        },
        credentials: 'include',
        body: JSON.stringify(request),
      });

      if (!res.ok) {
        throw new Error(`Failed to send message: ${res.status}`);
      }

      const data = await res.json();
      return { success: true, message: data };
    } catch (error) {
      console.error('[MessagingService] Error sending message:', error);
      return { success: false };
    }
  },

  /**
   * Find or create conversation
   * @param params - Conversation parameters
   */
  async findOrCreateConversation(params: {
    buyer_id: string;
    buyer_name: string;
    seller_id: string;
    seller_name: string;
    seller_type: 'dealer' | 'buyer';
    listing_id: string | null;
    listing_title?: string | null;
  }): Promise<Conversation | null> {
    try {
      const res = await fetch(`${API_BASE}/conversations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(params),
      });

      if (!res.ok) {
        throw new Error(`Failed to create conversation: ${res.status}`);
      }

      return res.json();
    } catch (error) {
      console.error('[MessagingService] Error creating conversation:', error);
      return null;
    }
  },

  /**
   * Mark conversation as read
   * @param conversationId - Conversation ID
   * @param userId - User ID marking as read
   */
  async markAsRead(conversationId: string, userId: string): Promise<void> {
    try {
      await fetch(`${API_BASE}/conversations/${conversationId}/read`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ user_id: userId }),
      });
    } catch (error) {
      console.error('[MessagingService] Error marking as read:', error);
    }
  },
};
