import { Conversation, Message } from '@/types';
// Mock data removed - connect to real database

/**
 * MESSAGING MODEL (CRITICAL):
 * 
 * In Carly's authentication model:
 * - Buyers (auth role) includes listing owners
 * - Dealers are a separate authenticated role
 * 
 * Conversation participants:
 * - buyer_id: Buyer user (may or may not own listings)
 * - seller_id: Either a dealer OR another buyer (listing owner)
 * - seller_type: 'dealer' OR 'buyer' (determined by listing ownership)
 * 
 * Supported conversation types:
 * - Buyer ↔ Dealer (seller_type = 'dealer')
 * - Buyer ↔ Buyer (seller_type = 'buyer')
 * 
 * Role determination is based on user.role, NOT separate auth systems.
 */

// In-memory store (replace with actual database later)
let conversations: Conversation[] = [];
let messages: Message[] = [];

export const messageService = {
  // Find or create conversation
  findOrCreateConversation: (
    buyerId: string,
    buyerName: string,
    dealerId: string,
    dealerName: string,
    vehicleId: string,
    vehicleTitle: string
  ): Conversation => {
    // Check if conversation already exists
    let conversation = conversations.find(
      conv => 
        conv.buyerId === buyerId && 
        conv.dealerId === dealerId && 
        conv.vehicleId === vehicleId
    );

    if (!conversation) {
      // Create new conversation
      conversation = {
        id: `conv-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        buyerId,
        buyerName,
        dealerId,
        dealerName,
        vehicleId,
        vehicleTitle,
        unreadCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      conversations.push(conversation);
    }

    return conversation;
  },

  // Send message
  sendMessage: (
    conversationId: string,
    senderId: string,
    senderName: string,
    content: string
  ): Message => {
    const message: Message = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      conversationId,
      senderId,
      senderName,
      content,
      read: false,
      createdAt: new Date().toISOString(),
    };

    messages.push(message);

    // Update conversation
    const conversation = conversations.find(c => c.id === conversationId);
    if (conversation) {
      conversation.lastMessage = message;
      conversation.lastMessagePreview = content.substring(0, 100);
      conversation.updatedAt = new Date().toISOString();
      
      // Increment unread count for receiver
      if (senderId !== conversation.buyerId && senderId !== conversation.dealerId) {
        conversation.unreadCount++;
      }
    }

    return message;
  },

  // Get conversations for buyers (includes listing owners)
  getConversationsForBuyer: (userId: string): Conversation[] => {
    // TODO: Replace with real database query
    return conversations
      .filter(c => c.buyerId === userId)
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  },

  // Get conversations for dealers
  getConversationsForDealer: (dealerId: string): Conversation[] => {
    return conversations
      .filter(c => c.dealerId === dealerId)
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  },

  // Universal method: Get conversations for any user based on role
  getConversationsForUser: (userId: string, role: 'buyer' | 'dealer'): Conversation[] => {
    if (role === 'dealer') {
      return messageService.getConversationsForDealer(userId);
    } else {
      // Role 'buyer' (includes listing owners)
      return messageService.getConversationsForBuyer(userId);
    }
  },

  // Get messages for conversation
  getMessages: (conversationId: string): Message[] => {
    // TODO: Connect to real database
    return messages
      .filter(m => m.conversationId === conversationId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  },

  // Mark conversation as read
  markAsRead: (conversationId: string, userId: string): void => {
    const conversation = conversations.find(c => c.id === conversationId);
    if (!conversation) return;

    // Mark all messages from other party as read
    messages
      .filter(m => m.conversationId === conversationId && m.senderId !== userId)
      .forEach(m => m.read = true);

    conversation.unreadCount = 0;
  },

  // Get conversation by ID
  getConversation: (conversationId: string): Conversation | undefined => {
    return conversations.find(c => c.id === conversationId);
  },

  // Close conversation (buyer disengages)
  closeConversation: (
    conversationId: string,
    userId: string,
    reason: string | null
  ): void => {
    const conversation = conversations.find(c => c.id === conversationId);
    if (!conversation) return;

    // Store closure metadata (in real implementation, save to DB)
    const closureData = {
      conversationId,
      closedBy: userId,
      closedAt: new Date().toISOString(),
      reason,
    };

    // Log for analytics (server-side only in production)
    console.log('[BUYER_DISENGAGE]', closureData);

    // Track for bulk messaging exclusion
    if (typeof window === 'undefined') {
      // Server-side only: update bulk messaging exclusion list
      const { bulkMessageService } = require('./bulk-messaging');
      bulkMessageService.trackDisengagement(conversationId);
    }

    // Remove conversation from active list
    // In real implementation: set status to 'closed_by_buyer' in DB
    // and enforce server-side rules to prevent dealer from messaging
    conversations = conversations.filter(c => c.id !== conversationId);
  },
};
