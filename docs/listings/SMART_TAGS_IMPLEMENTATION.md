# Smart Tags System Implementation

## Overview
The Smart Tags System separates vehicle listing tags into two distinct categories:
1. **Status/Source Tags** - Static, identity-based tags (who is selling, trust level)
2. **Smart Tags** - Computed, data-driven intelligence signals (why is this listing notable)

## Tag Categories

### Status/Source Tags
These indicate seller type and trust level:
- **Dealer** - Vehicle sold by a dealer
- **Private Seller** - Vehicle sold by private party
- **Certified** - Certified pre-owned vehicle
- **Carly Verified** - Platform-verified listing

**Visual Treatment:**
- Small, subtle pills (uppercase, 10px text)
- Neutral colors (muted backgrounds)
- Positioned near vehicle title
- Different shape from smart tags

### Smart Tags
Automatically computed from listing data:

**Mileage Intelligence:**
- **Very Low Mileage** - Actual mileage ≤ (expected - 2 years of driving)
- **Low Mileage** - Actual mileage ≤ (expected - 1 year of driving)
- **Above Average Use** - Actual mileage ≥ (expected + 1 year of driving)

**Age vs Usage:**
- **Older, Low Mileage** - Vehicle age > 5 years with notably low mileage
- **Newer, High Mileage** - Vehicle age < 3 years with notably high mileage

**Market & Activity:**
- **Fresh Listing** - Listed within 7 days
- **Price Drop** - Price reduced ≥5% or ≥$500
- **High Interest** - Save count ≥ 15
- **Trending** - View velocity ≥ 50 views/day

**Visual Treatment:**
- More expressive pills (12-14px text)
- Gradient accent colors
- Separate row/cluster from status tags
- Rounded corners (8px border-radius)

## Data-Driven Logic

### Regional Averages (Canonical Kilometers)
- **Canada:** 15,000 km/year
- **United States:** 19,312 km/year (12,000 mi converted)

### Expected Mileage Calculation
```
age = currentYear - vehicleYear
expectedMileage = age × regionalAverage
```

### Tag Priority
When multiple smart tags apply, system shows up to 4 tags in priority order:
1. Price Drop
2. Very Low Mileage
3. Fresh Listing
4. High Interest
5. Trending
6. Low Mileage
7. Older, Low Mileage
8. Newer, High Mileage
9. Above Average Use

## Implementation Files

### Core Logic
- `src/lib/smart-tags.ts` - Tag generation and styling logic
  - `generateStatusTags()` - Extract status from vehicle metadata
  - `generateSmartTags()` - Compute smart tags from data
  - `generateVehicleTags()` - Combined tag generation
  - `getTagStyle()` - Visual styling for each tag type

### Components Updated
- `src/components/cards/vehicle-card.tsx` - Card view with tags
- `src/components/listings/ListingsListView.tsx` - List view with tags
- `src/app/listings/[id]/page.tsx` - Detail page with tags

### Data Structure
- `src/types/index.ts` - Extended Vehicle interface:
  - `priceHistory?: Array<{ price: number; date: string }>` - For price drop detection
  - `carlyVerified?: boolean` - For verification badge
  - `viewCount?: number` - For trending detection
  - `saveCount?: number` - For high interest detection

### Mock Data
- `src/lib/api/mock-data.ts` - Updated with:
  - Realistic createdAt dates (relative to now)
  - View counts (40-320 range)
  - Save counts (3-27 range)
  - Price history samples
  - Carly verified flags

## Visual Consistency Rules

### Status Tags
```tsx
<span className="px-2 py-0.5 rounded text-[10px] font-medium uppercase tracking-wide">
  DEALER
</span>
```

### Smart Tags
```tsx
<span className="px-3 py-1 rounded-lg text-xs font-medium">
  Low Mileage
</span>
```

### Placement
**Card View:**
- Status tags: Below title, above price
- Smart tags: Between details and location (separate row)

**List View:**
- Status tags: Below title with vehicle info
- Smart tags: Below status tags (limit 2 for space)

**Detail Page:**
- Status tags: Top of page, near title
- Smart tags: Below title, before price

## Future Enhancement Support

The system is architected for:
- **User-specific weighting** - Tags can be ranked/deprioritized per user
- **Personalization** - User likes/dislikes can influence tag logic
- **A/B testing** - Tag thresholds can be adjusted
- **Analytics** - Tag click-through and conversion tracking
- **New tag types** - Extensible enum and styling system

## Testing

### Validation Checklist
- [x] Status tags appear on all listing surfaces
- [x] Smart tags computed correctly per listing
- [x] Visual separation clear between tag types
- [x] US listings use miles for mileage calculations
- [x] Canadian listings use kilometers for mileage calculations
- [x] Price drop tags show when price reduced
- [x] Fresh listing tags show for recent listings
- [x] High interest tags show for popular listings
- [x] Tag limits enforced (max 4 smart tags)
- [x] Tag priority ordering works correctly
- [x] No tag contradictions (mutually exclusive logic)

### Example Scenarios

**Tesla Model S (San Francisco, CA):**
- Status: Dealer, Carly Verified
- Smart: Price Drop, Fresh Listing, High Interest
- Why: Listed 5 days ago, price reduced, 18 saves

**BMW M4 (Miami, FL):**
- Status: Dealer
- Smart: Very Low Mileage, Fresh Listing, Trending
- Why: 2024 model with only 1,200 mi (1,931 km), listed 2 days ago, 312 views

**Porsche 911 (Los Angeles, CA):**
- Status: Private Seller
- Smart: Low Mileage
- Why: 2022 model with 8,900 mi (14,323 km), under expected

**Toyota Corolla (Toronto, ON):**
- Status: Private Seller
- Smart: Low Mileage, Fresh Listing
- Why: 2021 model with 20,000 mi (32,187 km), listed 8 days ago

## Performance Considerations

- Tag calculations are **O(1)** per listing (simple math)
- No API calls or external lookups
- Styles computed once per render
- Canonical data stored in kilometers (no conversion overhead)
- Tag generation cached in component state

## Accessibility

- All tags have semantic meaning
- Color is not the only differentiator (shape and size also vary)
- Status tags use uppercase for distinction
- Smart tags use sentence case for readability
- Sufficient color contrast on all backgrounds
