/**
 * Analytics client helper
 * Tracks events with offline queue and automatic retry
 */

type EventType = 'listing_view' | 'listing_save' | 'message_sent';

interface TrackEventPayload {
  eventType: EventType;
  listingId: string;
  dealerId: string;
  actorUserId?: string;
  conversationId?: string;
  meta?: Record<string, any>;
}

const QUEUE_KEY = 'analytics_queue';
const SESSION_ID_KEY = 'analytics_session_id';

/**
 * Get or generate session ID for anonymous tracking
 */
function getSessionId(): string {
  if (typeof window === 'undefined') return '';

  let sessionId = localStorage.getItem(SESSION_ID_KEY);
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem(SESSION_ID_KEY, sessionId);
  }
  return sessionId;
}

/**
 * Get queued events from localStorage
 */
function getQueue(): TrackEventPayload[] {
  if (typeof window === 'undefined') return [];

  try {
    const queue = localStorage.getItem(QUEUE_KEY);
    return queue ? JSON.parse(queue) : [];
  } catch {
    return [];
  }
}

/**
 * Save queued events to localStorage
 */
function saveQueue(queue: TrackEventPayload[]): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  } catch (error) {
    console.error('[Analytics] Failed to save queue:', error);
  }
}

/**
 * Send event to API
 */
async function sendEvent(payload: TrackEventPayload): Promise<boolean> {
  try {
    const response = await fetch('/api/analytics/event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...payload,
        sessionId: getSessionId(),
      }),
    });

    return response.ok;
  } catch (error) {
    console.error('[Analytics] Failed to send event:', error);
    return false;
  }
}

/**
 * Flush queued events
 */
async function flushQueue(): Promise<void> {
  if (typeof window === 'undefined') return;

  const queue = getQueue();
  if (queue.length === 0) return;

  const results = await Promise.allSettled(
    queue.map((event) => sendEvent(event))
  );

  // Remove successfully sent events
  const failedEvents = queue.filter((_, index) => {
    const result = results[index];
    return result.status === 'rejected' || !result.value;
  });

  saveQueue(failedEvents);
}

/**
 * Main tracking function
 * ✅ SAFE: Never blocks UI, handles offline gracefully
 */
export async function trackEvent(
  eventType: EventType,
  payload: Omit<TrackEventPayload, 'eventType'>
): Promise<void> {
  if (typeof window === 'undefined') return;

  const fullPayload: TrackEventPayload = {
    eventType,
    ...payload,
  };

  // Try to send immediately
  const success = await sendEvent(fullPayload);

  if (!success) {
    // Queue for later if failed
    const queue = getQueue();
    queue.push(fullPayload);
    saveQueue(queue);
  }
}

/**
 * Setup automatic queue flushing on network reconnect
 * Call once in app initialization
 */
export function initAnalytics(): void {
  if (typeof window === 'undefined') return;

  // Flush queue on page load
  flushQueue();

  // Flush queue when network reconnects
  window.addEventListener('online', () => {
    console.log('[Analytics] Network reconnected, flushing queue...');
    flushQueue();
  });

  // Flush queue periodically (every 30 seconds)
  setInterval(flushQueue, 30000);
}

/**
 * Helper for listing view tracking
 */
export function trackListingView(listingId: string, dealerId: string, actorUserId?: string) {
  trackEvent('listing_view', { listingId, dealerId, actorUserId });
}

/**
 * Helper for listing save tracking
 */
export function trackListingSave(listingId: string, dealerId: string, actorUserId?: string) {
  trackEvent('listing_save', { listingId, dealerId, actorUserId });
}

/**
 * Helper for message tracking
 */
export function trackMessage(
  listingId: string,
  dealerId: string,
  conversationId: string,
  actorUserId?: string
) {
  trackEvent('message_sent', { listingId, dealerId, conversationId, actorUserId });
}
