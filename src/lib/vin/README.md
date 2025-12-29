# VIN Decoding Architecture

## Overview

This directory contains the centralized, production-safe VIN decoding system for Carly.

**CRITICAL RULES:**
- ALL VIN decoding MUST go through `decoder.ts`
- VIN decoding NEVER returns default/mock vehicle data
- VIN decoding NEVER silently fails (returns explicit success/failure)
- VIN decoding NEVER overwrites user-entered values (UI responsibility)
- VIN decoding is OPTIONAL - manual entry is always supported

---

## Files

### `decoder.ts`
**The ONLY place VIN decoding happens.**

Exports:
- `decodeVin(vin: string): Promise<VinDecodeResponse>` - Decode a VIN
- `isValidVinFormat(vin: string): boolean` - Client-side validation
- `DecodedVinData` - Type for decoded vehicle data
- `VinDecodeResponse` - Union type for success/failure

---

## Usage

### Basic VIN Decoding

```typescript
import { decodeVin, isValidVinFormat } from '@/lib/vin/decoder';

// 1. Validate format (client-side, optional)
if (!isValidVinFormat(userInput)) {
  showError('Invalid VIN format');
  return;
}

// 2. Decode VIN
const result = await decodeVin(userInput);

// 3. Handle result
if (!result.success) {
  // Decoding failed - show error, allow manual entry
  showError(result.error);
  enableManualEntry();
  return;
}

// 4. Use decoded data
const { year, make, model, trim } = result.data;
populateFields({ year, make, model, trim });
```

### Required UI States

Every UI that uses VIN decoding MUST implement these states:

1. **idle** - Initial state, VIN input ready
2. **decoding** - Loading state while API call is in progress
3. **success** - VIN decoded successfully, data available
4. **failed** - VIN decoding failed, show error + manual entry option

### Safety Rules for UI

```typescript
// ✅ CORRECT: Check success before using data
if (result.success) {
  setYear(result.data.year);
  setMake(result.data.make);
  setModel(result.data.model);
}

// ✅ CORRECT: Show error and provide fallback
if (!result.success) {
  setError(result.error);
  setShowManualEntry(true);
}

// ❌ WRONG: Using data without checking success
setYear(result.data.year); // TypeScript will catch this

// ❌ WRONG: Silently falling back to defaults
const year = result.data?.year || 2022; // NEVER DO THIS

// ❌ WRONG: Overwriting user-entered values
if (result.success) {
  setYear(result.data.year); // Only if field is empty!
}
```

---

## Current Provider: NHTSA

The system currently uses the **NHTSA vPIC API** (free, no authentication).

**Endpoint:** `https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVin/{vin}?format=json`

**Pros:**
- Free, no API key required
- Reliable, government-maintained
- Good coverage of North American vehicles

**Cons:**
- No trim data for many vehicles
- No pricing, equipment, or options data
- Rate limits (though generous for production use)

---

## Upgrading to Paid Providers

To replace NHTSA with a paid VIN decoder (ChromeData, DataOne, Edmunds):

### Step 1: Update `decoder.ts`

Replace the `fetch()` call in `decodeVin()`:

```typescript
// OLD (NHTSA):
const response = await fetch(
  `https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVin/${cleanVin}?format=json`
);

// NEW (Example - ChromeData):
const response = await fetch(
  `https://api.chromedata.com/vin/${cleanVin}`,
  {
    headers: {
      'Authorization': `Bearer ${process.env.CHROMEDATA_API_KEY}`,
    },
  }
);
```

### Step 2: Update Response Parser

Replace `normalizeNHTSAResponse()` with provider-specific parser:

```typescript
// Create a new function to parse your provider's response
function normalizeChromeDataResponse(data: any): DecodedVinData | null {
  // Validate required fields
  if (!data.year || !data.make || !data.model) {
    return null;
  }

  return {
    year: parseInt(data.year),
    make: data.make,
    model: data.model,
    trim: data.trim,
    // ... map provider fields to DecodedVinData
  };
}
```

### Step 3: Add Environment Variable

```bash
# .env.local
CHROMEDATA_API_KEY=your_api_key_here
```

### Step 4: Test Thoroughly

- Test successful decodes
- Test failed decodes (invalid VIN, network error, etc.)
- Verify UI handles all states correctly
- Check that year, make, model are always present on success

### Popular Paid Providers

| Provider | Pros | Cons | Cost |
|----------|------|------|------|
| **ChromeData** | Comprehensive trim/package data, MSRP, equipment lists | Expensive, complex integration | ~$0.10-0.50/VIN |
| **DataOne** | Good for dealers, includes pricing, fast | Dealer-focused, less consumer data | ~$0.20-0.40/VIN |
| **Edmunds** | Excellent consumer data, reviews, photos | Limited dealer features | ~$0.15-0.30/VIN |
| **CarMD** | Good for maintenance data, recalls | Limited vehicle specs | ~$0.05-0.15/VIN |

### Caching Recommendations

Paid providers charge per VIN. Implement caching:

```typescript
// Example caching layer
const vinCache = new Map<string, DecodedVinData>();

export async function decodeVin(vin: string): Promise<VinDecodeResponse> {
  const cleanVin = vin.trim().toUpperCase();
  
  // Check cache first
  if (vinCache.has(cleanVin)) {
    return { success: true, data: vinCache.get(cleanVin)! };
  }
  
  // ... decode VIN via API ...
  
  // Cache successful result
  if (result.success) {
    vinCache.set(cleanVin, result.data);
  }
  
  return result;
}
```

In production, use Redis or database for persistent caching.

---

## AWS Deployment Notes

**Environment:**
- Node.js runtime (API calls not supported on Edge)
- RDS/DynamoDB for VIN cache
- Lambda for decode endpoint (or server-side API route)

**Rate Limiting:**
- NHTSA: ~1000 requests/hour (sufficient for most use)
- Paid providers: Varies, check contract

**Monitoring:**
- Log all failed decodes
- Track decode success rate
- Monitor API costs (for paid providers)

---

## Migration Status

### ✅ Completed
- Core VIN decoder service (`decoder.ts`)
- Dealer add listing form
- Buyer garage add vehicle flow
- Safe error handling + UI states

### ⏳ Pending
- Migrate trim/package lookup functions from old decoder
- Add VIN decode caching layer
- Add monitoring/analytics for decode success rate

### 📝 Legacy Code
- `src/lib/api/vin-decoder.ts` - DEPRECATED, kept only for trim/package lookups

---

## Support

For questions or issues with VIN decoding:
1. Check this README
2. Review `decoder.ts` comments
3. Test with NHTSA API directly to verify VIN validity
4. Check vehicle manufacturer VIN format specs

**DO NOT:**
- Add mock VIN decode logic
- Return default vehicle data on failure
- Bypass the decoder service for "convenience"
