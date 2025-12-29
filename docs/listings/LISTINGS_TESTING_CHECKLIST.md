# Dealer Listings - Testing & Verification Checklist

## Files Modified/Created

### Modified Files
- `src/app/dealer/listings/page.tsx` - Frontend page with pagination, debounced search, abort controller
- `src/app/api/dealer/listings/route.ts` - Backend API with pagination, server-side search/sort

### Created Files
- `src/app/api/dealer/listings/counts/route.ts` - Separate counts endpoint for caching
- `LISTINGS_AWS_DEPLOYMENT.md` - Complete deployment guide

---

## Quick Test Suite

### Test 1: Empty State
**Steps:**
1. Navigate to /dealer/listings
2. Ensure dealer has 0 listings

**Expected:**
- ✓ Empty state displays: "No listings yet"
- ✓ Summary cards show 0 for all statuses
- ✓ No errors in console
- ✓ Loads in < 500ms

### Test 2: With 50 Listings
**Steps:**
1. Seed database with 50 listings
2. Navigate to /dealer/listings

**Expected:**
- ✓ All 50 listings displayed
- ✓ Summary cards show correct counts
- ✓ No pagination controls (only 1 page)
- ✓ Loads in < 500ms
- ✓ Advanced view toggle works

### Test 3: With 500 Listings
**Steps:**
1. Seed database with 500 listings
2. Navigate to /dealer/listings

**Expected:**
- ✓ First 50 listings displayed (page 1)
- ✓ Pagination controls visible
- ✓ "Showing 1 to 50 of 500 listings"
- ✓ No lag or performance issues
- ✓ Summary cards show correct totals (not just current page)
- ✓ Loads in < 800ms

### Test 4: Search Functionality
**Steps:**
1. Navigate to /dealer/listings
2. Type "Tesla" in search box
3. Wait 250ms (debounce)

**Expected:**
- ✓ Only Tesla listings displayed
- ✓ Search indicator shows (Loader2 icon)
- ✓ Results update after debounce
- ✓ Clear search returns all listings
- ✓ Search works for: stock #, VIN, make, model, year

### Test 5: Search Performance
**Steps:**
1. Type "Tes" then backspace rapidly
2. Type "123" then "456" rapidly

**Expected:**
- ✓ Only final search executes (previous aborted)
- ✓ No request spam in network tab
- ✓ No console errors
- ✓ Response time < 300ms per search

### Test 6: Advanced View Toggle
**Steps:**
1. Toggle advanced view ON
2. Refresh page
3. Toggle advanced view OFF
4. Refresh page

**Expected:**
- ✓ View persists after refresh (localStorage)
- ✓ No data refetch on toggle
- ✓ Search bar appears in advanced view
- ✓ Search bar hidden in standard view

### Test 7: Status Filter
**Steps:**
1. Click "Active" summary card
2. Verify only active listings shown
3. Click "Active" again to show all

**Expected:**
- ✓ Filter updates URL params (optional)
- ✓ Only active listings displayed
- ✓ Pagination resets to page 1
- ✓ Summary cards remain accurate (not filtered)

### Test 8: Sorting
**Steps:**
1. Click "Price" column header
2. Verify sorting direction
3. Click again to reverse

**Expected:**
- ✓ Listings sort by price (asc/desc)
- ✓ Arrow icon shows sort direction
- ✓ Pagination resets to page 1
- ✓ Sort persists across page navigation

### Test 9: Pagination
**Steps:**
1. Navigate to /dealer/listings with 500 listings
2. Click "Next" button
3. Click page number "3"
4. Click "Previous" button

**Expected:**
- ✓ Page 2 loads (listings 51-100)
- ✓ Page 3 loads (listings 101-150)
- ✓ Page 2 loads again
- ✓ Selection cleared on page change
- ✓ URL updates with page param (optional)

### Test 10: Bulk Upload
**Steps:**
1. Click "Bulk Upload" button
2. Select CSV file with 100 rows
3. Click "Upload & Process"

**Expected:**
- ✓ Dialog opens
- ✓ File validation runs
- ✓ Progress indicator shows
- ✓ Success/error message displays
- ✓ Page refreshes with new listings
- ✓ Completes in < 5s

### Test 11: Carfax Upload
**Steps:**
1. Click "Carfax Upload" button
2. Select single PDF
3. Enter stock number
4. Click "Upload Carfax"

**Expected:**
- ✓ Dialog opens with 3 tabs
- ✓ Single upload works
- ✓ Bulk ZIP upload works
- ✓ Bulk CSV upload works
- ✓ Matching logic correct (stock # or VIN)

### Test 12: Status Updates
**Steps:**
1. Select 5 listings (checkboxes)
2. Click "Pause" in bulk toolbar
3. Verify status changes

**Expected:**
- ✓ Bulk toolbar appears
- ✓ Status updates successfully
- ✓ Summary cards update
- ✓ Counts cache invalidated
- ✓ No full page reload (partial refresh)

---

## Performance Validation

### Network Requests
**Check in DevTools → Network:**
- ✓ Only 1 request on initial load
- ✓ No duplicate requests
- ✓ Aborted requests show "cancelled" (not errors)
- ✓ Response size reasonable (< 100KB for 50 listings)

### Database Queries
**Check with Prisma logging:**
- ✓ No N+1 queries
- ✓ Parallel queries for counts
- ✓ Metrics fetched only for current page
- ✓ All queries use indexes

### Loading States
- ✓ Initial load shows loading spinner
- ✓ Search shows loading indicator (not full page)
- ✓ Previous data remains visible during load
- ✓ No blank flicker between pages

---

## Edge Cases

### Edge Case 1: Exactly 50 Listings
**Expected:**
- ✓ All 50 shown on page 1
- ✓ No pagination controls (only 1 page)

### Edge Case 2: 51 Listings
**Expected:**
- ✓ Page 1 shows 50
- ✓ Page 2 shows 1
- ✓ Pagination controls appear

### Edge Case 3: Search Returns 0 Results
**Expected:**
- ✓ Empty state shows: "No listings match your search"
- ✓ Message suggests adjusting search terms
- ✓ Summary cards still show total counts

### Edge Case 4: Slow Network
**Steps:**
1. Throttle network to "Slow 3G"
2. Navigate pages

**Expected:**
- ✓ Loading indicator shows
- ✓ Previous data remains visible
- ✓ No errors or timeouts

### Edge Case 5: Rapid Status Filter Changes
**Steps:**
1. Click Active → Paused → Pending rapidly

**Expected:**
- ✓ Only final filter applies
- ✓ No request race conditions
- ✓ Correct listings displayed

---

## Browser Compatibility

Test in:
- [ ] Chrome/Edge (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Mobile Safari (iOS)
- [ ] Chrome Mobile (Android)

---

## API Endpoint Tests

### GET /api/dealer/listings
```bash
# Test pagination
curl "http://localhost:3000/api/dealer/listings?dealerId=dealer-001&page=1&pageSize=50"

# Test search
curl "http://localhost:3000/api/dealer/listings?dealerId=dealer-001&search=Tesla"

# Test status filter
curl "http://localhost:3000/api/dealer/listings?dealerId=dealer-001&status=active"

# Test sorting
curl "http://localhost:3000/api/dealer/listings?dealerId=dealer-001&sortBy=price&sortOrder=desc"
```

**Verify Response:**
- ✓ Returns `items`, `pagination`, `counts`
- ✓ `pagination.totalItems` correct
- ✓ `counts` match database
- ✓ Items sorted correctly

### GET /api/dealer/listings/counts
```bash
curl "http://localhost:3000/api/dealer/listings/counts?dealerId=dealer-001"
```

**Verify Response:**
- ✓ Returns `active`, `paused`, `pending`, `sold`, `total`
- ✓ Response time < 100ms (if cached)
- ✓ Counts match database

### PATCH /api/dealer/listings
```bash
curl -X PATCH "http://localhost:3000/api/dealer/listings?dealerId=dealer-001" \
  -H "Content-Type: application/json" \
  -d '{"listingId":"listing-123","status":"paused"}'
```

**Verify:**
- ✓ Status updates in database
- ✓ Cache invalidated
- ✓ Returns success response

---

## Production Readiness

### Environment Variables
- [ ] DATABASE_URL configured
- [ ] AWS_S3_BUCKET_NAME configured
- [ ] AWS credentials configured
- [ ] REDIS_URL configured (optional)

### Database
- [ ] Migrations applied
- [ ] Indexes created
- [ ] Seed data available

### AWS Resources
- [ ] RDS instance running
- [ ] S3 bucket created
- [ ] CORS policy configured
- [ ] ElastiCache cluster running (optional)

### Monitoring
- [ ] Database query logging enabled
- [ ] API response times monitored
- [ ] Error tracking configured
- [ ] Cache hit rate tracked (if Redis used)

---

## Sign-Off

**Tested By:** _________________  
**Date:** _________________  
**Environment:** _________________  
**All Tests Passed:** [ ] Yes [ ] No  
**Notes:** _________________
