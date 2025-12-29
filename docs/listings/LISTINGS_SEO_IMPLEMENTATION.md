# Listings SEO Implementation (Canada + United States, AWS-Ready)

## Overview
Full production-grade SEO for Carly vehicle listings with country-aware support for Canada and the United States. All listings are indexed with proper structured data, meta tags, and country-specific URLs.

---

## URL Architecture

### Format
```
/cars/{country}/{region}/{city}/{year}-{make}-{model}-{listingId}
```

### Examples
**Canada:**
- `/cars/ca/on/toronto/2024-bmw-m4-competition-1098109`
- `/cars/ca/qc/montreal/2023-porsche-911-carrera-884221`

**United States:**
- `/cars/us/ca/los-angeles/2022-tesla-model-s-plaid-331090`
- `/cars/us/ny/new-york/2023-mercedes-amg-gt-551201`

### Rules
- `country` = ISO-2 code (ca, us)
- `region` = province/state abbreviation (lowercase)
- `city` = lowercase, hyphenated
- `listingId` = unique numeric identifier appended to URL

---

## SEO Metadata

### Title Template
```
{Year} {Make} {Model} for Sale | {City}, {Region} | Carly
```

**Examples:**
- Canada: `2024 BMW M4 Competition for Sale | Toronto, ON | Carly`
- United States: `2022 Tesla Model S Plaid for Sale | Los Angeles, CA | Carly`

### Meta Description Template
```
Explore this {Year} {Make} {Model} in {City}, {Region}. {Mileage} {unit}. Verified seller. View photos and details on Carly.
```

**Localization:**
- Canada: Kilometers (km)
- United States: Miles (mi)

---

## Structured Data (JSON-LD)

### Schema Types
- `Car` (vehicle details)
- `Offer` (pricing and availability)
- `Organization` / `AutoDealer` (seller information)

### Key Properties
- **Mileage Units:**
  - Canada: `unitCode: "KMT"` (kilometers)
  - United States: `unitCode: "SMI"` (miles)
  
- **Price Currency:**
  - Canada: `CAD`
  - United States: `USD`

- **Address:**
  ```json
  {
    "@type": "PostalAddress",
    "addressLocality": "{City}",
    "addressRegion": "{Region}",
    "addressCountry": "{CountryCode}"
  }
  ```

---

## Files Created/Updated

### New Files
1. **`src/lib/seo/listing-seo.ts`**
   - SEO utilities for listings
   - `buildListingSlug()` - Generate country-aware URLs
   - `parseListingSlug()` - Extract country, region, city, listingId
   - `generateListingSEO()` - Complete SEO metadata generation
   - `generateImageAlt()` - SEO-friendly image alt text

2. **`src/app/sitemap.ts`**
   - Dynamic sitemap generation
   - Includes all listings from Canada and US
   - Static pages included

3. **`src/app/robots.ts`**
   - Allows: `/cars/ca/`, `/cars/us/`
   - Disallows: `/buyer/`, `/dealer/`, `/luxury`, query params

4. **`src/app/cars/[country]/[region]/[city]/[slug]/page.tsx`**
   - Country-aware dynamic route
   - Redirects to canonical listing page

5. **`src/app/listings/[id]/metadata.tsx`**
   - Server-side metadata generation
   - JSON-LD structured data injection

### Layout Files (Noindex)
- `src/app/buyer/browse/layout.tsx` - Browse page (noindex, follow)
- `src/app/explore/layout.tsx` - Explore page (noindex, follow)
- `src/app/luxury/layout.tsx` - Luxury page (noindex, nofollow)

### Updated Files
1. **`src/app/listings/[id]/page.tsx`**
   - Added SEO metadata imports
   - Generate and inject SEO data
   - SEO-friendly image alt text
   - Head meta tags with Open Graph and Twitter Cards

2. **`src/components/cards/vehicle-card.tsx`**
   - Use `generateImageAlt()` for SEO
   - Import SEO utilities

---

## Index Control

### Indexable
- Individual listing pages only (`/listings/[id]`)
- Country-aware URLs (`/cars/ca/**`, `/cars/us/**`)

### Noindex
- Browse/search pages
- Filter/query states (any URL with query params)
- Image preview modals
- Access-restricted pages (Buyer Dashboard, Dealer Portal)
- Carly Luxury

---

## View Tracking

### Rules
- View count increments **only** when listing page intentionally loads
- Image carousel preview does **not** count as a view
- No phantom views from modal interactions

### Implementation
- View tracking happens in `src/app/listings/[id]/page.tsx`
- Only triggered on full page load (not modal open)

---

## Image SEO

### Alt Text Format
```
{Year} {Make} {Model} {view} – Carly listing
```

**Views:** front view, side view, rear view, interior view, detail shot

### Optimization
- Next.js `<Image>` component with lazy loading
- Prevent layout shift with proper aspect ratios
- Primary image used for Open Graph previews

---

## Environment Variables

### Required
```
NEXT_PUBLIC_SITE_URL=https://carly.build
```

**Usage:**
- Canonical URLs
- Sitemap generation
- Open Graph URLs

**AWS Production:**
- Set via environment configuration (not `.env` file)
- No hardcoded domains in codebase

---

## Sitemap & Robots

### Sitemap (`/sitemap.xml`)
- All CA and US listings included
- Static pages (Home, Explore, Meet Carly, etc.)
- Change frequency: `daily` for listings
- Priority: 0.8 for listings, 1.0 for home

### Robots (`/robots.txt`)
- Allow all crawlers
- Disallow private areas and filter states
- Reference sitemap URL

---

## Analytics Integrity

### View Count Rules
- **Incremented:**
  - Listing page intentional load
  - SEO landing counts as real view

- **Not Incremented:**
  - Image carousel preview
  - Modal open from browse page
  - Background prefetch

---

## Performance

### Core Web Vitals Targets
- **LCP:** < 2s (server-side rendering)
- **CLS:** Minimal (stable layouts)
- **FID:** Optimized (minimal client JS)

### Optimization
- Server-side rendering for SEO content
- Image lazy loading (except hero)
- Minimal client-side JavaScript for SEO-critical content

---

## Country Support

### Launch Countries
- **Canada (CA):** Full support
- **United States (US):** Full support

### Architecture
- No default country assumptions
- Fully extensible for additional countries
- Country detection from location string

### Region Mapping
**Canadian Provinces:**
- ON, QC, BC, AB, MB, SK, NS, NB, NL, PE, NT, YT, NU

**US States (sample):**
- CA, NY, TX, FL, IL, PA, OH, GA, NC, MI

---

## Testing Checklist

### SEO Validation
- [ ] Listings work equally for Canada and US
- [ ] URLs, metadata, and schema are country-correct
- [ ] Units match country (km for CA, mi for US)
- [ ] Canonical URLs are properly set
- [ ] Open Graph and Twitter Cards render correctly
- [ ] JSON-LD validates on Google Rich Results Test
- [ ] Sitemap includes all listings
- [ ] Robots.txt allows correct paths

### View Tracking
- [ ] View count increments on listing page load
- [ ] Image carousel does not increment views
- [ ] No phantom views recorded

### Indexing
- [ ] Listings are indexable
- [ ] Browse/filter pages are noindexed
- [ ] Luxury and private areas are noindexed

---

## Next Steps

### For AWS Deployment
1. Set `NEXT_PUBLIC_SITE_URL` environment variable
2. Verify sitemap generates correctly
3. Submit sitemap to Google Search Console
4. Monitor Core Web Vitals in production
5. Test crawlability with Google Search Console

### For Additional Countries
1. Add country code to `getCountryFromLocation()`
2. Add region mapping in `getRegionFullName()`
3. Update `calculateExpectedMileage()` with country-specific annual mileage
4. Add to sitemap generation logic

---

## Files Reference

### Core SEO
- `src/lib/seo/listing-seo.ts` - SEO utilities
- `src/app/sitemap.ts` - Dynamic sitemap
- `src/app/robots.ts` - Robots.txt configuration

### Routes
- `src/app/listings/[id]/page.tsx` - Main listing page (client-side)
- `src/app/listings/[id]/metadata.tsx` - Server metadata
- `src/app/cars/[country]/[region]/[city]/[slug]/page.tsx` - SEO route

### Components
- `src/components/cards/vehicle-card.tsx` - Card with SEO alt text

### Layouts
- `src/app/buyer/browse/layout.tsx` - Browse noindex
- `src/app/explore/layout.tsx` - Explore noindex
- `src/app/luxury/layout.tsx` - Luxury noindex

---

## Architecture Notes

### Why This Structure?
1. **Country-first routing** ensures international scalability
2. **Server-side metadata** for optimal SEO
3. **Client-side rendering** for rich interactions
4. **Separate SEO routes** allow canonical URL control
5. **No query params** in indexed URLs for clean search results

### AWS Production Ready
- Environment-driven configuration
- No hardcoded domains
- Scalable for millions of listings
- Extensible for new countries
- Performance-optimized (SSR + lazy loading)
