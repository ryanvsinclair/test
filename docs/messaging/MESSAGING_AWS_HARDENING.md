# Messaging System AWS Hardening

This document outlines the production-ready messaging architecture implemented for AWS deployment.

## Architecture Overview

### Core Components

1. **Zustand Store** (`src/lib/messaging/store.ts`)
   - Centralized state management
   - Message deduplication by ID
   - Optimistic updates with delivery status tracking
   - Sorted by authoritative timestamp + sequence

2. **WebSocket Hook** (`src/lib/messaging/useWebSocket.ts`)
   - Automatic reconnection with exponential backoff
   - Resubscription on reconnect
   - Heartbeat (ping/pong) for connection health
   - Clean disconnect handling

3. **Polling Fallback** (`src/lib/messaging/useMessagePolling.ts`)
   - Delta fetches (only new messages)
   - Slows down when WebSocket is connected
   - Deduplicates with WebSocket messages

4. **API Layer** (`src/lib/messaging/api.ts`)
   - Idempotent message sending (client-generated UUID)
   - Automatic retry with exponential backoff
   - Handles 409 conflicts gracefully

## AWS Production Features

### 1. Idempotency

**Problem**: Lambda cold starts, network retries, and duplicate WebSocket deliveries can cause duplicate messages.

**Solution**:
- Client generates UUID for each message
- Backend uses UUID as idempotency key
- 409 response returns existing message data
- Store deduplicates by ID

### 2. Message Ordering

**Problem**: Messages can arrive out of order via WebSocket, polling, or retry.

**Solution**:
- All messages sorted by:
  1. Authoritative server timestamp (primary)
  2. Sequence number (secondary)
  3. Client timestamp (fallback)
- Never trust arrival order
- Re-sorting doesn't cause visual jumps (stable keys)

### 3. Optimistic Updates

**Problem**: Network latency makes messaging feel slow.

**Solution**:
- Message appears immediately in UI with `pending` status
- Background send with retry
- Updates to `confirmed` or `failed`
- Opacity indicates pending state

### 4. Reconnection Strategy

**Problem**: WebSocket connections drop frequently on mobile, during Lambda cold starts, or network changes.

**Solution**:
- Exponential backoff: 1s → 2s → 5s → 10s → 30s
- Automatic resubscription to conversation on reconnect
- Polling continues during reconnection
- UI shows reconnection status

### 5. Offline Handling

**Problem**: Users lose connectivity but expect messages to queue.

**Solution**:
- Network status detection via `navigator.onLine`
- Offline banner displayed
- Messages stored in `pendingMessages` map
- Auto-retry when connection restored
- Quick replies disabled when offline

### 6. State Separation

**Problem**: Component-local state causes stale closures and race conditions.

**Solution**:
- Zustand store holds all message data
- Component only renders from store
- No stale closures when switching conversations
- Stable references via `useMemo`

### 7. Scroll Safety

**Problem**: Auto-scroll on new messages disrupts user reading.

**Solution**:
- Auto-scroll only if user is near bottom (within 100px)
- Uses `requestAnimationFrame` to prevent layout thrashing
- Smooth behavior for user-triggered scroll

### 8. Delivery Status Tracking

Messages have explicit lifecycle:
- `pending` - Client-side, not sent
- `sent` - Request sent to server
- `confirmed` - Server acknowledged with timestamp
- `failed` - Retry exhausted

Visual indicators:
- Opacity reduced for pending
- Pulsing dot for sending
- Alert icon for failed
- Timestamp shows when confirmed

## API Routes

### POST /api/messages/send

**Request**:
```json
{
  "id": "uuid",
  "conversation_id": "uuid",
  "content": "message text",
  "client_timestamp": 1234567890
}
```

**Response** (200):
```json
{
  "message_id": "uuid",
  "timestamp": 1234567890,
  "sequence": 123
}
```

**Response** (409 - Duplicate):
Returns existing message data (idempotency)

### GET /api/messages?conversation_id=uuid&after=timestamp

**Response**:
```json
[
  {
    "id": "uuid",
    "conversation_id": "uuid",
    "sender_id": "uuid",
    "sender_type": "buyer" | "dealer",
    "content": "message text",
    "timestamp": 1234567890,
    "sequence": 123,
    "delivery_status": "confirmed"
  }
]
```

## Security Considerations

1. **Authentication**: Auth tokens should be handled by middleware/interceptor (not shown)
2. **Authorization**: Each request must validate user owns conversation
3. **Rate Limiting**: API Gateway should throttle per user
4. **Message Validation**: Content length limits enforced server-side

## Testing Checklist

- [ ] Messages send exactly once (idempotency)
- [ ] Duplicate WebSocket events don't create duplicate bubbles
- [ ] Reconnect doesn't replay old messages
- [ ] Conversation switch doesn't cause race conditions
- [ ] Offline queueing works across refresh
- [ ] Failed messages show retry UI
- [ ] Auto-scroll respects user scroll position
- [ ] Enter key sends message
- [ ] Quick replies disabled when offline
- [ ] Horizontal overflow eliminated

## Future Enhancements

- [ ] IndexedDB for persistent offline queue
- [ ] Message read receipts
- [ ] Typing indicators
- [ ] File attachments via S3 presigned URLs
- [ ] Message editing/deletion
- [ ] Pagination for long conversations
- [ ] Unread count synchronization
