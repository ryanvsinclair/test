# Dealer Dashboard AWS Readiness Audit

**Audit Date:** January 2025  
**Target:** `src/app/dealer/page.tsx` (Dealer Dashboard)  
**Status:** 🔴 **NOT PRODUCTION READY**

---

## Executive Summary

The Dealer Dashboard is **NOT ready for AWS deployment**. Critical failures in authentication, data sourcing, error handling, and observability must be addressed before production launch.

**Critical Issues:** 7  
**High Priority Issues:** 4  
**Medium Priority Issues:** 3

---

## 1. Authentication & Authorization 🔴 CRITICAL

### ❌ **FAILED: Frontend-only role checking**

**Current Implementation:**
- `src/app/dealer/layout.tsx` checks `user.role !== 'dealer'` (lines 24-26, 29)
- Redirect happens client-side via `router.push('/auth/dealer')`
- No server-side validation

**Issues:**
```typescript
// Line 24-26: Client-side only
if (!loading && (!user || user.role !== 'dealer')) {
  router.push('/auth/dealer');
}
```

**Risk:**
- Buyers or unauthenticated users can bypass frontend guards
- API endpoints are not protected (no JWT validation)
- Role stored in client state can be manipulated

**AWS Impact:**
- ⚠️ Cross-account data leakage possible
- ⚠️ Unauthorized access to dealer-only data
- ⚠️ PCI/compliance violations

### ❌ **FAILED: Mock authentication system**

**Current Implementation:**
- `src/contexts/AuthContext.tsx` uses mock login (lines 43-69)
- No actual backend validation
- No token-based auth
- User stored only in React state

```typescript
// Line 43-69: Mock login - no real auth
const mockUser: User = {
  id: Math.random().toString(36).substring(7),
  email,
  name: email.split("@")[0],
  role,
  verified: true,
  dealerStatus,
};
```

**Required for AWS:**
1. Server-side middleware to validate JWT on every dealer route
2. Database-backed user/role verification
3. Session management with secure tokens
4. Rate limiting on auth endpoints

---

## 2. Data Fetching Strategy 🔴 CRITICAL

### ❌ **FAILED: Hardcoded dealer ID**

**Current Implementation:**
```typescript
// Line 64: src/app/dealer/page.tsx
const dealerId = 'dealer-001'; // Hardcoded!
const response = await fetch(`/api/dealer/dashboard?dealerId=${dealerId}`);
```

**Issues:**
- Dealer ID never retrieved from authenticated user
- All dealers see same data
- No multi-tenancy support

**AWS Requirement:**
```typescript
// Must derive from authenticated session
const { user } = useAuth();
if (!user?.dealerId) throw new Error('Unauthorized');
const response = await fetch(`/api/dealer/dashboard`, {
  headers: { Authorization: `Bearer ${token}` }
});
```

### ❌ **FAILED: Mock data in production API**

**API Endpoint:** `src/app/api/dealer/dashboard/route.ts`

**Issues:**
- Lines 2: Imports `mockLeads` from mock data file
- Lines 5-9: Mock Prisma client (returns empty arrays)
- Lines 100-102: Uses mock leads for all conversation data
- Line 106: Hardcoded `upcomingAppointments = 0`
- Line 116: Returns empty hot listings (no real data)

```typescript
// Line 100-102: Mock data, not database
const activeLeads = mockLeads.filter(l => l.unreadCount > 0);
const totalConversations = mockLeads.length;
const newLeadsToday = activeLeads.length;
```

**AWS Impact:**
- Dashboard shows fake data
- No actual dealer insights
- Metrics always return 0 or mock values

### ✅ **PASSED: Error fallback structure**

**Current Implementation:**
- Lines 73-90: try/catch with empty state fallback
- Lines 112-121: Error state UI rendered
- No crashes on API failure

**Good:**
```typescript
catch (error) {
  console.error('Failed to load dashboard:', error);
  setData({
    stats: { newLeadsToday: 0, activeConversations: 0, ... },
    hotListings: [],
    needsAttention: [],
  });
}
```

### ⚠️ **PARTIAL: Single bundled fetch**

**Current Implementation:**
- All dashboard data fetched in one API call
- No parallel fetching
- Entire dashboard blocked if one metric fails

**AWS Risk:**
- Cold start delays block entire page
- One timeout = full dashboard failure

**Recommended:**
```typescript
// Fetch independently with Promise.allSettled
const [stats, performance, listings, attention] = await Promise.allSettled([
  fetchStats(dealerId),
  fetchPerformance(dealerId),
  fetchHotListings(dealerId),
  fetchNeedsAttention(dealerId),
]);
```

---

## 3. Loading, Empty, and Error States ✅ MOSTLY PASSING

### ✅ **PASSED: Loading state**
- Lines 101-110: Centered spinner with message
- Non-blocking, clear UX

### ✅ **PASSED: Error state**
- Lines 112-121: Clean error card
- User-friendly messaging

### ✅ **PASSED: Empty states**
- Line 250-254: "Needs Attention" empty state
- Line 299-303: "Hot Listings" empty state
- Both use intentional messaging

### ⚠️ **MISSING: Zero vs unavailable distinction**

**Issue:**
- KPI cards show `0` for both "no data" and "failed to load"
- User cannot tell if metrics are accurate or broken

**Recommended:**
```typescript
// Distinguish between zero and error
{data.stats.newLeadsToday ?? '—'}
// vs
{data.stats.newLeadsToday || 0}
```

---

## 4. Data Consistency Rules 🔴 CRITICAL

### ❌ **FAILED: KPI counts do not match underlying data**

**Issues:**

1. **"New Leads Today"**
   - Card shows: `data.stats.newLeadsToday` (API line 120)
   - Source: `activeLeads.length` (filtered by `unreadCount > 0`)
   - Semantic mismatch: "unread" ≠ "new today"

2. **"Active Conversations"**
   - Card shows: `data.stats.activeConversations` (API line 121)
   - Source: `mockLeads.length` (all mock leads, not filtered)
   - Does not reflect actual active state

3. **"Needs Attention" list**
   - Uses same `activeLeads` as "New Leads Today"
   - Duplicate data sources
   - Counts will always match, even when logic is wrong

**AWS Requirement:**
- Server must compute counts from actual database queries
- Timezone-aware filtering for "today"
- Separate queries for:
  - New leads (created today)
  - Active conversations (messages in last 7 days)
  - Needs attention (unresponded messages)

### ⚠️ **MISSING: Timezone handling**

**Issue:**
```typescript
// Line 36-39: Local client timezone
const today = new Date();
today.setHours(0, 0, 0, 0);
```

**AWS Risk:**
- Dealer in PST sees different "today" than server in UTC
- Metrics reset at wrong time

**Required:**
```typescript
// Server-side with dealer's timezone
const dealerTimezone = dealer.timezone || 'America/New_York';
const today = DateTime.now().setZone(dealerTimezone).startOf('day');
```

---

## 5. Needs Attention Panel 🔴 CRITICAL

### ❌ **FAILED: No message scoping by dealer**

**Current Implementation:**
```typescript
// src/app/api/dealer/dashboard/route.ts line 100
const activeLeads = mockLeads.filter(l => l.unreadCount > 0);
```

**Issues:**
- Mock data is global (not dealer-specific)
- No `WHERE dealerId = ?` clause
- Cross-dealer message leakage possible

**AWS Requirement:**
```sql
SELECT * FROM conversations
WHERE dealer_id = ?
  AND unread_count > 0
  AND last_message_at > NOW() - INTERVAL '7 days'
ORDER BY last_message_at DESC
LIMIT 10;
```

### ⚠️ **MISSING: Pagination**

**Issue:**
- Lines 218-249: Renders all `needsAttention` items
- No limit on array size
- Could render 1000+ conversations

**AWS Risk:**
- Slow queries
- UI lag
- Memory issues

**Required:**
```typescript
// Paginate or limit
const needsAttention = await fetchNeedsAttention(dealerId, { limit: 20 });
```

### ✅ **PASSED: Link integrity**

**Current Implementation:**
- Line 221: Links to `/dealer/messages`
- Stable routing
- No broken links

### ⚠️ **PARTIAL: Message preview sanitization**

**Current Implementation:**
- Line 240: Renders `lead.lastMessage` directly
- No sanitization or truncation

**Risk:**
- XSS if message contains HTML
- UI breaks with very long messages

**Recommended:**
```typescript
<p className="text-sm truncate">
  {sanitizeText(lead.lastMessage).substring(0, 100)}
</p>
```

---

## 6. Navigation Integrity ✅ PASSING

### ✅ **PASSED: Sidebar navigation**
- `src/app/dealer/layout.tsx` includes `DealerSidebar`
- Prefetches routes (lines 13-21)
- Client-side routing stable

### ✅ **PASSED: Active state**
- Sidebar component handles active states
- No data refetch on navigation

---

## 7. Performance & Scalability 🔴 CRITICAL

### ❌ **FAILED: No query indexing**

**Issue:**
- Mock Prisma client returns empty arrays
- No actual database queries to audit

**AWS Requirement:**
```sql
-- Required indexes
CREATE INDEX idx_conversations_dealer_id ON conversations(dealer_id);
CREATE INDEX idx_conversations_last_message ON conversations(last_message_at);
CREATE INDEX idx_listings_dealer_id ON listings(dealer_id, status);
CREATE INDEX idx_metrics_dealer_date ON listing_metrics_daily(dealer_id, date);
```

### ❌ **FAILED: N+1 query risk**

**Potential Issue:**
- If "Needs Attention" fetches linked listings separately
- Could trigger N queries for N conversations

**Required:**
```typescript
// Use JOIN or eager loading
const conversations = await prisma.conversation.findMany({
  where: { dealerId },
  include: { linkedListing: true }, // Prevent N+1
});
```

### ⚠️ **MISSING: Response size limits**

**Issue:**
- API returns all hot listings, all needs attention, all performance data
- No pagination
- Could return megabytes of data

**AWS Requirement:**
```typescript
// Limit response size
hotListings: todayListings.slice(0, 5), // Top 5 only
needsAttention: activeLeads.slice(0, 20), // Max 20
```

---

## 8. Security & Privacy 🔴 CRITICAL

### ❌ **FAILED: Dealer email exposed**

**Issue:**
- Mock data includes emails (not checked in dashboard, but risky)
- No redaction policy

**AWS Requirement:**
- Never return dealer email to frontend
- Only return display name, ID

### ✅ **PASSED: No internal IDs visible**
- Listing IDs truncated (line 276)
- User IDs not displayed

### ⚠️ **PARTIAL: Client-side logging**

**Issue:**
- Line 74: `console.error('Failed to load dashboard:', error)`
- May log sensitive data in error object

**AWS Requirement:**
```typescript
// Sanitize logs
console.error('Dashboard load failed', { 
  dealerId, 
  errorMessage: error.message 
});
```

---

## 9. Resilience & Refresh Safety ⚠️ NEEDS WORK

### ✅ **PASSED: Page refresh**
- Page reloads gracefully
- Loading state prevents blank screen

### ❌ **FAILED: Token expiration handling**

**Issue:**
- No JWT refresh logic
- No 401 handling
- User sees error state, not redirected to login

**AWS Requirement:**
```typescript
if (response.status === 401) {
  logout();
  router.push('/auth/dealer');
  return;
}
```

### ⚠️ **PARTIAL: 500 error handling**

**Current Implementation:**
- Line 67-68: Checks `!response.ok` but treats all errors the same
- No retry logic
- No user guidance

**Recommended:**
```typescript
if (response.status === 500) {
  setError('Server error. Retrying...');
  setTimeout(() => fetchDashboard(), 3000);
}
```

---

## 10. AWS Deployment Validation 🔴 CRITICAL

### ❌ **FAILED: No environment variables used**

**Issue:**
- No `NEXT_PUBLIC_API_URL` or `API_BASE_URL`
- Hardcoded `/api/dealer/dashboard` endpoint
- Will fail in multi-region or load-balanced setup

**AWS Requirement:**
```typescript
const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
const response = await fetch(`${apiUrl}/api/dealer/dashboard`, {
  headers: { Authorization: `Bearer ${token}` }
});
```

### ❌ **FAILED: Dev-only flags present**

**Issue:**
- Mock data imports not gated
- No production build checks

**Required:**
```typescript
if (process.env.NODE_ENV === 'development') {
  // Use mock data
} else {
  // Require real API
}
```

### ❌ **FAILED: Container restart safety**

**Issue:**
- User state stored only in React state
- No persistence across restarts
- No session recovery

**AWS Requirement:**
- Use secure HTTP-only cookies for session
- Backend session store (Redis, DB)

---

## 11. Observability 🔴 CRITICAL

### ❌ **FAILED: No error logging to backend**

**Issue:**
- Line 74: `console.error` logs to browser console only
- No CloudWatch integration
- Errors invisible to ops team

**AWS Requirement:**
```typescript
try {
  // ...
} catch (error) {
  await logError('dealer-dashboard-fetch', { dealerId, error });
  // Also log to CloudWatch
}
```

### ❌ **FAILED: No metrics**

**Issue:**
- No tracking of:
  - Dashboard load times
  - API response times
  - Error rates
  - User actions

**AWS Requirement:**
```typescript
// Track key metrics
analytics.track('dealer_dashboard_loaded', {
  dealerId,
  loadTime: Date.now() - startTime,
  dataStatus: data ? 'success' : 'fallback',
});
```

### ❌ **FAILED: No tracing**

**Issue:**
- Cannot diagnose slow dashboard loads
- No request correlation IDs

**AWS Requirement:**
- Add X-Request-ID header to all API calls
- Log request IDs for traceability

---

## 12. Final Acceptance Criteria

| Criteria | Status | Notes |
|----------|--------|-------|
| Never crashes on missing/delayed data | ✅ Pass | Fallback states exist |
| Enforces dealer-only access server-side | ❌ Fail | Frontend-only guards |
| Every card reflects live backend data | ❌ Fail | All data is mocked |
| Empty states are intentional | ✅ Pass | Proper messaging |
| Survives refresh, latency, outages | ⚠️ Partial | No token refresh |
| Observability (logs, metrics, traces) | ❌ Fail | No backend logging |
| Data consistency (KPIs match lists) | ❌ Fail | Semantic mismatches |
| Scalability (indexes, pagination) | ❌ Fail | No real DB |

---

## Critical Blockers for AWS Launch

### Must Fix Before Deployment:

1. **Server-side auth middleware**
   - JWT validation on all dealer routes
   - Role enforcement at API layer

2. **Replace mock data with real database queries**
   - Remove all imports from `dealer-mock-data.ts`
   - Implement Prisma queries with dealer scoping

3. **Add CloudWatch logging**
   - Log all errors with context
   - Track dashboard load metrics

4. **Implement token refresh**
   - Handle 401 responses
   - Redirect to login on auth failure

5. **Add database indexes**
   - Index `dealer_id` on all relevant tables
   - Index `created_at` / `last_message_at` for date filtering

6. **Implement pagination**
   - Limit "Needs Attention" to 20 items
   - Limit "Hot Listings" to 5 items

7. **Environment variable configuration**
   - API base URL
   - Auth token endpoint
   - Feature flags

---

## Recommended Implementation Order

### Phase 1: Auth & Security (Week 1)
1. Implement JWT middleware
2. Add server-side role checks
3. Remove mock auth system
4. Add session management

### Phase 2: Data Layer (Week 2)
1. Replace mock Prisma with real client
2. Implement dealer-scoped queries
3. Add database indexes
4. Add pagination

### Phase 3: Observability (Week 3)
1. Add CloudWatch logging
2. Implement error tracking
3. Add performance metrics
4. Add request tracing

### Phase 4: Resilience (Week 4)
1. Add token refresh
2. Implement retry logic
3. Add circuit breakers
4. Load testing

---

## Conclusion

**Status:** 🔴 **NOT PRODUCTION READY**

The Dealer Dashboard has good UI/UX foundations but lacks critical backend infrastructure. All data is mocked, authentication is client-side only, and there is no observability.

**Estimated time to production readiness:** 4-6 weeks

**Recommendation:** Do not deploy to AWS until Phase 1-3 are complete.

---

## Related Documentation

- [Codebase Audit Report](./CODEBASE_AUDIT_REPORT.md)
- [Architecture Overview](../architecture/ARCHITECTURE.md)
- [Dealer Portal V1 Spec](../dealer/DEALER_PORTAL_V1.md)
