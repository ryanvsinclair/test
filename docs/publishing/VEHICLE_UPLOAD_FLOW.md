# Vehicle Upload Flow Refactor

## Overview
Complete refactor of vehicle upload/listing creation flow with explicit marketplace mode selection and strict validation.

---

## Three Marketplace Modes

### 1. Carly Verified
**Requirements (All mandatory):**
- Running condition = true
- Inspection upload (PDF/image)
- Issue severity = "none" or "minor"

**Validation:**
- Blocks submission if inspection missing
- Blocks if vehicle not running
- Blocks if issues > minor

### 2. The Hub
**Requirements:**
- Running condition = true
- Issue severity = "minor"
- Estimated fixes (at least one)

**Optional:**
- Inspection upload (encouraged)

**Validation:**
- Blocks if not running
- Blocks if severity ≠ minor
- Blocks if no fixes selected

### 3. Builder's Market
**Requirements (At least one):**
- Running condition = false
- OR No inspection available
- OR Intended use selected (export, restoration, parts, track)

**Mandatory:**
- Disclosure acknowledgment checkbox

**Validation:**
- Blocks if no criteria met
- Blocks if disclosure not acknowledged

---

## Upload Flow

### Step 1: Mode Selection (Mandatory)
- 3 mode cards with full descriptions
- Requirements listed per mode
- Buyer expectations explained
- Warning: Mode cannot be changed after publishing

### Step 2: Basic Info
- Make, model, year, price, mileage, description, images

### Step 3: Mode-Specific Fields (Conditional)
**All Modes:**
- Running condition (radio buttons)
- Issue severity (radio buttons)

**Carly Verified & The Hub:**
- Inspection file upload (drag & drop)

**The Hub Only:**
- Estimated fixes checklist (predefined options)

**Builder's Market Only:**
- Intended use checkboxes
- Disclosure acknowledgment (required)

### Step 4: Review & Submit
- Shows all data
- Validates marketplace mode requirements
- Detects misclassification
- Blocks submission with clear errors

---

## Hard Validation Rules

### Server-Side Enforcement
**Database triggers validate:**
- Carly Verified: running + inspection + minor issues max
- The Hub: running + minor severity + fixes listed
- Builder's Market: non-running OR no inspection OR project intent + disclosure

### Misclassification Detection
**Automatically suggests correct mode if:**
- Non-running vehicle selected for Carly Verified/The Hub
- No inspection for Carly Verified
- Major/critical issues not in Builder's Market
- Moderate issues in Carly Verified

### Mode Change Prevention
- After publishing, mode changes require admin review
- Tracked in `marketplace_mode_change_requests` table
- Database trigger blocks unauthorized changes

---

## Data Model (AWS-Ready)

### New Fields
```sql
marketplace_mode TEXT NOT NULL -- 'carly_verified', 'the_hub', 'builders_market'
running BOOLEAN NOT NULL
inspection_uploaded BOOLEAN NOT NULL
inspection_file_url TEXT
issue_severity TEXT NOT NULL -- 'none', 'minor', 'moderate', 'major', 'critical'
estimated_fixes TEXT[] -- Array of fixes
intended_use TEXT[] -- Array of uses
disclosure_acknowledged BOOLEAN
```

### Database Triggers
1. `validate_carly_verified_listing()` - Enforces Carly Verified requirements
2. `validate_the_hub_listing()` - Enforces The Hub requirements
3. `validate_builders_market_listing()` - Enforces Builder's Market requirements
4. `prevent_mode_change_without_review()` - Blocks unauthorized mode changes

---

## UI Components

### MarketplaceModeSelection.tsx
- 3 mode selection cards
- Color-coded (green, blue, amber)
- Shows requirements, description, buyer expectations
- Warning for Builder's Market
- Info card about mode permanence

### ModeSpecificFields.tsx
- Conditional fields based on selected mode
- Real-time validation feedback
- Error messages for invalid combinations
- Drag & drop inspection upload
- Predefined checklists for fixes/uses
- Disclosure checkbox with warning styling

---

## API Integration

### POST /api/upload/vehicle
**Input:**
```typescript
{
  sellerId: string;
  listing: {
    marketplaceMode: MarketplaceMode; // REQUIRED
    running: boolean;
    issueSeverity: IssueSeverity;
    inspectionFile?: File;
    estimatedFixes?: string[];
    intendedUse?: IntendedUse[];
    disclosureAcknowledged?: boolean;
    // ... basic vehicle info
  }
}
```

**Validation:**
1. Check marketplace mode provided
2. Validate mode-specific requirements
3. Detect misclassification
4. Block if validation fails

**Response:**
```typescript
{
  success: boolean;
  listingId?: string;
  marketplaceMode?: MarketplaceMode;
  error?: string;
  validationErrors?: string[];
}
```

---

## Validation Functions

### validateMarketplaceModeRequirements()
- Checks all mode-specific requirements
- Returns errors and warnings
- Enforced server-side

### detectModeMisclassification()
- Compares inputs to selected mode
- Suggests correct mode if mismatched
- Provides reason for suggestion

---

## Predefined Options

### Estimated Fixes (The Hub)
- Brake pad replacement
- Tire replacement
- Battery replacement
- Oil change and service
- Air filter replacement
- Windshield repair
- Minor bodywork
- Interior cleaning
- Headlight/taillight replacement
- Alignment needed
- Other minor repairs

### Intended Use (Builder's Market)
- Export
- Restoration
- Parts
- Track

---

## Downstream Behavior

### marketplace_mode Controls:
- **Where listing appears** (Browse toggle filter)
- **Personalization** (Road/Near Road Ready only)
- **Buyer expectations** (contextual messaging)

### Strict Separation:
- Builder's Market NEVER in Road Ready views
- Road Ready NEVER in Builder's Market
- Each vehicle in exactly ONE mode

---

## Future-Proofing

### Inspection Verification
- Schema supports `inspection_file_url`
- Ready for third-party verification services
- Can add verification status field

### Mobile Support
- Upload flow works identically on web/mobile
- File upload uses standard input (mobile camera support)
- All validation runs server-side

### Compliance
- Server-side validation only
- Database triggers enforce rules
- Audit trail for mode changes
- Stateless, Lambda-safe

---

## Files Created
1. `src/lib/db/schema-marketplace-modes.sql` - Database schema with triggers
2. `src/lib/api/vehicle-upload.ts` - Upload logic with validation
3. `src/app/api/upload/vehicle/route.ts` - API endpoint
4. `src/components/upload/MarketplaceModeSelection.tsx` - Mode selection UI
5. `src/components/upload/ModeSpecificFields.tsx` - Conditional fields UI
6. `VEHICLE_UPLOAD_FLOW.md` - This documentation

## Files Modified
1. `src/types/index.ts` - Updated Vehicle interface with marketplace mode fields

---

**Status:** Upload flow refactored with strict mode selection and validation. No silent defaults, seller must consciously choose correct mode.
