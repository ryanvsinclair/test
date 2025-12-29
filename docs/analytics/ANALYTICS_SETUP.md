# Analytics System Setup

## Prerequisites

- Node.js 18+
- PostgreSQL 14+ (local or AWS RDS)
- npm or yarn

## Installation

1. **Install Prisma dependencies:**

```bash
npm install @prisma/client
npm install -D prisma
```

2. **Set up environment variables:**

Create a `.env` file in the project root:

```env
DATABASE_URL="postgresql://username:password@localhost:5432/carly?schema=public"
```

For AWS RDS, use the RDS connection string:

```env
DATABASE_URL="postgresql://username:password@your-rds-endpoint.rds.amazonaws.com:5432/carly?schema=public"
```

3. **Generate Prisma Client:**

```bash
npx prisma generate
```

4. **Run migrations:**

```bash
npx prisma migrate deploy
```

For development:

```bash
npx prisma migrate dev
```

## Usage

### Initialize Analytics on App Load

Add to your root layout or app entry point:

```typescript
'use client';

import { useEffect } from 'react';
import { initAnalytics } from '@/lib/analytics/client';

export default function RootLayout({ children }) {
  useEffect(() => {
    initAnalytics();
  }, []);

  return <>{children}</>;
}
```

### Track Events

**Listing Views:**

```typescript
import { trackListingView } from '@/lib/analytics/client';

// On listing page mount
useEffect(() => {
  trackListingView(listingId, dealerId, currentUserId);
}, [listingId]);
```

**Listing Saves:**

```typescript
import { trackListingSave } from '@/lib/analytics/client';

// On save button click
const handleSave = () => {
  trackListingSave(listingId, dealerId, currentUserId);
  // ... rest of save logic
};
```

**Messages:**

```typescript
import { trackMessage } from '@/lib/analytics/client';

// After successful message send
const handleSendMessage = async () => {
  await sendMessage(content);
  trackMessage(listingId, dealerId, conversationId, currentUserId);
};
```

### Fetch Insights

The Insights page automatically fetches data from `/api/dealer/insights`.

To use the API elsewhere:

```typescript
const response = await fetch('/api/dealer/insights?dealerId=dealer-001&range=7');
const data = await response.json();

// data.insights: Array of listing metrics
// data.totals: Aggregated totals
// data.range: Number of days
```

## Architecture

### Event Model

Events are append-only and serve as the source of truth:

- `listing_view`: Deduped per viewer per 6 hours
- `listing_save`: Tracked every time
- `message_sent`: Tracked every time

### Aggregation Model

Daily metrics are updated atomically in a transaction when events are ingested.

### View Deduplication

Views are deduped using:
```
dedupeKey = eventType:listingId:userId/sessionId:timeBucket(6h)
```

## AWS Deployment

The system is AWS-ready:

- Uses PostgreSQL (compatible with AWS RDS)
- Node runtime only (no edge functions)
- No serverless pipelines required
- DATABASE_URL environment variable

### RDS Setup

1. Create PostgreSQL RDS instance
2. Note connection string
3. Set DATABASE_URL in environment
4. Run migrations: `npx prisma migrate deploy`

## Development

### View Database

```bash
npx prisma studio
```

### Reset Database (development only)

```bash
npx prisma migrate reset
```

### Add New Event Types

1. Update `EventType` in `/api/analytics/event/route.ts`
2. Add increment logic for new metric field
3. Update Prisma schema if new metrics needed
4. Create migration: `npx prisma migrate dev --name add_new_metric`

## Troubleshooting

**Connection errors:**
- Verify DATABASE_URL is correct
- Check PostgreSQL is running
- Ensure firewall allows connections

**Events not appearing:**
- Check browser console for network errors
- Verify API route is accessible
- Check localStorage for queued events

**Insights not loading:**
- Ensure dealerId is correct
- Check API logs for errors
- Verify data exists in ListingMetricsDaily table
