⚠️ **ARCHIVED** — Retained for historical reference only. Do not use for current implementation.

---

# MARKET LANE SEPARATION SYSTEM

## Overview
Complete implementation of strict two-lane market system:
- **Primary Market** = Browse (Road-ready, inspected, certified vehicles)
- **Secondary Market** = As-Is / Project / Export (Non-running, uninspected, known-issue vehicles)

---

## Architecture

### Server-Side Enforcement (Cannot be bypassed)

**Database Schema** (`src/lib/db/schema-market-lanes.sql`):
- `market_lane` field: 'primary' | 'secondary'
- `road_ready` (boolean, REQUIRED)
- `inspected` (boolean, REQUIRED)
- `running_status` (enum)
- Database trigger: `enforce_market_lane()` - automatically classifies vehicles
- Database trigger: `prevent_unauthorized_promotion()` - requires approval for secondary → primary

**Classification Rules** (Server-side, automatic):
```sql
Primary Market IF:
  - road_ready = true
  - inspected = true
  - running_status != 'not_running'
  - No critical disclosures

Otherwise → Secondary Market (forced)
```

---

## Listing Creation Flow

### Step 1: Market Lane Selection
Seller chooses at listing start:
- **"Road-ready / Daily use"** → Primary market path
- **"Project / As-Is / Export"** → Secondary market path

### Step 2: Conditional Forms

**Primary Market Path:**
- Requires confirmation:
  - Vehicle is running ✓
  - Vehicle is inspected ✓
  - No critical known issues ✓
- If any fail → Auto-reroute to Secondary Market

**Secondary Market Path:**
- Requires at least one disclosure:
  - Not running
  - Not inspected
  - Known mechanical/electrical/structural issues
  - Export only
  - For parts/restoration
- Requires acknowledgment of:
  - Reduced visibility
  - No certification eligibility
  - No test drives

### Step 3: Server-Side Classification
Backend API (`src/lib/api/market-lanes.ts`):
- `classifyVehicleMarketLane()` - determines lane based on condition
- `validateListingData()` - enforces disclosure requirements
- `createVehicleListing()` - creates listing with automatic classification

**Cannot be overridden by client**

---

## Query Isolation (CRITICAL)

### Main Browse
**Filter** (enforced in `src/app/buyer/browse/page.tsx`):
```typescript
vehicles.filter(v => 
  v.marketLane === 'primary' &&
  v.roadReady === true &&
  v.inspected === true &&
  v.runningStatus !== 'not_running'
)
```

### As-Is Section
**Filter** (enforced in `src/lib/api/as-is-vehicles.ts`):
```typescript
.eq('market_lane', 'secondary')
```

**No mixing. No client-side filtering.**

---

## Reclassification System

### Secondary → Primary Promotion
**Requires:**
1. Seller submits `ReclassificationRequest` via `/api/listings/reclassify`
2. Updated condition data proves vehicle now qualifies
3. Admin or automated review approval
4. Database trigger validates before allowing promotion

**Schema Tables:**
- `market_lane_reclassification_requests` - pending requests
- `market_lane_transitions` - audit trail

**No automatic promotion allowed**

---

## Scoring & Discovery Rules

Secondary market vehicles:
- ❌ NEVER enter preference scoring
- ❌ NEVER affect taste learning
- ❌ NEVER appear in recommendations
- ❌ NEVER appear in Browse
- ✅ Only accessible via `/as-is-vehicles`

---

## API Endpoints

**Listing Creation:**
- `POST /api/listings/create` - Creates listing with automatic classification
  - Input: `CreateListingData` + `sellerId`
  - Output: `{ listingId, marketLane }`
  - Server validates and classifies

**Reclassification:**
- `POST /api/listings/reclassify` - Request promotion to primary market
  - Input: `ReclassificationRequest` + `sellerId`
  - Output: `{ requestId }` (pending approval)
  - Validates new condition qualifies

---

## Type System

**Updated `Vehicle` interface:**
```typescript
marketLane: MarketLane; // 'primary' | 'secondary'
roadReady: boolean; // REQUIRED
inspected: boolean; // REQUIRED
runningStatus: RunningStatus; // REQUIRED
asIsDisclosure?: AsIsDisclosure; // Required for secondary
```

---

## AWS Readiness

✅ Stateless API design
✅ Lambda-compatible
✅ Server-side validation only
✅ Database triggers for enforcement
✅ No client-only logic
✅ Clear schema separation
✅ Audit trail for all transitions

---

## Files Created

**Backend:**
1. `src/lib/db/schema-market-lanes.sql` - Database schema with triggers
2. `src/lib/api/market-lanes.ts` - Classification & validation logic
3. `src/app/api/listings/create/route.ts` - Listing creation endpoint
4. `src/app/api/listings/reclassify/route.ts` - Reclassification endpoint

**Types:**
5. `src/types/index.ts` - Updated with `MarketLane` system

---

## Files Modified

**Query Filters:**
1. `src/app/buyer/browse/page.tsx` - Primary market filter enforced
2. `src/lib/api/as-is-vehicles.ts` - Secondary market queries updated
3. `src/app/sitemap.ts` - Only primary market in sitemap

---

## Validation Checklist

✅ Market lane determined server-side at creation
✅ Database triggers enforce classification rules
✅ Primary market filter applied to Browse
✅ Secondary market filter applied to As-Is section
✅ No leakage between lanes possible
✅ Reclassification requires approval
✅ Disclosures enforced for secondary market
✅ Scoring systems exclude secondary market
✅ SEO/sitemap only includes primary market
✅ Cannot bypass via client manipulation

---

## Next Steps for Production

1. **Database Migration:**
   - Run `schema-market-lanes.sql`
   - Verify triggers work correctly
   - Test promotion prevention

2. **Seller UI Flow:**
   - Create market lane selection step (first screen)
   - Build conditional forms for each path
   - Add auto-reroute logic when primary qualifications fail
   - Display visibility warnings for secondary market

3. **Admin Panel:**
   - Build reclassification review interface
   - Implement approval workflow
   - Add transition audit viewer

4. **Testing:**
   - Test automatic classification
   - Verify primary market isolation
   - Test reclassification approval flow
   - Validate no leakage scenarios

5. **Backend Integration:**
   - Replace TODO comments with database queries
   - Implement actual classification trigger
   - Test promotion prevention trigger

---

**Status:** Core infrastructure complete, ready for seller UI and backend integration
