import { create } from 'zustand';
import type { Message, Conversation, MessageUpdate } from './types';
import { sendMessage, fetchMessages } from './api';

interface PendingMessage {
  id: string;
  conversation_id: string;
  content: string;
  client_timestamp: number;
  retry_count: number;
}

interface MessagingState {
  conversations: Map<string, Conversation>;
  messages: Map<string, Message[]>; // conversationId -> messages
  pendingMessages: Map<string, PendingMessage>; // messageId -> pending
  lastFetchedTimestamp: Map<string, number>; // conversationId -> timestamp
  
  // Actions
  setConversations: (conversations: Conversation[]) => void;
  addMessage: (message: Message) => void;
  updateMessage: (messageId: string, updates: Partial<Message>) => void;
  setMessages: (conversationId: string, messages: Message[]) => void;
  sendMessageOptimistic: (conversationId: string, content: string, senderId: string, senderType: 'buyer' | 'dealer') => Promise<void>;
  handleMessageUpdate: (update: MessageUpdate) => void;
  deduplicateMessages: (conversationId: string) => void;
}

/**
 * Centralized messaging state with Zustand
 * - Handles optimistic updates
 * - Deduplicates messages
 * - Maintains delivery state
 * - Sorts by authoritative timestamp
 */
export const useMessagingStore = create<MessagingState>((set, get) => ({
  conversations: new Map(),
  messages: new Map(),
  pendingMessages: new Map(),
  lastFetchedTimestamp: new Map(),

  setConversations: (conversations) => {
    set((state) => {
      const newMap = new Map(state.conversations);
      conversations.forEach((conv) => newMap.set(conv.id, conv));
      return { conversations: newMap };
    });
  },

  addMessage: (message) => {
    set((state) => {
      const conversationMessages = state.messages.get(message.conversation_id) || [];
      
      // Check for duplicate
      const exists = conversationMessages.some((m) => m.id === message.id);
      if (exists) {
        return state; // Skip duplicate
      }

      const updated = [...conversationMessages, message];
      
      // Sort by timestamp (authoritative), then sequence, then client_timestamp
      updated.sort((a, b) => {
        if (a.timestamp !== b.timestamp) return a.timestamp - b.timestamp;
        if (a.sequence && b.sequence) return a.sequence - b.sequence;
        return (a.client_timestamp || 0) - (b.client_timestamp || 0);
      });

      const newMessages = new Map(state.messages);
      newMessages.set(message.conversation_id, updated);

      return { messages: newMessages };
    });
  },

  updateMessage: (messageId, updates) => {
    set((state) => {
      const newMessages = new Map(state.messages);
      
      newMessages.forEach((messages, conversationId) => {
        const index = messages.findIndex((m) => m.id === messageId);
        if (index !== -1) {
          const updated = [...messages];
          updated[index] = { ...updated[index], ...updates };
          newMessages.set(conversationId, updated);
        }
      });

      return { messages: newMessages };
    });
  },

  setMessages: (conversationId, messages) => {
    set((state) => {
      const newMessages = new Map(state.messages);
      
      // Sort messages
      const sorted = [...messages].sort((a, b) => {
        if (a.timestamp !== b.timestamp) return a.timestamp - b.timestamp;
        if (a.sequence && b.sequence) return a.sequence - b.sequence;
        return (a.client_timestamp || 0) - (b.client_timestamp || 0);
      });
      
      newMessages.set(conversationId, sorted);

      // Update last fetched timestamp
      const lastTimestamp = Math.max(...messages.map((m) => m.timestamp), 0);
      const newLastFetched = new Map(state.lastFetchedTimestamp);
      newLastFetched.set(conversationId, lastTimestamp);

      return { 
        messages: newMessages,
        lastFetchedTimestamp: newLastFetched,
      };
    });
  },

  sendMessageOptimistic: async (conversationId, content, senderId, senderType) => {
    const messageId = crypto.randomUUID();
    const clientTimestamp = Date.now();

    // Create optimistic message
    const optimisticMessage: Message = {
      id: messageId,
      conversation_id: conversationId,
      sender_id: senderId,
      sender_type: senderType,
      content,
      timestamp: clientTimestamp, // Will be replaced with server timestamp
      client_timestamp: clientTimestamp,
      delivery_status: 'pending',
    };

    // Add to UI immediately
    get().addMessage(optimisticMessage);

    // Track pending
    set((state) => {
      const newPending = new Map(state.pendingMessages);
      newPending.set(messageId, {
        id: messageId,
        conversation_id: conversationId,
        content,
        client_timestamp: clientTimestamp,
        retry_count: 0,
      });
      return { pendingMessages: newPending };
    });

    try {
      // Send to backend
      const response = await sendMessage({
        id: messageId,
        conversation_id: conversationId,
        content,
        client_timestamp: clientTimestamp,
      });

      // Update with server timestamp
      get().updateMessage(messageId, {
        timestamp: response.timestamp,
        sequence: response.sequence,
        delivery_status: 'confirmed',
      });

      // Remove from pending
      set((state) => {
        const newPending = new Map(state.pendingMessages);
        newPending.delete(messageId);
        return { pendingMessages: newPending };
      });
    } catch (error) {
      console.error('Failed to send message:', error);
      
      // Mark as failed
      get().updateMessage(messageId, {
        delivery_status: 'failed',
      });

      // Keep in pending for retry
      set((state) => {
        const pending = state.pendingMessages.get(messageId);
        if (pending) {
          const newPending = new Map(state.pendingMessages);
          newPending.set(messageId, {
            ...pending,
            retry_count: pending.retry_count + 1,
          });
          return { pendingMessages: newPending };
        }
        return state;
      });
    }
  },

  handleMessageUpdate: (update) => {
    if (update.type === 'new_message' && update.message) {
      get().addMessage(update.message);
      
      // Deduplicate in case it arrived via both WS and polling
      get().deduplicateMessages(update.conversation_id);
    } else if (update.type === 'message_confirmed' && update.message) {
      get().updateMessage(update.message.id, {
        delivery_status: 'confirmed',
        timestamp: update.message.timestamp,
        sequence: update.message.sequence,
      });
    }
  },

  deduplicateMessages: (conversationId) => {
    set((state) => {
      const messages = state.messages.get(conversationId);
      if (!messages) return state;

      // Deduplicate by ID
      const seen = new Set<string>();
      const deduplicated = messages.filter((message) => {
        if (seen.has(message.id)) {
          return false;
        }
        seen.add(message.id);
        return true;
      });

      if (deduplicated.length === messages.length) {
        return state; // No duplicates
      }

      const newMessages = new Map(state.messages);
      newMessages.set(conversationId, deduplicated);
      return { messages: newMessages };
    });
  },
}));
