# Archived Routes

This folder contains pages that have been removed from the active routing structure.

## Archive Rules:

1. Pages moved here are no longer accessible via URL
2. All references to archived routes must be removed from the codebase
3. Archive date and reason must be documented below

---

## Archived Pages:

### December 29, 2024 - Redirect-Only Pages Archived

**Redirect artifacts (no functionality):**
1. `browse_page.tsx` - Was `/browse` → redirected to `/`
2. `explore_page.tsx` - Was `/explore` → redirected to `/browse`
3. `buyer_browse_page.tsx` - Was `/buyer/browse` → redirected to `/browse`
4. `buyer_welcome_page.tsx` - Was `/buyer/welcome` → redirected to `/welcome`
5. `buyer_page.tsx` - Was `/buyer` → redirected to `/`

**Deprecated implementations:**
6. `_deprecated/explore/` - Old explore page implementation (replaced)

**Reason:** These pages served only as redirect waypoints or deprecated code. All functionality preserved in canonical routes.

### December 29, 2024 - Dealer Dashboard Consolidation

**Duplicate dealer entry points:**
7. `dealer_dashboard_page.tsx` - Was `/dealer/dashboard` → duplicate of `/dealer`

**Reason:** Consolidated to single dealer entry point at `/dealer`. The `/dealer/dashboard` route was redundant and created ambiguity. `/dealer/dashboard/hot-listings` moved to `/dealer/hot-listings` to preserve functionality.

### December 29, 2024 - Dealer Auth Lifecycle Consolidation

**Duplicate dealer auth pages:**
8. `dealer_apply_page.tsx` - Was `/dealer/apply` → duplicate of `/auth/dealer/apply`
9. `dealer_under_review_page.tsx` - Was `/dealer/under-review` → duplicate of `/auth/dealer/pending`

**Reason:** Consolidated dealer application and pending states under `/auth/dealer/*` to clarify that these are pre-approval states, not active dealer functionality. `/dealer/*` now exclusively represents approved dealer functionality.

### December 29, 2024 - Marketplace Route Consolidation

**Duplicate browse/marketplace pages:**
10. `marketplace_page.tsx` - Was `/marketplace` → duplicate of `/` (root browse page)

**Reason:** Canonized `/` as the sole public marketplace/browse entry point. The `/marketplace` route was redundant and created routing fragmentation. All browsing functionality is now centralized at the root route.

### December 29, 2024 - Dev Tools Removal

**Internal diagnostic pages:**
11. `page-directory/page.tsx` - Was `/page-directory` → Dev-only route enumeration tool

**Reason:** This page exposed internal route structure and was never referenced by production code. It served only as a development/audit tool and should not be accessible in production. Archived to prevent route enumeration exposure.

---

**Archive System Created:** December 29, 2024
