# 🔐 AUTHENTICATION SYSTEM AUDIT REPORT

**Date:** Current State Analysis  
**Status:** READ-ONLY AUDIT  
**Scope:** Buyer, Dealer, and Admin Authentication Flows

---

## EXECUTIVE SUMMARY

The application uses **Supabase Auth** as the primary authentication system with role-based access control. Authentication state is managed via:
- **JWT tokens** in HTTP-only cookies (session management)
- **User metadata** for role and status information
- **Middleware** for server-side route protection
- **Client-side context** for UI state and conditional rendering

**Architecture Pattern:** Middleware-first routing with client-side hydration

---

## 1️⃣ BUYER AUTHENTICATION FLOW

### Entry Points
- **Sign-up/Sign-in:** `/auth/buyer` → `AuthForm` component
- **Welcome page:** `/buyer/welcome` (post-signup)
- **Protected routes:** `/buyer/*` (browse, garage, messages, appointments, profile)

### Auth Mechanism

**Supabase Client Used:**
- Browser: `getSupabaseBrowserClient()` (anon key + cookies)
- Server: `createClient()` from `@/lib/supabase/server` (anon key + SSR cookies)

**Sign-up Flow (`src/lib/auth/auth-provider.ts`):**
```typescript
1. User fills form: email, password, fullName, city
2. Validation: fullName and city REQUIRED for buyers
3. Call: supabase.auth.signUp() with user_metadata:
   { role: 'buyer', full_name: '...', city: '...' }
4. Auto-login after signup
5. Navigate to /buyer/welcome
```

**Sign-in Flow:**
```typescript
1. User submits email + password
2. Call: supabase.auth.signInWithPassword()
3. Session created (JWT in cookie)
4. AuthContext loads user via onAuthStateChange listener
5. Middleware redirects to /buyer/browse
```

**Session Persistence:**
- JWT stored in HTTP-only cookie (`sb-<project>-auth-token`)
- Expires per Supabase settings (default 1 hour, refresh token 30 days)
- Token refresh handled automatically by Supabase client

### Role & State Resolution

**Where role lives:**
- JWT claims: `session.user.user_metadata.role === 'buyer'`
- AuthContext state: `user.role === 'buyer'`
- No database table for users (Supabase auth.users only)

**Resolution logic (`src/contexts/AuthContext.tsx`):**
```typescript
1. getSession() on mount
2. loadUserFromSession() extracts:
   - role from user_metadata
   - email_confirmed_at → verified flag
3. Sets user state with role: 'buyer'
4. isBuyer = user?.role === 'buyer'
```

**Race conditions:**
- ✅ NONE - AuthContext uses isLoading flag
- ✅ Middleware waits for session before routing

### Routing & Access Control

**Middleware (`middleware.ts` lines 92-94):**
```typescript
if (pathname.startsWith('/buyer') && role !== 'buyer') {
  return NextResponse.redirect(new URL('/dealer', req.url))
}
```

**Client-side Guards:**
- `BuyerLayout.tsx`: Renders null if !user or !isBuyer
- `StateRouter.tsx`: Shows BuyerNav + footer for isBuyer

**Redirect paths:**
- Unauthenticated → `/auth/buyer`
- Wrong role (dealer accessing /buyer) → `/dealer`

### Known Risks / Observations

✅ **Strengths:**
- Full name and city enforced at signup (prevents incomplete profiles)
- No client-side redirects (middleware owns routing)
- RLS policies protect buyer-specific data (saved vehicles, appointments)

⚠️ **Potential Issues:**
- No email verification enforcement (verified flag exists but not gated)
- Signup auto-login means no email confirmation step
- City data stored as string (not normalized to cities table)

### File Inventory

| File | Purpose |
|------|---------|
| `src/app/auth/buyer/page.tsx` | Buyer auth UI (role selection + form) |
| `src/components/auth/AuthForm.tsx` | Shared sign-in/sign-up form component |
| `src/lib/auth/auth-provider.ts` | Supabase auth API wrapper (signup, signin) |
| `src/contexts/AuthContext.tsx` | Client-side auth state + session management |
| `middleware.ts` | Server-side route protection (lines 92-94) |
| `src/app/buyer/layout.tsx` | Buyer route layout with auth guards |
| `src/components/layouts/BuyerNav.tsx` | Buyer navigation bar |
| `src/components/layouts/StateRouter.tsx` | Top-level routing orchestrator |

---

## 2️⃣ DEALER AUTHENTICATION FLOW

### Entry Points
- **Sign-in:** `/auth/dealer` (existing account)
- **Application submission:** `/auth/dealer/apply` (new dealers)
- **Pending status:** `/dealer/under-review` (awaiting approval)
- **Portal access:** `/dealer/*` (approved dealers only)

### Auth Mechanism

**Supabase Client Used:**
- Browser: `getSupabaseBrowserClient()` (anon key)
- Server (API): `createClient()` from `@/lib/supabase/server` (anon key + cookies)
- Admin (approval): `getSupabaseAdminClient()` (service role key)

**Dealer Account Creation:**
```typescript
Flow: Create auth account first → Submit application → Wait for admin approval

1. Dealer visits /auth/dealer/apply
2. If not logged in:
   - Shows auth form (signup or login)
   - Creates Supabase auth user with role: 'dealer'
   - user_metadata: { role: 'dealer' } (NO dealer_status yet)
3. Once authenticated:
   - Shows application form (3 steps)
   - Submits to /api/dealer-applications
   - Links application to user_id
4. Application saved with status: 'pending'
5. Redirected to /dealer/under-review
```

**Dealer Sign-in Flow:**
```typescript
1. User navigates to /auth/dealer
2. Chooses "Dealer Sign In"
3. Submits email + password
4. Call: login(email, password, 'dealer')
5. AuthContext loads session
6. Middleware checks dealer_status:
   - If pending → /dealer/under-review
   - If approved → /dealer (portal)
```

**Application Linkage:**
- `dealer_applications.user_id` = Supabase auth.users.id
- Status stored in: `dealer_applications.status` (pending/approved/rejected)
- Approval updates BOTH:
  - `dealer_applications.status = 'approved'`
  - `auth.users.user_metadata.dealer_status = 'approved'`

### Role & State Resolution

**How role is determined:**
```typescript
// Initial signup
user_metadata: { role: 'dealer' }

// After approval
user_metadata: {
  role: 'dealer',
  dealer_status: 'approved'
}
```

**Where role/status lives:**
1. **JWT claims:** `session.user.user_metadata.role` and `dealer_status`
2. **Database:** `dealer_applications.status` (source of truth before approval)
3. **AuthContext:** `user.dealerStatus` (derived from metadata)

**Race conditions:**
- ⚠️ **POTENTIAL ISSUE:** AuthContext hardcodes `dealerStatus = 'pending'` (line 104)
  - Comment says "TODO: Fetch from database"
  - Currently does NOT query `dealer_applications` table
  - Relies entirely on `user_metadata.dealer_status`
  - If metadata not set, dealer stuck in pending state

### Routing & Access Control

**Middleware (`middleware.ts` lines 74-90):**
```typescript
if (pathname.startsWith('/dealer')) {
  // Allow /dealer/under-review for pending dealers
  if (pathname === '/dealer/under-review') {
    return response
  }
  
  // Redirect non-dealers
  if (role !== 'dealer') {
    return NextResponse.redirect(new URL('/buyer', req.url))
  }
  
  // Check approval status from user_metadata
  if (dealerStatus !== 'approved') {
    return NextResponse.redirect(new URL('/dealer/under-review', req.url))
  }
}
```

**Client-side Guards:**
- `DealerLayout.tsx`: Returns null if !user or role !== 'dealer'
- `StateRouter.tsx`: Shows DealerNav only for `isDealerApproved`

**Redirect paths:**
- Unauthenticated → `/auth/buyer`
- Pending dealer → `/dealer/under-review`
- Approved dealer → `/dealer` (dashboard)

### Dealer Approval Gating

**Pre-approval behavior:**
1. Dealer logs in with role: 'dealer' (no dealer_status)
2. Middleware reads `dealer_status` from user_metadata
3. If undefined or 'pending' → `/dealer/under-review`
4. Page shows "Application Under Review" message
5. Cannot access dealer portal until approved

**Post-approval behavior:**
1. Admin clicks "Approve" in `/admin/applications`
2. API route `/api/admin/approve-dealer` (service role):
   - Updates `dealer_applications.status = 'approved'`
   - Updates `auth.users.user_metadata.dealer_status = 'approved'`
   - Creates `profiles` record via RPC function
3. Dealer logs out + logs back in (refresh JWT)
4. Middleware now allows access to `/dealer/*`

**Failure states:**
- **No application:** Dealer can log in but stuck at under-review
- **Expired session:** User must log in again to get updated metadata
- **Rejected application:** No current flow (status exists but no UI)

### Known Risks / Observations

⚠️ **CRITICAL ISSUE - Dealer Status Race Condition:**
- AuthContext hardcodes `dealerStatus = 'pending'` instead of querying DB
- If admin approves while dealer is logged in, they won't see approval until logout
- JWT refresh doesn't update user object in AuthContext

⚠️ **Approval Flow Dependency:**
- Dealer MUST create auth account before applying
- If application submitted without user_id, approval fails
- No mechanism to link existing applications to newly created accounts

✅ **Strengths:**
- Middleware enforces approval gating (cannot bypass)
- Service role key only used server-side (secure)
- RLS policies protect dealer-specific data

### File Inventory

| File | Purpose |
|------|---------|
| `src/app/auth/dealer/page.tsx` | Dealer sign-in page (select signin or apply) |
| `src/app/auth/dealer/apply/page.tsx` | Dealer application form (3-step wizard) |
| `src/app/dealer/under-review/page.tsx` | Pending dealer holding page |
| `src/app/dealer/layout.tsx` | Dealer portal layout with auth guards |
| `src/app/api/dealer-applications/route.ts` | Submit dealer application (authenticated) |
| `src/app/api/dealer/my-application/route.ts` | Fetch own application status |
| `src/app/api/admin/approve-dealer/route.ts` | Admin approval endpoint (service role) |
| `src/lib/api/dealer-applications.ts` | Dealer application API client |
| `src/contexts/AuthContext.tsx` | Auth state (lines 100-104: dealer status logic) |
| `middleware.ts` | Dealer approval gating (lines 74-90) |
| `src/components/dealer/DealerSidebar.tsx` | Dealer navigation |

---

## 3️⃣ ADMIN AUTHENTICATION FLOW

### Entry Points
- **Login:** NO dedicated `/auth/admin` page (forbidden)
- **Access:** Admins log in via `/auth/buyer` or `/auth/dealer`
- **Portal:** `/admin/*` routes (dashboard, applications, dealers, users, listings)

### Auth Mechanism

**Supabase Client Used:**
- Browser: `getSupabaseBrowserClient()` (session check only)
- Server API: `getSupabaseAdminClient()` (service role for RLS bypass)

**Admin Identification:**
- Admin flag stored in `user_metadata.is_admin === true`
- Set manually via Supabase Dashboard or SQL:
  ```sql
  UPDATE auth.users
  SET raw_user_meta_data = raw_user_meta_data || '{"is_admin": true}'::jsonb
  WHERE email = 'admin@example.com';
  ```

**Login Flow:**
```typescript
1. Admin user logs in via /auth/buyer (or /auth/dealer)
2. Supabase returns session with JWT
3. JWT contains user_metadata: { is_admin: true }
4. AuthContext detects admin flag (line 85):
   isAdminFlag = session.user.user_metadata?.is_admin === true
5. Middleware checks admin flag (line 49):
   if (session.user.user_metadata?.is_admin !== true) redirect('/')
6. If true, allows access to /admin/*
```

**Session Hydration:**
```typescript
AuthContext.tsx (lines 83-126):
1. checkSession() on mount
2. Calls loadUserFromSession(session)
3. Extracts is_admin from user_metadata
4. Sets isAdmin state (line 88)
5. NO client-side redirect (removed to prevent infinite loop)
6. Logs: '[AUTH] Admin user loaded'
```

### Role & State Resolution

**Where admin flag lives:**
- **JWT claims:** `session.user.user_metadata.is_admin` (boolean)
- **AuthContext state:** `isAdmin` (boolean)
- **NOT a role:** Admins may also have `role: 'buyer'` or `role: 'dealer'`

**Resolution logic:**
```typescript
middleware.ts (line 49):
session.user.user_metadata?.is_admin !== true → redirect('/')

AuthContext.tsx (line 85):
const isAdminFlag = session.user.user_metadata?.is_admin === true
```

**Race conditions:**
- ✅ RESOLVED - No client-side redirects (middleware only)
- ✅ Admin check happens BEFORE role checks in middleware
- ⚠️ Admin with role 'dealer' and status 'pending' → can still access /admin, NOT /dealer

### Routing & Access Control

**Middleware (`middleware.ts` lines 44-56):**
```typescript
// FIRST PRIORITY: Admin route protection
if (pathname.startsWith('/admin')) {
  if (!session || session.user.user_metadata?.is_admin !== true) {
    console.warn('[MIDDLEWARE] Admin access denied:', pathname)
    return NextResponse.redirect(new URL('/', req.url))
  }
  return response  // Allow if admin
}
```

**Client-side Guards:**
- `AdminLayout.tsx`: Returns null if !user (middleware already checked)
- No client-side admin flag checks (middleware is single source of truth)

**Redirect paths:**
- Unauthenticated admin → `/` (silent redirect)
- Authenticated non-admin → `/` (no error message)
- Admin accessing buyer/dealer routes → Allowed (admin has full access)

### Known Risks / Observations

✅ **Security Strengths:**
- No `/auth/admin` login page (prevents discovery)
- Silent redirects (no information disclosure)
- Admin flag in JWT (client cannot modify)
- RLS policies check `(auth.jwt() ->> 'role') = 'admin'` (typo: should be checking 'is_admin')

⚠️ **RLS POLICY MISMATCH:**
- RLS policies check: `(auth.jwt() ->> 'role') = 'admin'`
- Actual JWT contains: `user_metadata.is_admin = true`
- **CRITICAL BUG:** Admin RLS policies will FAIL
- Correct check should be:
  ```sql
  ((auth.jwt() ->> 'user_metadata')::jsonb ->> 'is_admin') = 'true'
  ```

⚠️ **Admin + Dealer Interaction:**
- Admin with `role: 'dealer'` and `dealer_status: 'pending'`:
  - CAN access `/admin/*`
  - CANNOT access `/dealer/*` (pending status blocks)
- No documented behavior for this edge case

✅ **Access Control:**
- Middleware blocks all `/admin/*` for non-admins
- API routes use service role client (bypass RLS)
- No client-side admin elevation possible

### File Inventory

| File | Purpose |
|------|---------|
| `middleware.ts` | Admin route protection (lines 44-56) |
| `src/app/admin/layout.tsx` | Admin portal layout (no redirects) |
| `src/app/admin/dashboard/page.tsx` | Admin dashboard page |
| `src/app/admin/applications/page.tsx` | Dealer application management |
| `src/app/admin/dealers/page.tsx` | Dealer management |
| `src/app/admin/users/page.tsx` | User management |
| `src/contexts/AuthContext.tsx` | Admin flag detection (lines 85-122) |
| `src/lib/supabase/admin.ts` | Service role client (RLS bypass) |
| `src/app/api/admin/approve-dealer/route.ts` | Dealer approval API |
| `src/components/admin/AdminNav.tsx` | Admin navigation |
| `src/lib/db/schema-rls.sql` | RLS policies (admin checks) |

---

## SYSTEM CONSISTENCY VERDICT

### Are Buyer, Dealer, and Admin flows aligned architecturally?

✅ **YES - Core pattern is consistent:**
- All flows use Supabase Auth for authentication
- All flows use middleware for route protection
- All flows use JWT claims in user_metadata for roles/flags
- All flows use AuthContext for client-side state

⚠️ **NO - Implementation inconsistencies:**
- **Buyer:** Fully implemented, role stored in JWT
- **Dealer:** Role in JWT, but status requires dual-source (JWT + DB)
- **Admin:** Flag in JWT, but RLS policies broken (wrong JWT path)

### Are there overlapping responsibilities between middleware and client code?

✅ **RESOLVED (as of recent fixes):**
- Middleware: Sole authority for routing decisions
- Client: UI rendering only (no redirects)
- Previous issues (infinite loops from client redirects) fixed

⚠️ **REMAINING OVERLAP:**
- Dealer status checked in BOTH:
  - Middleware: `user_metadata.dealer_status`
  - Database: `dealer_applications.status`
- No sync mechanism if these diverge

### Is there a single source of truth per flow?

**Buyer:** ✅ YES
- Role in JWT (`user_metadata.role`)
- Middleware checks JWT
- No database queries needed

**Dealer:** ⚠️ PARTIAL
- Role in JWT (`user_metadata.role`)
- **Status in TWO places:**
  1. `auth.users.user_metadata.dealer_status` (checked by middleware)
  2. `dealer_applications.status` (checked by admin UI)
- These can diverge if approval flow fails partway

**Admin:** ❌ NO
- Flag in JWT (`user_metadata.is_admin`)
- **RLS policies check WRONG path:**
  - Policy: `(auth.jwt() ->> 'role') = 'admin'`
  - Actual: `((auth.jwt() ->> 'user_metadata')::jsonb ->> 'is_admin') = 'true'`
- Database admin queries will fail for all admins

---

## CRITICAL FINDINGS

### 🔴 HIGH SEVERITY

1. **Admin RLS Policies Broken**
   - All RLS policies check `role = 'admin'`
   - Admins have `is_admin = true` flag, NOT role
   - Impact: Admins cannot query protected tables via Supabase client

2. **Dealer Status Hardcoded**
   - AuthContext sets `dealerStatus = 'pending'` without DB query
   - Real status never fetched from `dealer_applications`
   - Impact: Approved dealers may show as pending in UI

### ⚠️ MEDIUM SEVERITY

3. **Dealer Status Dual-Source**
   - Status exists in JWT AND database
   - No automatic sync if approval fails partway
   - Impact: Dealer may be approved in DB but not in JWT

4. **No Email Verification**
   - Buyers and dealers can use platform without verifying email
   - `verified` flag exists but not enforced
   - Impact: Account takeover risk, fake accounts

### ℹ️ LOW SEVERITY

5. **Dealer Approval Requires Manual JWT Refresh**
   - Approved dealer must log out and log back in
   - No automatic token refresh on approval
   - Impact: Poor UX, confusion

---

## AUTH AUDIT COMPLETE — NO CODE CHANGES PERFORMED.
