# Dealer Listings System - AWS Deployment Guide

## Overview

The Dealer → Listings page has been refactored for AWS scalability, supporting 500-5000+ listings per dealership without performance degradation.

---

## Architecture Changes

### Before (v1.0)
- Client-side pagination (all records fetched)
- Client-side search/filtering
- No request cancellation
- Status counts computed from full dataset
- No caching layer

### After (v2.0 - AWS Ready)
- Server-side pagination (default: 50 items/page, max: 200)
- Server-side search with debounce (250ms)
- AbortController for request cancellation
- Separate cached counts endpoint
- Redis caching for aggregates (recommended)
- Smart loading states (no full blank flicker)

---

## API Endpoints

### 1. GET /api/dealer/listings

**Purpose:** Paginated listing retrieval with server-side search/filter/sort

**Query Parameters:**
```
dealerId:   string (required) - from auth session
page:       number (default: 1)
pageSize:   number (default: 50, max: 200)
status:     'active' | 'paused' | 'pending' | 'sold' | 'all'
search:     string (searches: stockNumber, vin, make, model, year)
sortBy:     'updatedAt' | 'createdAt' | 'price' | 'mileage' | 'views'
sortOrder:  'asc' | 'desc' (default: 'desc')
```

**Response:**
```typescript
{
  items: DealerListing[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
  counts: {
    active: number;
    paused: number;
    pending: number;
    sold: number;
    total: number;
  };
}
```

**Database Implementation:**
```typescript
// Use Prisma for database queries
const listings = await prisma.listing.findMany({
  where: {
    dealerId,
    status: statusFilter,
    OR: [
      { stockNumber: { contains: searchTerm } },
      { vin: { contains: searchTerm.toUpperCase() } },
      { make: { contains: searchTerm } },
      { model: { contains: searchTerm } },
      { year: parseInt(searchTerm) },
    ],
  },
  orderBy: { [sortBy]: sortOrder },
  skip: (page - 1) * pageSize,
  take: pageSize,
});
```

**Performance Notes:**
- Uses parallel queries (listings + count + statusCounts)
- Fetches metrics ONLY for current page items
- Status counts should be cached in Redis (TTL: 60s)

---

### 2. GET /api/dealer/listings/counts

**Purpose:** Lightweight endpoint for status counts (for summary cards)

**Query Parameters:**
```
dealerId: string (required)
```

**Response:**
```typescript
{
  active: number;
  paused: number;
  pending: number;
  sold: number;
  total: number;
}
```

**Caching Strategy:**
```typescript
// Check Redis cache first
const cached = await redis.get(`dealer:${dealerId}:counts`);
if (cached) return JSON.parse(cached);

// Compute if not cached
const counts = { ... };

// Cache for 60 seconds
await redis.setex(`dealer:${dealerId}:counts`, 60, JSON.stringify(counts));
```

---

### 3. PATCH /api/dealer/listings

**Purpose:** Update listing status

**Body:**
```typescript
{
  listingId: string;
  status: 'active' | 'paused' | 'sold';
}
```

**Implementation:**
```typescript
await prisma.listing.update({
  where: { id: listingId, dealerId },
  data: { status, updatedAt: new Date() },
});

// Invalidate counts cache
await redis.del(`dealer:${dealerId}:counts`);
```

---

### 4. POST /api/dealer/listings/bulk-upload

**Purpose:** CSV/Excel bulk inventory upload

**Body:** `multipart/form-data`
- `file`: CSV/XLS/XLSX file

**Required Columns:**
- Stock Number
- VIN
- Year
- Make
- Model
- Price
- Mileage
- Trim (optional)

**Validation:**
- VIN: Must be 17 characters
- Year: 1900 - (current year + 2)
- Price: > 0
- Mileage: >= 0

**Response:**
```typescript
{
  success: boolean;
  validation: {
    valid: boolean;
    errors: string[];
    warnings: string[];
    rowCount: number;
  };
  inserted?: number;
}
```

**AWS Implementation:**
```typescript
// Parse file server-side (NOT client-side)
// For large files, use streaming parser
const formData = await req.formData();
const file = formData.get('file') as File;
const content = await file.text();

// Batch insert for performance
await prisma.listing.createMany({
  data: rows.map(row => ({
    dealerId,
    stockNumber: row.stockNumber,
    vin: row.vin.toUpperCase(),
    year: row.year,
    make: row.make,
    model: row.model,
    trim: row.trim,
    price: row.price,
    mileage: row.mileage,
    status: 'pending',
    photos: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  })),
});

// Invalidate cache
await redis.del(`dealer:${dealerId}:counts`);
```

---

## Frontend Implementation

### Key Features

1. **Debounced Search (250ms)**
```typescript
useEffect(() => {
  const timer = setTimeout(() => {
    setDebouncedSearch(searchQuery);
    setPage(1); // Reset to page 1 on new search
  }, 250);
  return () => clearTimeout(timer);
}, [searchQuery]);
```

2. **Request Cancellation**
```typescript
const abortControllerRef = useRef<AbortController | null>(null);

async function fetchListings() {
  // Abort previous request
  if (abortControllerRef.current) {
    abortControllerRef.current.abort();
  }
  
  const controller = new AbortController();
  abortControllerRef.current = controller;
  
  await fetch(url, { signal: controller.signal });
}
```

3. **Smooth Loading States**
```typescript
// Separate loading indicators
const [loading, setLoading] = useState(true); // Initial load
const [loadingSearch, setLoadingSearch] = useState(false); // Search changes

// Keep previous data while loading new results
// No full blank flicker
```

4. **Advanced View Persistence**
```typescript
// localStorage for advanced view toggle
const [advancedView, setAdvancedView] = useState(() => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('listingsAdvancedView') === 'true';
  }
  return false;
});

useEffect(() => {
  localStorage.setItem('listingsAdvancedView', advancedView.toString());
}, [advancedView]);
```

5. **Smart Pagination**
```typescript
// Shows: [1] [2] [3] [4] [5] for total <= 5 pages
// Shows: [page-2] [page-1] [page] [page+1] [page+2] for middle pages
// Shows: [n-4] [n-3] [n-2] [n-1] [n] for last pages
```

---

## Database Schema

### Listings Table
```sql
CREATE TABLE listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dealer_id VARCHAR(255) NOT NULL,
  stock_number VARCHAR(100) NOT NULL,
  vin VARCHAR(17) NOT NULL,
  year INTEGER NOT NULL,
  make VARCHAR(100) NOT NULL,
  model VARCHAR(100) NOT NULL,
  trim VARCHAR(100),
  price DECIMAL(10, 2) NOT NULL,
  mileage INTEGER NOT NULL,
  photos TEXT[], -- S3 URLs
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  carfax_s3_key VARCHAR(500), -- S3 key for Carfax PDF
  carfax_url TEXT, -- Public Carfax URL
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  
  -- Indexes for performance
  INDEX idx_dealer_status (dealer_id, status),
  INDEX idx_dealer_updated (dealer_id, updated_at DESC),
  INDEX idx_stock_number (dealer_id, stock_number),
  INDEX idx_vin (vin),
  INDEX idx_search (dealer_id, make, model, year),
  
  UNIQUE (dealer_id, stock_number),
  UNIQUE (dealer_id, vin)
);
```

### Listing Metrics Table
```sql
CREATE TABLE listing_metrics_daily (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  views INTEGER DEFAULT 0,
  saves INTEGER DEFAULT 0,
  messages INTEGER DEFAULT 0,
  appointments INTEGER DEFAULT 0,
  
  INDEX idx_listing_date (listing_id, date),
  UNIQUE (listing_id, date)
);
```

---

## AWS Resources

### Required Environment Variables
```bash
# Database (RDS)
DATABASE_URL=postgresql://user:pass@rds-instance.us-east-1.rds.amazonaws.com:5432/carly

# S3 for photos and Carfax PDFs
AWS_REGION=us-east-1
AWS_S3_BUCKET_NAME=carly-dealer-assets
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...

# Redis (ElastiCache) - Optional but recommended
REDIS_URL=redis://elasticache-instance.cache.amazonaws.com:6379

# Authentication
NEXTAUTH_URL=https://app.carly.com
NEXTAUTH_SECRET=...
```

### S3 Bucket Structure
```
carly-dealer-assets/
├── dealers/
│   └── {dealerId}/
│       ├── listings/
│       │   └── {listingId}/
│       │       ├── photo1.jpg
│       │       ├── photo2.jpg
│       │       └── ...
│       └── carfax/
│           └── {stockNumber}.pdf
```

### Redis Cache Keys
```
dealer:{dealerId}:counts                    TTL: 60s
dealer:{dealerId}:listings:page:{page}      TTL: 120s (optional)
```

---

## Performance Benchmarks

### Target Performance
- Page load: < 500ms (50 listings)
- Search response: < 300ms (debounced)
- Status toggle: < 200ms
- Bulk upload (100 rows): < 3s
- Supports: 5000+ listings per dealership

### Optimization Checklist
- [x] Server-side pagination
- [x] Debounced search (250ms)
- [x] AbortController for cancelled requests
- [x] Parallel database queries
- [x] Metrics fetched only for current page
- [ ] Redis caching for counts (recommended)
- [ ] Database indexes on dealer_id, status, updated_at
- [ ] S3 signed URLs for photos (instead of public URLs)
- [ ] CloudFront CDN for photo delivery

---

## Verification Checklist

### Functional Tests
- [ ] Loads with 0 listings (empty state shows correctly)
- [ ] Loads with 500 listings (no lag, pagination works)
- [ ] Search works for stock #, VIN, make, model, year
- [ ] Toggle advanced view doesn't refetch (uses localStorage)
- [ ] Counts remain correct regardless of current page
- [ ] Bulk upload button triggers correct flow without errors
- [ ] Carfax upload button triggers correct flow without errors
- [ ] Pagination controls work (prev/next, page numbers)
- [ ] Sorting works (price, mileage, updatedAt)
- [ ] Status filter updates counts correctly

### Performance Tests
- [ ] 50 listings load in < 500ms
- [ ] 500 listings pagination works smoothly
- [ ] Search debounce prevents request spam
- [ ] Counts cached (60s TTL, verified via Redis)
- [ ] No N+1 queries (verify with database logs)

### AWS Readiness
- [ ] All environment variables documented
- [ ] S3 bucket created with correct CORS policy
- [ ] RDS instance provisioned (PostgreSQL 14+)
- [ ] ElastiCache Redis cluster configured (optional)
- [ ] Database migrations ready
- [ ] Indexes created on all search/filter columns

---

## Migration Path

### Phase 1: Database Setup
1. Create RDS instance (PostgreSQL)
2. Run database migrations
3. Create indexes
4. Configure Prisma client

### Phase 2: S3 Setup
1. Create S3 bucket
2. Configure CORS policy
3. Set up IAM role for Lambda/EC2
4. Update photo upload logic to use S3

### Phase 3: Redis Setup (Optional)
1. Create ElastiCache cluster
2. Update counts endpoint to use cache
3. Monitor cache hit rate

### Phase 4: Testing
1. Load test with 1000+ listings
2. Verify pagination performance
3. Test concurrent search requests
4. Validate cache invalidation

### Phase 5: Deployment
1. Deploy to AWS (Vercel/EC2/ECS)
2. Configure environment variables
3. Monitor performance metrics
4. Set up alerts for slow queries

---

## Troubleshooting

### Issue: Slow pagination
**Cause:** Missing database indexes
**Fix:** 
```sql
CREATE INDEX idx_dealer_updated ON listings(dealer_id, updated_at DESC);
CREATE INDEX idx_dealer_status ON listings(dealer_id, status);
```

### Issue: Counts out of sync
**Cause:** Cache not invalidated on status change
**Fix:** Invalidate Redis cache on every PATCH/POST
```typescript
await redis.del(`dealer:${dealerId}:counts`);
```

### Issue: Search returns no results
**Cause:** Case-sensitive comparison
**Fix:** Use `mode: 'insensitive'` in Prisma
```typescript
{ vin: { contains: searchTerm.toUpperCase(), mode: 'insensitive' } }
```

### Issue: Photos not loading
**Cause:** S3 bucket CORS not configured
**Fix:** Add CORS policy
```json
{
  "AllowedOrigins": ["https://app.carly.com"],
  "AllowedMethods": ["GET", "HEAD"],
  "AllowedHeaders": ["*"],
  "MaxAgeSeconds": 3600
}
```

---

## Future Enhancements

### Phase 3 (Future)
- [ ] Infinite scroll option (alternative to pagination)
- [ ] Advanced filters (price range, year range, mileage range)
- [ ] Saved searches
- [ ] Export to CSV
- [ ] Bulk edit (price adjustment, status change)
- [ ] Photo optimization (WebP, lazy loading)
- [ ] Real-time updates (WebSocket for new listings)

---

## Contact

For questions or issues with AWS deployment, contact the engineering team.

**Document Version:** 2.0  
**Last Updated:** [Current Date]
