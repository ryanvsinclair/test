# UNIFIED MARKETPLACE WITH ROAD READINESS STATES

## Overview
Refactored platform to use single unified marketplace with explicit vehicle road-readiness states as single source of truth.

---

## 1. Vehicle State Model

### Single Source of Truth
Every listing has exactly ONE `road_readiness_state`:
- `carly_verified`
- `the_hub`
- `builders_market`

This field is the ONLY source for:
- UI rendering
- Filtering logic
- Ranking algorithms
- SEO metadata
- Personalization

**NO runtime inference allowed**

---

## 2. Listing Creation

### Automatic State Determination
State is automatically determined server-side based on:

```typescript
function determineRoadReadinessState(data) {
  // Builder's Market if:
  // - Not running
  // - OR no inspection AND has builder intent
  // - OR major/critical issues
  if (!running || (!inspection && builderIntent) || severity >= major) {
    return 'builders_market';
  }
  
  // Carly Verified if:
  // - Running + Inspection + No/minor issues
  if (running && inspection && (severity == none || severity == minor)) {
    return 'carly_verified';
  }
  
  // Default: The Hub
  return 'the_hub';
}
```

### Seller Cannot Override
- State assigned automatically
- Database trigger enforces logic
- Seller sees confirmation before publish
- Clear explanation of assigned state

### State Confirmation UI
Component: `StateConfirmation.tsx`
- Shows assigned state with icon & color
- Explains WHY state was assigned
- Lists implications for visibility/ranking
- Requires explicit confirmation

---

## 3. Browse Filters

### Top-Level Toggles
Component: `RoadReadinessFilter.tsx`

Three independent toggles:
- [Carly Verified] (default: ON)
- [The Hub] (default: ON)
- [Builder's Market] (default: OFF)

### Filter Persistence
- Stored in localStorage per user
- Backend table: `user_browse_preferences`
- AWS-backed for logged-in users

### Default State
```typescript
showCarlyVerified: true
showTheHub: true
showBuildersMarket: false
```

---

## 4. Visual Markers

### Badge Component
`RoadReadinessBadge.tsx` - Displays on ALL listings

**Colors:**
- Carly Verified: Green (CheckCircle icon)
- The Hub: Amber (Wrench icon)
- Builder's Market: Red (Hammer icon)

**Sizes:**
- `sm` - 10px text (cards)
- `md` - 12px text (lists)
- `lg` - 14px text (detail pages)

**Locations:**
- Vehicle cards (top-left)
- Browse rows
- Detail pages
- Garage/saved views
- Search results
- Comparison views

---

## 5. Ranking Rules

### State-Based Scoring
```typescript
carly_verified: 100 (highest)
the_hub: 75 (slightly lower)
builders_market: 0 (excluded unless toggled)
```

### Personalization Rules
- Carly Verified: Personalization enabled
- The Hub: Personalization enabled
- Builder's Market: NO personalization unless saved/engaged

### Sort Behavior
When ONLY Builder's Market enabled:
- Deterministic sorting only
- No preference scoring

When mixed or non-builder:
- Full personalization applies

---

## 6. Actions by State

### Road Ready
- ✅ Test drives available
- ✅ Financing options
- ✅ CTA: "Contact Seller"

### Near Road Ready
- ⚠️ Test drives with disclaimer
- ✅ Financing options
- ⚠️ CTA: "Contact Seller - Minor Fixes Required"

### Builder's Market
- ❌ NO test drives
- ❌ NO financing
- ⚠️ CTA: "Contact Seller (As-Is Vehicle)"
- ⚠️ Visible disclosure warning

---

## 7. SEO & Metadata

### Structured Data
Include in JSON-LD:
```json
{
  "@type": "Car",
  "vehicleCondition": "carly_verified" | "the_hub" | "builders_market"
}
```

### Disclosure Text
Builder's Market listings must display:
> ⚠️ **As-Is Vehicle:** This vehicle is sold as-is and may not be road-ready. Intended for project use, export, restoration, parts, or track.

---

## 8. AWS Readiness

### Server-Side Enforcement
- Database trigger: `auto_set_road_readiness_state()`
- Function: `determine_road_readiness_state()`
- NO client-side state inference
- State stored in database, indexed

### Database Schema
```sql
road_readiness_state TEXT NOT NULL 
  CHECK (road_readiness_state IN ('carly_verified', 'the_hub', 'builders_market'))

CREATE INDEX idx_road_readiness_state ON vehicle_listings(road_readiness_state);
```

### User Preferences
```sql
CREATE TABLE user_browse_preferences (
  user_id UUID PRIMARY KEY,
  show_carly_verified BOOLEAN DEFAULT true,
  show_the_hub BOOLEAN DEFAULT true,
  show_builders_market BOOLEAN DEFAULT false,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## Files Created

### Backend
1. `src/lib/db/schema-road-readiness.sql` - Database schema & triggers
2. `src/lib/marketplace/road-readiness.ts` - State determination logic

### Frontend
3. `src/components/marketplace/RoadReadinessFilter.tsx` - Filter toggles
4. `src/components/upload/StateConfirmation.tsx` - Pre-publish confirmation
5. `src/components/listing/MarketplaceModeBadge.tsx` - Updated badge component (backward compatible)

### Documentation
6. `UNIFIED_MARKETPLACE.md` - This file

---

## Files Modified

1. `src/types/index.ts` - Added `RoadReadinessState` type, marked `MarketplaceMode` as deprecated
2. `src/app/buyer/browse/page.tsx` - Replaced mode toggle with road readiness filters
3. `src/components/cards/vehicle-card.tsx` - Updated to use `RoadReadinessBadge`

---

## Migration Path

### Backward Compatibility
- `MarketplaceMode` type kept for backward compatibility
- Badge component supports both old and new types
- Automatic conversion: `road-ready` → `carly_verified`

### Data Migration
```sql
UPDATE vehicle_listings
SET road_readiness_state = CASE
  WHEN marketplace_mode = 'road-ready' THEN 'carly_verified'
  WHEN marketplace_mode = 'near-road-ready' THEN 'the_hub'
  WHEN marketplace_mode = 'builders-market' THEN 'builders_market'
END;
```

---

## Testing Checklist

✅ State determined correctly at upload  
✅ State explanation shown before publish  
✅ Badges display on all views  
✅ Default filters: Carly Verified + The Hub ON, Builder's Market OFF  
✅ Filter preferences persist  
✅ Builder's Market excluded by default  
✅ Builder's Market: no test drives  
✅ Builder's Market: no personalization  
✅ Ranking follows state priority  
✅ SEO includes state in metadata  

---

**Status:** Unified marketplace implemented with road readiness states as single source of truth. Transparent, scalable, AWS-ready.
