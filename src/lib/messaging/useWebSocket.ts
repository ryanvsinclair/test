import { useEffect, useRef, useCallback, useState } from 'react';
import type { MessageUpdate, ConnectionState } from './types';

// Use safe environment variable fallback for AWS deployment
const WS_BASE = typeof window !== 'undefined' 
  ? (process.env.NEXT_PUBLIC_WS_BASE || `ws://${window.location.host}`)
  : 'ws://localhost:3000';
const RECONNECT_DELAYS = [1000, 2000, 5000, 10000, 30000]; // Exponential backoff

interface UseWebSocketOptions {
  conversationId: string;
  onMessage: (update: MessageUpdate) => void;
  enabled?: boolean;
}

/**
 * Production-ready WebSocket hook with:
 * - Automatic reconnection with exponential backoff
 * - Resubscription on reconnect
 * - Heartbeat/ping-pong
 * - Clean disconnect handling
 */
export function useWebSocket({
  conversationId,
  onMessage,
  enabled = true,
}: UseWebSocketOptions) {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttemptRef = useRef(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const heartbeatIntervalRef = useRef<NodeJS.Timeout>();
  const [connectionState, setConnectionState] = useState<ConnectionState>({
    status: 'disconnected',
  });

  const connect = useCallback(() => {
    if (!enabled || wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    setConnectionState((prev) => ({
      ...prev,
      status: reconnectAttemptRef.current > 0 ? 'reconnecting' : 'connecting',
      reconnect_attempt: reconnectAttemptRef.current,
    }));

    try {
      const ws = new WebSocket(`${WS_BASE}/messages`);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('[WS] Connected');
        reconnectAttemptRef.current = 0;
        setConnectionState({
          status: 'connected',
          last_connected: Date.now(),
        });

        // Subscribe to conversation
        ws.send(
          JSON.stringify({
            type: 'subscribe',
            conversation_id: conversationId,
          })
        );

        // Start heartbeat
        heartbeatIntervalRef.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'ping' }));
          }
        }, 30000); // 30 seconds
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.type === 'pong') {
            return; // Heartbeat response
          }

          onMessage(data as MessageUpdate);
        } catch (error) {
          console.error('[WS] Failed to parse message:', error);
        }
      };

      ws.onerror = (error) => {
        console.error('[WS] Error:', error);
      };

      ws.onclose = () => {
        console.log('[WS] Disconnected');
        setConnectionState((prev) => ({
          ...prev,
          status: 'disconnected',
        }));

        // Clear heartbeat
        if (heartbeatIntervalRef.current) {
          clearInterval(heartbeatIntervalRef.current);
        }

        // Attempt reconnection if enabled
        if (enabled) {
          const delay =
            RECONNECT_DELAYS[
              Math.min(reconnectAttemptRef.current, RECONNECT_DELAYS.length - 1)
            ];
          reconnectAttemptRef.current++;

          console.log(
            `[WS] Reconnecting in ${delay}ms (attempt ${reconnectAttemptRef.current})...`
          );

          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, delay);
        }
      };
    } catch (error) {
      console.error('[WS] Connection failed:', error);
      setConnectionState((prev) => ({
        ...prev,
        status: 'disconnected',
      }));
    }
  }, [conversationId, onMessage, enabled]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  }, []);

  // Connect on mount, disconnect on unmount
  useEffect(() => {
    if (enabled) {
      connect();
    }

    return () => {
      disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId, enabled]);

  // Reconnect when conversation changes
  useEffect(() => {
    if (enabled && wsRef.current?.readyState === WebSocket.OPEN) {
      // Resubscribe to new conversation
      wsRef.current.send(
        JSON.stringify({
          type: 'subscribe',
          conversation_id: conversationId,
        })
      );
    }
  }, [conversationId, enabled]);

  return {
    connectionState,
    reconnect: connect,
    disconnect,
  };
}
