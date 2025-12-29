# Marketplace Mode Toggle Implementation

## Overview
Implemented three marketplace modes with strict vehicle eligibility rules and mutually exclusive display logic.

---

## Marketplace Modes

### 1. Carly Verified (Default)
**Eligibility:**
- `running = true`
- `inspection_uploaded = true`
- `issue_severity <= minor`

**Behavior:**
- Preference scoring and personalization enabled
- Full smart sorting with user preferences
- Main marketplace experience

### 2. The Hub
**Eligibility:**
- `running = true`
- `inspection_uploaded` optional
- `issue_severity = minor`
- `estimated_fixes_required = true`

**Behavior:**
- Preference scoring and personalization enabled
- Vehicles need minor fixes before daily use
- Shows running but not fully Carly Verified vehicles

### 3. Builder's Market
**Eligibility (any of):**
- `running = false`
- `inspection_uploaded = false`
- `intended_use IN (export, restoration, parts, track)`

**Behavior:**
- **NO personalization or preference scoring**
- Deterministic sorting only
- Project vehicles, export, restoration, parts

---

## Implementation Details

### Components Created

**`MarketplaceModeToggle.tsx`**
- Segmented toggle with 3 modes
- Icons: CheckCircle (Carly Verified), Wrench (The Hub), Hammer (Builder's)
- Contextual descriptions that change per mode
- Warning styling for Builder's Market

**`mode-filter.ts`**
- `filterVehiclesByMode()` - Filters vehicles by marketplace mode
- `getVehicleMarketplaceMode()` - Determines which mode a vehicle belongs to
- `shouldApplyPersonalization()` - Controls whether personalization applies
- `validateVehicleForMode()` - Validates vehicle data

### Type System Updates

**Added to `types/index.ts`:**
```typescript
export type MarketplaceMode = 'road-ready' | 'near-road-ready' | 'builders-market';
export type IssueSeverity = 'none' | 'minor' | 'moderate' | 'major' | 'critical';
export type IntendedUse = 'daily-driver' | 'export' | 'restoration' | 'parts' | 'track';

// Vehicle interface extended with:
running: boolean;
inspectionUploaded: boolean;
issueSeverity: IssueSeverity;
estimatedFixesRequired?: boolean;
intendedUse?: IntendedUse;
```

### Browse Page Integration

**State Management:**
- Mode stored in sessionStorage (per-session persistence)
- Mode change resets pagination and sorting
- Mode selection triggers re-filter

**Filtering Order:**
1. Filter by marketplace mode (strict separation)
2. Apply search/manual filters
3. Apply hidden vehicle filters
4. Apply sorting (with/without personalization)

**Sorting Logic:**
- Carly Verified + The Hub: Personalization enabled
- Builder's Market: No personalization (deterministic only)

---

## Behavior Rules

### Mutual Exclusivity
- Vehicles appear in **ONLY ONE** mode
- Classification priority:
  1. Builder's Market (if disqualified)
  2. Carly Verified (if fully qualified)
  3. The Hub (if running but needs fixes)
  4. Builder's Market (fallback)

### Mode Switching
- Resets `currentPage` to 1
- Resets `sortOption` to 'newest-first'
- Clears results and refetches

### Personalization
```typescript
shouldApplyPersonalization(mode):
  - road-ready: true
  - near-road-ready: true
  - builders-market: false
```

---

## Mock Data Updates

Updated first 3 vehicles in `mock-data.ts` with:
- `marketLane: 'primary'`
- `roadReady: true`
- `inspected: true`
- `runningStatus: 'running'`
- `running: true`
- `inspectionUploaded: true`
- `issueSeverity: 'none' | 'minor'`
- `intendedUse: 'daily-driver'`

---

## UI/UX

### Toggle Location
- Positioned below search bar and smart search indicator
- Above sort controls
- Full-width container with centered toggle

### Contextual Messaging
**Carly Verified:**
> "Showing inspected vehicles that are running and ready for daily use."

**The Hub:**
> "Showing running vehicles that may need minor fixes before daily use."

**Builder's Market:**
> ⚠️ "Showing project vehicles including non-running, uninspected, or vehicles intended for export, restoration, parts, or track use."

### Visual Design
- Segmented control with border
- Active state: background + shadow
- Inactive state: muted text
- Builder's Market description: Amber warning styling

---

## Next Steps

1. **Mock Data Expansion:**
   - Add vehicles for each mode
   - Ensure representative coverage
   - Test edge cases

2. **Backend Integration:**
   - Add mode fields to database schema
   - Update API to filter by mode server-side
   - Implement validation

3. **Analytics:**
   - Track mode switching behavior
   - Monitor mode distribution
   - Measure conversion per mode

4. **Testing:**
   - Verify vehicles appear in only one mode
   - Test mode switching clears filters
   - Validate personalization toggle

---

## Files Created
1. `src/components/marketplace/MarketplaceModeToggle.tsx`
2. `src/lib/marketplace/mode-filter.ts`
3. `MARKETPLACE_MODE_TOGGLE.md`

## Files Modified
1. `src/types/index.ts`
2. `src/app/buyer/browse/page.tsx`
3. `src/lib/api/mock-data.ts`
