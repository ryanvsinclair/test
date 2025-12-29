# Vehicle Metrics Display Implementation

## Problem Solved
Previously, all vehicle listings were displaying units based on the user's location (Canadian users saw km, US users saw mi). This was incorrect because vehicle metrics should be based on where the vehicle is located, not where the user is.

## Solution
Implemented country-aware metric display per listing, where each vehicle's mileage is displayed in the appropriate unit based on the vehicle's location country.

## Implementation Details

### 1. Centralized Utility Function
Created `formatVehicleMileage()` in `src/lib/units.ts`:
- Takes mileage (stored in km) and vehicle location string
- Infers country from location (state/province codes)
- Returns formatted mileage with correct unit (km for CA, mi for US)

### 2. Country Inference Logic
The `inferCountryFromLocation()` function checks:
- US state abbreviations (CA, TX, FL, NY, etc.)
- Canadian province codes (ON, BC, AB, QC, etc.)
- Defaults to Canada if unable to determine

### 3. Components Updated

#### Vehicle Card (`src/components/cards/vehicle-card.tsx`)
- Changed from `formatDistance(vehicle.mileage)` (user-based)
- To `formatVehicleMileage(vehicle.mileage, vehicle.location)` (listing-based)

#### Listings List View (`src/components/listings/ListingsListView.tsx`)
- Updated to use `formatVehicleMileage()` per listing

#### Listing Detail Page (`src/app/listings/[id]/page.tsx`)
- Updated specs display to use `formatVehicleMileage()`

### 4. Data Storage
- Mileage is stored internally in **kilometers** (canonical unit)
- Conversion happens **only at render time**
- No changes to data models or API structure
- UserVehicle objects (user's owned vehicles) continue to use user's local units via UnitsContext

### 5. Correct Behavior

**US Listings:**
- Location: "San Francisco, CA" → displays "5,420 mi"
- Location: "Houston, TX" → displays "25,000 mi"

**Canadian Listings:**
- Location: "Toronto, ON" → displays "32,187 km"
- Location: "Vancouver, BC" → displays "24,140 km"

**Mixed Feeds:**
- Browse page with both US and CA listings displays each correctly
- Cards, list view, and detail pages all consistent

### 6. Edge Cases Handled
- Mixed feeds (US + CA listings) render correctly per item
- Sorting/filtering operates on canonical km values
- No performance impact (simple math conversion)
- No extra API calls required
- User preferences don't override listing metrics

### 7. What's NOT Changed
- User profile location preferences (still used for user's owned vehicles)
- UnitsContext (still used for UserVehicle mileage display in garage)
- Data storage format (still kilometers)
- Sorting/filtering logic (operates on canonical km values)
- Currency display (already handled separately)

## Testing Checklist
- [x] US listings show miles in card view
- [x] Canadian listings show kilometers in card view
- [x] US listings show miles in list view
- [x] Canadian listings show kilometers in list view
- [x] US listings show miles on detail page
- [x] Canadian listings show kilometers on detail page
- [x] Mixed feeds display correctly
- [x] No regression in garage page (user's vehicles)
- [x] No performance impact
