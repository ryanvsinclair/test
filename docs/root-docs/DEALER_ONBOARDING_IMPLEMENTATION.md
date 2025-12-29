# Dealer Onboarding Flow - Implementation Complete

## Overview
Switched dealer onboarding to: "Dealer creates account first → application status gates access to dealer portal"

## Changes Made

### 1. Database Migration
**File:** `supabase/migrations/001_dealer_application_user_linking.sql`
- Added `user_id` column to `dealer_applications` table
- Backfill `user_id` by matching emails
- Created unique index to enforce one application per user
- Normalized status values and enforced ENUM type
- Added RLS policy for dealers to view their own application

### 2. Dealer Application Flow
**File:** `src/app/auth/dealer/apply/page.tsx`
- Added authentication step before application form
- User must create account or log in first
- Pre-fills email from authenticated session
- Success message redirects to dealer portal

**File:** `src/app/api/dealer-applications/route.ts`
- Changed from public endpoint to authenticated
- Uses SSR to read session from cookies
- Inserts `user_id` from authenticated session
- Returns 401 if not authenticated

### 3. Dealer Portal Gating
**File:** `middleware.ts`
- Added dealer status check for `/dealer` routes
- Allows `/dealer/under-review` for pending dealers
- Redirects unapproved dealers to under-review page
- Approved dealers can access full dealer portal

**File:** `src/app/dealer/under-review/page.tsx` (NEW)
- Clean UI showing application status
- Displays submission date
- CTA buttons: "Update application" and "Log Out"

**File:** `src/app/api/dealer/my-application/route.ts` (NEW)
- Authenticated endpoint for dealers to view their application
- Queries by `user_id` first, then email fallback
- Returns application status and details

### 4. Admin Approval Changes
**File:** `src/app/api/admin/approve-dealer/route.ts`
- NO MORE user creation during approval
- Verifies application has `user_id`
- If missing, attempts to find user by email
- Returns 409 if no user account exists
- Only updates auth metadata: `role='dealer'`, `dealer_status='approved'`
- Updates application status to 'approved'
- Idempotent: returns 200 if already approved

### 5. Admin UI Improvements
**File:** `src/app/admin/applications/page.tsx`
- Fixed date formatting with error handling
- All fields display with "—" fallback

**File:** `src/app/api/admin/dealer-applications/route.ts`
- Cleaned up audit logging (removed noisy duplicates)
- Simplified to single log per request

## Manual Test Checklist

### Test 1: Dealer Account Creation
- [ ] Navigate to `/auth/dealer/apply`
- [ ] Create new dealer account with email/password
- [ ] Verify redirected to application form
- [ ] Email field pre-filled from auth session

### Test 2: Submit Application
- [ ] Complete and submit application form
- [ ] Check database: `dealer_applications` row has `user_id`
- [ ] Verify redirected to dealer portal

### Test 3: Unapproved Dealer Access
- [ ] As unapproved dealer, visit `/dealer`
- [ ] Should redirect to `/dealer/under-review`
- [ ] Page shows "Pending" status
- [ ] Shows submission date

### Test 4: Admin Approval
- [ ] Admin logs in, views applications
- [ ] Click application row, modal shows all fields
- [ ] Click "Approve Dealer"
- [ ] Verify auth user metadata updated (`dealer_status='approved'`)
- [ ] Verify application status = 'approved' in database
- [ ] List refreshes automatically

### Test 5: Approved Dealer Access
- [ ] Dealer refreshes `/dealer` page
- [ ] Should access full dealer portal (no redirect)
- [ ] All dealer routes accessible

### Test 6: Buyer Routes Unchanged
- [ ] Buyer can create account
- [ ] Buyer routes work normally
- [ ] No interference from dealer changes

### Test 7: Admin Routes Unchanged
- [ ] Admin can log in
- [ ] Admin dashboard loads
- [ ] All admin functions work
- [ ] No nav/footer in admin area

### Test 8: Existing Dealer Login
- [ ] Dealer with existing account logs in
- [ ] Can update their application
- [ ] Form pre-fills email from session

## Database Setup
Run migration:
```bash
# Apply migration to link applications to users
supabase migration up
```

## Notes
- Buyer flows unchanged
- Admin (`is_admin`) access unchanged
- All dealer routes now gated by `dealer_status === 'approved'`
- Dealers can log in anytime but see under-review page if pending
- Admin approval is idempotent and no longer creates users
