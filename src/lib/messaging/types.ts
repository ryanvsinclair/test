export interface Message {
  id: string; // UUID generated client-side
  conversation_id: string;
  sender_id: string;
  sender_type: 'buyer' | 'dealer'; // Derived from auth role, used for unread count logic
  sender_name: string;
  content: string;
  timestamp: number; // Authoritative server timestamp (ms)
  sequence?: number; // Optional sequence number for ordering
  client_timestamp?: number; // Client-side timestamp for optimistic rendering
  delivery_status: 'pending' | 'sent' | 'confirmed' | 'failed';
  retry_count?: number;
  read_at?: number | null;
  created_at: string; // ISO timestamp
  metadata?: Record<string, any>;
}

export interface Conversation {
  id: string;
  buyer_id: string;
  buyer_name: string;
  seller_id: string; // Can be dealer OR buyer (listing owner)
  seller_name: string;
  seller_type: 'dealer' | 'buyer'; // Only two types: dealer or buyer
  listing_id: string | null;
  listing_title: string | null;
  last_message_timestamp: number;
  last_message_content?: string;
  unread_count_buyer: number;
  unread_count_seller: number;
  created_at: string;
  updated_at: string;
  status: 'active' | 'closed_by_buyer' | 'closed_by_seller';
  metadata?: Record<string, any>;
}

export interface SendMessageRequest {
  id: string; // Client-generated idempotency key
  conversation_id: string;
  content: string;
  client_timestamp: number;
}

export interface SendMessageResponse {
  message_id: string;
  timestamp: number;
  sequence?: number;
}

export interface MessageUpdate {
  type: 'new_message' | 'message_confirmed' | 'typing' | 'read';
  conversation_id: string;
  message?: Message;
  user_id?: string;
}

export interface ConnectionState {
  status: 'connecting' | 'connected' | 'disconnected' | 'reconnecting';
  last_connected?: number;
  reconnect_attempt?: number;
}
