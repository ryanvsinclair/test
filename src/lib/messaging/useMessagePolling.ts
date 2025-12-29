import { useEffect, useRef } from 'react';
import { useMessagingStore } from './store';
import { fetchMessages } from './api';

const POLL_INTERVAL_MS = 5000; // 5 seconds
const POLL_INTERVAL_SLOW_MS = 15000; // 15 seconds when WS is connected

interface UseMessagePollingOptions {
  conversationId: string;
  enabled?: boolean;
  wsConnected?: boolean;
}

/**
 * Fallback polling mechanism
 * - Polls for new messages when WebSocket is unavailable
 * - Slows down when WebSocket is connected (reduced redundancy)
 * - Only fetches delta (messages after last timestamp)
 */
export function useMessagePolling({
  conversationId,
  enabled = true,
  wsConnected = false,
}: UseMessagePollingOptions) {
  const intervalRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (!enabled) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      return;
    }

    const pollInterval = wsConnected ? POLL_INTERVAL_SLOW_MS : POLL_INTERVAL_MS;

    const poll = async () => {
      try {
        const store = useMessagingStore.getState();
        const lastTimestamp = store.lastFetchedTimestamp.get(conversationId) || 0;
        
        // Fetch only new messages
        const newMessages = await fetchMessages(conversationId, lastTimestamp);

        if (newMessages.length > 0) {
          // Add new messages
          newMessages.forEach((message) => {
            store.addMessage(message);
          });

          // Deduplicate in case WS also delivered
          store.deduplicateMessages(conversationId);

          // Update last fetched timestamp
          const maxTimestamp = Math.max(...newMessages.map((m) => m.timestamp));
          store.lastFetchedTimestamp.set(conversationId, maxTimestamp);
        }
      } catch (error) {
        console.error('[Polling] Failed to fetch messages:', error);
      }
    };

    // Initial poll
    poll();

    // Set interval
    intervalRef.current = setInterval(poll, pollInterval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [conversationId, enabled, wsConnected]);
}
