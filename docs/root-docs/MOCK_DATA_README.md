# Mock Data System - Investor Demo Mode

## Overview
This app includes a centralized mock data system designed for investor demos and testing without requiring a database connection.

## Quick Start

### Enable Mock Data
```typescript
// src/lib/mock/config.ts
export const ENABLE_MOCK_DATA = true;
```

### Disable Mock Data
```typescript
// src/lib/mock/config.ts
export const ENABLE_MOCK_DATA = false;
```

When disabled, all mock functions return empty arrays or null values, effectively removing mock data from the app.

## Architecture

### Files Structure
```
src/lib/mock/
├── config.ts          # Central toggle (ENABLE_MOCK_DATA)
├── dealer-data.ts     # Mock dealer listings, insights, reputation
└── buyer-data.ts      # Mock saved vehicles, garage, appointments, messages
```

### Integrated Routes
The following API routes use mock data:

**Dealer Routes:**
- `/api/dealer/listings` - Dealer inventory with metrics
- `/api/dealer/insights` - Performance analytics
- `/api/dealer/reputation` - Reputation scores and factors

**Buyer Routes:**
- `/api/buyer/saved-vehicles` - Saved/favorited vehicles
- `/api/buyer/garage` - Owned vehicles (current and considering sale)
- `/api/appointments` - Test drives and inspections (various stages)
- `/api/messages` - Conversations with dealers and listing owners

### How It Works
```typescript
// Mock functions automatically respect the toggle
const mockListings = getMockDealerListings(dealerId);
// Returns full data when ENABLE_MOCK_DATA = true
// Returns [] when ENABLE_MOCK_DATA = false
```

## Complete Removal (Phase 2)

When you're ready to remove mock data entirely:

### Step 1: Remove Mock Imports
```typescript
// DELETE these lines from API routes:
import { getMockDealerListings, getMockStatusCounts } from '@/lib/mock/dealer-data';
```

### Step 2: Delete Mock Files
```bash
rm -rf src/lib/mock/
```

### Step 3: Implement Real Database Queries
```typescript
// Follow the commented sections in each route:
// PHASE 2: Replace with actual Prisma queries
const [listings, statusCounts] = await Promise.all([
  prisma.listing.findMany({ where, orderBy }),
  // ... database queries
]);
```

### Step 4: Clean Up Comments
Search for and remove all `PHASE 2` comment blocks.

## Benefits

✅ **Single Toggle** - Enable/disable all mock data in one place  
✅ **Zero Build Changes** - Mock code doesn't affect production builds  
✅ **Easy Cleanup** - Delete one folder to remove all mock logic  
✅ **Investor Ready** - Realistic demo data out of the box  
✅ **Future Proof** - Clear migration path to real database  

## Customizing Mock Data

Edit `src/lib/mock/dealer-data.ts` to add or modify:
- Listings (vehicles, prices, photos)
- Performance metrics
- Reputation scores
- Trends and analytics

Edit `src/lib/mock/buyer-data.ts` to add or modify:
- Saved vehicles (3 vehicles with dealer info)
- Owned vehicles (2 vehicles - owned and considering sale)
- Appointments (4 appointments: confirmed, pending, completed, cancelled)
- Messages (4 conversations with dealers and listing owners)

All changes automatically propagate to all routes.
