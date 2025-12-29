import type { Message, SendMessageRequest, SendMessageResponse } from './types';

// AWS-safe API base URL configuration
const API_BASE = typeof window !== 'undefined'
  ? (process.env.NEXT_PUBLIC_API_BASE || '/api')
  : '/api';
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

/**
 * Idempotent message send with automatic retry
 * Uses client-generated UUID for idempotency
 */
export async function sendMessage(
  request: SendMessageRequest,
  retryCount = 0
): Promise<SendMessageResponse> {
  try {
    const response = await fetch(`${API_BASE}/messages/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Auth token should be handled by middleware/interceptor
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      if (response.status === 409) {
        // Message already sent (idempotency key collision)
        const data = await response.json();
        return data; // Return existing message data
      }

      if (response.status >= 500 && retryCount < MAX_RETRIES) {
        // Server error - retry with exponential backoff
        await sleep(RETRY_DELAY_MS * Math.pow(2, retryCount));
        return sendMessage(request, retryCount + 1);
      }

      throw new Error(`Failed to send message: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    if (retryCount < MAX_RETRIES) {
      // Network error - retry
      await sleep(RETRY_DELAY_MS * Math.pow(2, retryCount));
      return sendMessage(request, retryCount + 1);
    }
    throw error;
  }
}

/**
 * Fetch messages for a conversation with delta support
 * Only fetches messages after the given timestamp
 */
export async function fetchMessages(
  conversationId: string,
  after?: number
): Promise<Message[]> {
  const params = new URLSearchParams({
    conversation_id: conversationId,
    ...(after && { after: after.toString() }),
  });

  const response = await fetch(`${API_BASE}/messages?${params}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch messages: ${response.status}`);
  }

  return await response.json();
}

/**
 * Fetch conversations list with pagination
 */
export async function fetchConversations(
  limit = 50,
  offset = 0
): Promise<any[]> {
  const params = new URLSearchParams({
    limit: limit.toString(),
    offset: offset.toString(),
  });

  const response = await fetch(`${API_BASE}/conversations?${params}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch conversations: ${response.status}`);
  }

  return await response.json();
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
