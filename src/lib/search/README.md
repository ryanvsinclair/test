# Natural Language Vehicle Search

## Overview

The Browse Page uses an advanced natural-language search engine that interprets human intent, not just keywords.

Users can type messy, real-world queries like:

- "cheap reliable car"
- "family suv under 30k"
- "beemer low mileage"
- "japanese car good on gas"
- "first car budget friendly"
- "winter ready awd"

The system extracts structured criteria, applies smart filtering, and ranks results by relevance.

---

## Core Principle

**This is intent interpretation, not keyword matching.**

Users don't search like databases. Databases should adapt to people.

---

## Supported Input Variety

The parser understands any combination of the following, in any order:

### 1. Vehicle Identity (Flexible)

**Make:**
- Official names: BMW, Toyota, Honda
- Slang: beemer, bimmer (BMW), chevy (Chevrolet), benz (Mercedes-Benz)

**Model:**
- 3 Series, Corolla, F-150, RAV4

**Body Style:**
- suv, crossover, sedan, coupe, hatchback, truck, van, minivan

**Brand Groups:**
- "luxury cars" → Boosts BMW, Mercedes, Audi, Lexus, Porsche
- "reliable cars" → Boosts Toyota, Honda, Mazda, Subaru
- "japanese cars" → Filters to Japanese brands
- "german cars" → Filters to German brands

### 2. Price Expressions (Very Flexible)

**Supported formats:**
- `under 15k`, `< 20000`, `max 30k`
- `cheap`, `budget friendly`, `affordable`
- `around 25k` → Interprets as $20k-$30k range
- `$10-15k`, `between 10k and 20k`
- `10000 to 15000`

**Automatic normalization:**
- Handles "k" suffix (15k → 15000)
- Detects CAD vs USD based on user city

### 3. Mileage / Usage Expressions

**Explicit:**
- `under 100k km`
- `less than 60k miles`
- `< 50000`

**Qualitative:**
- `low mileage` → Soft boost for <50k km
- `highway driven` → Soft boost (highway miles better)
- `barely driven` → Low mileage preference

**Unit handling:**
- Auto-detects km vs miles
- Respects user's country default
- All internal storage in km

### 4. Age / Year Intent

**Supported:**
- `newer`, `recent` → Last 3 years
- `2019+`, `2020 onwards`
- `not older than 2018`
- `last 5 years`

### 5. Drivetrain / Capability

**Direct:**
- `awd`, `4wd`, `fwd`, `rwd`
- Brand-specific: `quattro` (Audi), `xdrive` (BMW)

**Implied:**
- `winter ready` → Prefers AWD
- `good in snow` → AWD boost

### 6. Fuel / Powertrain

**Types:**
- `electric`, `ev`, `tesla-like`
- `hybrid`, `phev`, `plug-in`
- `gas`, `gasoline`, `petrol`
- `diesel`

**Efficiency:**
- `fuel efficient`, `cheap on gas`, `economical`, `good mpg`
→ Boosts electric, hybrid, small sedans

### 7. Practical Needs (Implicit Intent)

**Family:**
- `family car`, `family-friendly` → Boosts SUVs, minivans

**First Car / Student:**
- `student car`, `first car`, `beginner`
→ Sets budget cap (~$15k), boosts reliable brands

**Commuter:**
- `commuter car`, `daily driver`, `work car`
→ Boosts fuel efficiency + reliability

**Fun / Performance:**
- `fun car`, `sporty`, `sports car`, `fast`, `performance`
→ Boosts coupes, sport packages

**Project:**
- `project car`, `fixer-upper`, `restoration`
→ Relaxes mileage/condition filters

### 8. Location & Proximity

**Supported:**
- `near toronto`, `in calgary`
- `within 50km`, `local`, `close by`

---

## Parsing Strategy

### Step 1 — Tokenize
Break input into semantic tokens:
- Numbers
- Units (k, km, miles)
- Keywords (make, body, fuel)
- Qualitative terms (cheap, reliable, sporty)
- Ignore filler words safely (the, and, with)

### Step 2 — Intent Extraction

Extract:
- **Hard constraints** (must match): make, model, maxPrice, maxMileage
- **Soft preferences** (ranking boosts): reliable, luxury, fuel efficient

**Example:**
```
"reliable bmw under 15k low mileage"

Hard:
  make = BMW
  maxPrice = 15000

Soft:
  reliable = true
  lowMileage = true
```

### Step 3 — Normalize
- Convert units (km ↔ miles)
- Normalize currency (CAD/USD)
- Resolve synonyms (beemer → BMW)
- Validate ranges

### Step 4 — Apply Filters
- Hard constraints filter strictly
- Soft preferences boost match scores

### Step 5 — Rank Results

**Ranking factors:**
1. **Match completeness** (more criteria matched = higher score)
2. **Hard match priority** (make/model weighted highest)
3. **Price relevance** (vehicles ~80% of max price score highest)
4. **Mileage proximity** (lower mileage scores higher)
5. **Soft preference alignment** (reliable, fuel efficient, etc.)
6. **Tie-breakers:** Newer year → Lower mileage

---

## Explainability (Trust Building)

When a query is parsed, show users what was understood:

```
✨ Showing results for: BMW · under $15,000 · low mileage · reliable
```

This builds trust and reduces confusion.

---

## Fail-Safe & Graceful Degradation

**If query is:**
- **Too vague** → Broaden results, prioritize popular vehicles
- **Too strict** → Relax soft constraints, show close matches
- **Nonsense** → Fall back to keyword search (make/model text match)

**Never show empty page unless truly no matches exist.**

---

## Example Queries

| Query | Parsed Criteria | Result Behavior |
|-------|-----------------|-----------------|
| `cheap reliable car` | maxPrice: $15k, reliable: true | Toyota/Honda sedans under $15k |
| `family suv under 30k` | bodyType: SUV, maxPrice: $30k, familyFriendly: true | SUVs under $30k, prioritize space |
| `beemer low mileage` | make: BMW, lowMileage: true | BMWs with <50k km |
| `japanese car good on gas` | intentFlags: japanese, fuelEfficient: true | Toyota/Honda/Mazda with good MPG |
| `first car budget friendly` | intentFlags: first-car, maxPrice: $15k, reliable: true | Affordable, reliable starters |
| `winter ready awd` | winterReady: true, drivetrain: AWD | AWD vehicles, snow capability |
| `around 25k recent` | minPrice: $20k, maxPrice: $30k, minYear: 2021 | 2021+ cars in $20k-$30k range |
| `electric sedan under 50000` | fuelType: electric, bodyType: Sedan, maxPrice: $50k | Electric sedans under $50k |
| `luxury german car` | luxury: true, intentFlags: german | BMW/Mercedes/Audi |

---

## Architecture

### Files
```
src/lib/search/
├── nl-parser.ts          # Natural language query parser
├── vehicle-filter.ts     # Filtering and ranking logic
└── README.md             # This file

src/app/explore/page.tsx  # Browse page with integrated search
src/app/(buyer)/buyer/page.tsx  # Buyer dashboard search
src/app/(seller)/seller/clients/page.tsx  # Seller client search
```

### Core Functions

**`parseNaturalLanguageQuery(query, userCountry)`**
- Input: Free-form text, user country code
- Output: `ParsedSearchCriteria` object with hard + soft constraints
- Handles: All intent extraction, slang resolution, unit conversion

**`filterVehicles(vehicles, criteria, userLocation)`**
- Input: Vehicle list, parsed criteria, user location
- Output: `SearchResult[]` with match scores and matched criteria
- Handles: Hard constraint filtering + soft preference ranking

**`criteriaToReadableString(criteria)`**
- Input: Parsed criteria object
- Output: Human-readable string for UI feedback
- Handles: Building trust indicator text

**`fallbackTextSearch(vehicles, searchTerm)`**
- Input: Vehicle list, raw search text
- Output: Filtered vehicles via simple keyword matching
- Handles: Safety net when parsing fails

---

## Performance

- **Client-side:** All parsing and filtering in-browser (instant)
- **No API calls:** No network latency
- **Scales to:** Tens of thousands of vehicles (in-memory filtering)
- **No keystroke lag:** Filters on change, not per keystroke

---

## Extending the System

### Add New Vehicle Makes
```typescript
// src/lib/search/nl-parser.ts

const MAKES = new Set([
  // Add here
  'rivian', 'lucid', 'polestar',
]);

const MAKE_ALIASES: Record<string, string> = {
  // Add slang here
  'riv': 'Rivian',
};
```

### Add New Intent Flags
```typescript
// In parseNaturalLanguageQuery()

if (/\b(?:track car|race car)\b/i.test(normalized)) {
  criteria.intentFlags = criteria.intentFlags || [];
  criteria.intentFlags.push('track-car');
}

// In filterVehicles()

if (criteria.intentFlags?.includes('track-car')) {
  // Boost performance cars, manual transmission
  matchScore += 5;
}
```

---

## Testing

**Try these queries on `/explore`:**

1. `cheap reliable car`
2. `family suv under 30k`
3. `beemer low mileage`
4. `japanese car good on gas`
5. `first car budget friendly`
6. `winter ready awd`
7. `luxury german car around 50k`
8. `electric sedan recent`
9. `sporty coupe manual`
10. `commuter car fuel efficient`

**Expected behavior:**
- Parsed criteria appears below search bar
- Results match intent
- Ranking feels smart (relevant cars first)
- No errors on typos or nonsense input

---

## Future Enhancements

Potential improvements (not currently implemented):

- **Query suggestions** as you type ("Did you mean...?")
- **Saved searches** for repeat queries
- **Voice input** support
- **Learning from clicks** (AI-powered re-ranking)
- **Fuzzy matching** for make/model typos
- **Complex queries** ("bmw or audi under 25k")
- **Financing-aware search** ("under $400/month")
- **Distance calculations** for location proximity

---

## Configuration Notes

- Works alongside existing manual filters (not a replacement)
- Can be extended to support advanced filter UI
- Compatible with any vehicle data source (currently uses mock data)
- No backend changes required
- Unit preferences respect user's country setting
- All intent flags stored in criteria object for flexibility
