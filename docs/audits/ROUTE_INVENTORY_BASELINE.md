# Route Inventory Baseline — Step 1

**Date:** December 29, 2024  
**Purpose:** Establish baseline before archival cleanup

---

## CANONICAL ROUTES (KEEP)

### Public Routes
- ✅ `/` → `src/app/page.tsx` — Canonical Browse (Instagram-style root)
- ✅ `/cars/[country]/[region]/[city]/[slug]` → `src/app/cars/[country]/[region]/[city]/[slug]/page.tsx` — SEO listing detail
- ✅ `/auth` → `src/app/auth/page.tsx` — Unified sign-in/sign-up
- ✅ `/auth/redirect` → `src/app/auth/redirect/page.tsx` — Post-auth role router
- ✅ `/auth/account-invalid` → `src/app/auth/account-invalid/page.tsx` — Error state
- ✅ `/auth/dealer/apply` → `src/app/auth/dealer/apply/page.tsx` — Dealer application form
- ✅ `/auth/dealer/pending` → `src/app/auth/dealer/pending/page.tsx` — Application under review
- ✅ `/welcome` → `src/app/welcome/page.tsx` — Post-auth welcome screen

### Marketing/Info Pages
- ✅ `/meet-carly` → `src/app/meet-carly/page.tsx`
- ✅ `/how-carly-works` → `src/app/how-carly-works/page.tsx`
- ✅ `/help-center` → `src/app/help-center/page.tsx`
- ✅ `/contact-carly` → `src/app/contact-carly/page.tsx`
- ✅ `/report-issue` → `src/app/report-issue/page.tsx`
- ✅ `/trust-and-safety` → `src/app/trust-and-safety/page.tsx`
- ✅ `/data-transparency` → `src/app/data-transparency/page.tsx`
- ✅ `/privacy-policy` → `src/app/privacy-policy/page.tsx`
- ✅ `/terms-of-use` → `src/app/terms-of-use/page.tsx`
- ✅ `/accessibility` → `src/app/accessibility/page.tsx`

### Specialty Features
- ✅ `/as-is-vehicles` → `src/app/as-is-vehicles/page.tsx` — Builder's Market browse
- ✅ `/as-is-vehicles/[id]` → `src/app/as-is-vehicles/[id]/page.tsx` — Single as-is vehicle
- ✅ `/luxury` → `src/app/luxury/page.tsx` — Luxury vehicle landing
- ✅ `/carly-verified` → `src/app/carly-verified/page.tsx` — Verified badge explainer
- ✅ `/ask` → `src/app/ask/page.tsx` — User feedback form
- ✅ `/invite/accept` → `src/app/invite/accept/page.tsx` — Team invitation acceptance

### Buyer Routes
- ✅ `/buyer/garage` → `src/app/buyer/garage/page.tsx` — Saved & owned vehicles
- ✅ `/buyer/messages` → `src/app/buyer/messages/page.tsx` — Messaging interface
- ✅ `/buyer/appointments` → `src/app/buyer/appointments/page.tsx` — Test drive appointments
- ✅ `/buyer/profile` → `src/app/buyer/profile/page.tsx` — Profile settings

### Dealer Routes
- ✅ `/dealer` → `src/app/dealer/page.tsx` — Main dealer dashboard
- ✅ `/dealer/listings` → `src/app/dealer/listings/page.tsx` — Manage inventory
- ✅ `/dealer/messages` → `src/app/dealer/messages/page.tsx` — Dealer messaging
- ✅ `/dealer/appointments` → `src/app/dealer/appointments/page.tsx` — Manage appointments
- ✅ `/dealer/insights` → `src/app/dealer/insights/page.tsx` — Analytics
- ✅ `/dealer/reputation` → `src/app/dealer/reputation/page.tsx` — Reputation management
- ✅ `/dealer/settings` → `src/app/dealer/settings/page.tsx` — Dealer settings
- ✅ `/dealer/onboarding` → `src/app/dealer/onboarding/page.tsx` — Post-approval setup

### Admin Routes
- ✅ `/admin/dashboard` → `src/app/admin/dashboard/page.tsx` — Admin overview
- ✅ `/admin/applications` → `src/app/admin/applications/page.tsx` — Review applications
- ✅ `/admin/dealers` → `src/app/admin/dealers/page.tsx` — View all dealers
- ✅ `/admin/dealers/[id]` → `src/app/admin/dealers/[id]/page.tsx` — Single dealer detail
- ✅ `/admin/listings` → `src/app/admin/listings/page.tsx` — Moderate listings
- ✅ `/admin/users` → `src/app/admin/users/page.tsx` — View all users

**Total Canonical Routes:** 45

---

## CANDIDATES TO ARCHIVE

### Redirect-Only Pages (No Functionality)
- 🗑️ `/browse` → `src/app/browse/page.tsx` — **Redirects to `/`** (backward compatibility only)
- 🗑️ `/explore` → `src/app/explore/page.tsx` — **Redirects to `/browse`** (legacy)
- 🗑️ `/buyer/browse` → `src/app/buyer/browse/page.tsx` — **Redirects to `/browse`** (legacy)
- 🗑️ `/buyer/welcome` → `src/app/buyer/welcome/page.tsx` — **Redirects to `/welcome`** (refactor artifact)
- 🗑️ `/buyer` → `src/app/buyer/page.tsx` — **Redirects to `/`** (waypoint page)

### Deprecated Folder
- 🗑️ `/explore` → `src/app/_deprecated/explore/page.tsx` — **Old explore implementation** (full UI code)

**Total Archive Candidates:** 6

---

## REQUIRES HUMAN DECISION

### Potential Duplicates (Consolidation Needed)
- ❓ `/dealer/dashboard` → `src/app/dealer/dashboard/page.tsx` — **Duplicate of `/dealer`?**
- ❓ `/dealer/dashboard/hot-listings` → `src/app/dealer/dashboard/hot-listings/page.tsx` — **Nested under duplicate route?**
- ❓ `/dealer/apply` → `src/app/dealer/apply/page.tsx` — **Duplicate of `/auth/dealer/apply`?**
- ❓ `/dealer/under-review` → `src/app/dealer/under-review/page.tsx` — **Duplicate of `/auth/dealer/pending`?**

### Unclear Purpose
- ❓ `/marketplace` → `src/app/marketplace/page.tsx` — **Separate from `/` browse? Why?**
- ❓ `/listings/[id]` → `src/app/listings/[id]/page.tsx` — **Legacy route before SEO slugs?**
- ❓ `/auth/intent` → `src/app/auth/intent/page.tsx` — **Low-traffic optional auth step?**
- ❓ `/page-directory` → `src/app/page-directory/page.tsx` — **Dev tool in production?**

**Total Needs Decision:** 8

---

## INVENTORY SUMMARY (Updated After Steps 1-6)

| Category | Count | Status |
|----------|-------|--------|
| **Canonical Keep** | 46 | `/listings/[id]` confirmed canonical |
| **Archived** | 10 | Steps 2-5 complete |
| **Needs Decision** | 6 | Reduced from 8 |
| **TOTAL PAGES** | 62* | Baseline established |

*Note: Some routes added to canonical after investigation

---

## NEXT STEPS (DO NOT EXECUTE YET)

### Step 2: Archive Redirect-Only Pages
1. Move 5 redirect pages to `_archived/`
2. Update `_archived/README.md` with reasons
3. Grep for any remaining references

### Step 3: Handle Deprecated Folder
1. Delete `_deprecated/explore/` entirely

### Step 4: Human Decisions Required
1. Dealer dashboard consolidation
2. Marketplace route purpose
3. Legacy listings route handling

---

**Baseline Established** ✅
