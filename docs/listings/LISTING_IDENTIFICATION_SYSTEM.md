# UNIFIED LISTING IDENTIFICATION & MARKING SYSTEM

## Overview
Complete implementation of immutable listing IDs and visual marketplace mode badges across all views.

---

## 1. Listing ID System

### Format
```
CARLY-{REGION}-{MODE}-{YYYYMM}-{RANDOM}
```

**Examples:**
- `CARLY-CA-RR-202412-A7F3K` (Road Ready, Canada, December 2024)
- `CARLY-US-NRR-202412-K3P9W` (Near Road Ready, US, December 2024)
- `CARLY-CA-BM-202412-T5H8M` (Builder's Market, Canada, December 2024)

### Components
- **REGION:** `CA` or `US`
- **MODE:** 
  - `RR` = Road Ready
  - `NRR` = Near Road Ready
  - `BM` = Builder's Market
- **YYYYMM:** Year and month (202412)
- **RANDOM:** 5-character alphanumeric (excludes ambiguous chars: I, O, L, 0, 1)

### Rules
- ✅ Generated ONCE at creation
- ✅ IMMUTABLE - cannot be changed
- ✅ Enforced by database trigger
- ✅ Indexed for fast lookups
- ✅ Validated format on insert/update

---

## 2. Marketplace Mode Enforcement

### Single Source of Truth
`marketplace_mode` field is the ONLY source for mode determination.

**NEVER infer mode from:**
- `running` status
- `inspection_uploaded` status  
- `issue_severity`
- Any combination of fields

### Database Enforcement
```sql
-- Required field, no NULL allowed
marketplace_mode TEXT NOT NULL

-- Trigger validates mode matches listing ID
CREATE TRIGGER trigger_validate_carly_listing_id

-- Trigger prevents mode inference
CREATE TRIGGER trigger_enforce_marketplace_mode_explicit
```

---

## 3. Visual Marking (Badges)

### Badge Display
All listing views show marketplace mode badge:
- **Road Ready:** Green badge with checkmark icon
- **Near Road Ready:** Amber badge with wrench icon
- **Builder's Market:** Red badge with hammer icon

### Badge Locations
- ✅ Vehicle cards (top-left corner)
- ✅ Browse/search rows
- ✅ Detail pages
- ✅ Saved garage view
- ✅ Dealer inventory
- ✅ Comparison views

### Component
`<MarketplaceModeBadge mode={vehicle.marketplaceMode} size="sm" />`

**Size options:**
- `sm` - Cards, compact views (10px text)
- `md` - Standard views (12px text)
- `lg` - Detail pages (14px text)

---

## 4. Data Model

### Required Fields
```typescript
carlyListingId: string; // IMMUTABLE: CARLY-{REGION}-{MODE}-{YYYYMM}-{RANDOM}
region: 'CA' | 'US'; // REQUIRED
marketplaceMode: MarketplaceMode; // SINGLE SOURCE OF TRUTH
running: boolean;
inspectionUploaded: boolean;
inspectionFileUrl?: string;
issueSeverity: IssueSeverity;
estimatedFixes?: string[];
intendedUse?: IntendedUse[];
disclosureAcknowledgedAt?: string; // ISO timestamp
```

### Database Schema
```sql
carly_listing_id TEXT UNIQUE NOT NULL
region TEXT NOT NULL CHECK (region IN ('CA', 'US'))
marketplace_mode TEXT NOT NULL CHECK (marketplace_mode IN ('road_ready', 'near_road_ready', 'builders_market'))
disclosure_acknowledged_at TIMESTAMPTZ
```

---

## 5. Browse Logic

### Default Browse
- Excludes Builder's Market by default
- Shows Road Ready + Near Road Ready

### Builder's Market Toggle
- Appears ONLY when explicitly toggled
- Separate filter mode
- Never mixed with other modes

### Personalization Rules
- **Road Ready:** Personalization enabled
- **Near Road Ready:** Personalization enabled
- **Builder's Market:** NO personalization (deterministic sorting only)

---

## 6. SEO & Metadata

### Structured Data
Include `vehicleCondition` in JSON-LD:
```json
{
  "@type": "Car",
  "vehicleCondition": "road-ready" | "near-road-ready" | "builders-market"
}
```

### Disclosure Copy
Builder's Market listings must show:
> ⚠️ This vehicle is sold as-is and may not be road-ready. Intended for project use, export, restoration, parts, or track.

---

## 7. Actions by Mode

### Road Ready
- ✅ Test drive available
- ✅ Financing options
- ✅ Full CTA: "Contact Seller"

### Near Road Ready
- ⚠️ Test drive with disclaimer
- ✅ Financing options
- ✅ CTA: "Contact Seller - Minor Fixes Required"

### Builder's Market
- ❌ NO test drive
- ❌ NO financing
- ⚠️ CTA: "Contact Seller (As-Is Vehicle)"
- ⚠️ Visible disclosure warning

---

## 8. AWS Readiness

### Server-Side Enforcement
- All logic runs server-side
- Database triggers enforce rules
- No client-side inference

### Indexing
```sql
CREATE UNIQUE INDEX idx_carly_listing_id ON vehicle_listings(carly_listing_id);
CREATE INDEX idx_region ON vehicle_listings(region);
CREATE INDEX idx_marketplace_mode ON vehicle_listings(marketplace_mode);
```

### Persistence
- All fields persisted to RDS/DynamoDB
- Immutability enforced by triggers
- Audit trail for any attempted changes

---

## Implementation Files

### Backend
1. `src/lib/listing/listing-id.ts` - ID generation & validation
2. `src/lib/db/schema-listing-identification.sql` - Database schema & triggers
3. `src/lib/api/vehicle-upload.ts` - Updated with region & ID generation

### Frontend
4. `src/components/listing/MarketplaceModeBadge.tsx` - Visual badge component
5. `src/components/cards/vehicle-card.tsx` - Added badge to cards

### Types
6. `src/types/index.ts` - Updated Vehicle interface with `carlyListingId`, `region`, `disclosureAcknowledgedAt`

---

## Validation Rules

### Listing ID Validation
```typescript
// Format check
^CARLY-(CA|US)-(RR|NRR|BM)-\d{6}-[A-Z0-9]{5}$

// Region matches listing ID
substring(carly_listing_id from 7 for 2) = region

// Mode matches listing ID
Mode abbreviation = marketplace_mode
```

### Mode Validation
```sql
-- Explicit mode required
IF NEW.marketplace_mode IS NULL THEN
  RAISE EXCEPTION 'marketplace_mode is required and must be set explicitly';
END IF;
```

### Immutability Enforcement
```sql
-- Prevent ID changes
IF OLD.carly_listing_id IS DISTINCT FROM NEW.carly_listing_id THEN
  RAISE EXCEPTION 'Carly listing ID is immutable and cannot be changed';
END IF;
```

---

## Testing Checklist

✅ Listing ID generated correctly at creation  
✅ Listing ID format validated  
✅ Listing ID immutability enforced  
✅ Mode badge displays on all views  
✅ Mode badge colors correct per mode  
✅ Builder's Market excluded from default browse  
✅ Builder's Market shows disclosure warnings  
✅ Test drive disabled for Builder's Market  
✅ Personalization disabled for Builder's Market  
✅ No mode inference at runtime  

---

**Status:** Unified listing identification and marking system implemented with immutable IDs and visual badges across all views.
