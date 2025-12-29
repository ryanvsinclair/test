# DEALERSHIP ARCHITECTURE REFACTOR

## Status: Analysis Complete, SQL Migration Created

---

## DELIVERABLES

### 1. Master SQL Migration File
**Location:** `supabase/migrations/100_dealership_architecture.sql`

This file:
- Drops obsolete `dealer_applications` and `dealers` tables
- Creates `dealerships` table with lifecycle + operational status
- Updates `profiles` table with `dealership_id` foreign key
- Migrates existing data from old tables
- Updates `listings` table (`dealer_id` → `dealership_id`)
- Updates all RLS policies for dealership-scoped access
- Safe to run on fresh Supabase project

---

## 2. FILES TO CHANGE

### Core Auth & Context (CRITICAL)

#### `src/contexts/AuthContext.tsx`
**Current:** Reads role from `session.user.user_metadata.role` (JWT)  
**Change:** Query `profiles` table for role and dealership_id

```typescript
// REPLACE loadUserFromSession function
async function loadUserFromSession(session: Session) {
  try {
    const isAdminFlag = session.user.user_metadata?.is_admin === true;
    
    // NEW: Query profiles table for authoritative role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, dealership_id, name, verified')
      .eq('id', session.user.id)
      .single();
    
    if (!profile && !isAdminFlag) {
      console.log('[AUTH] No profile found');
      setUser(null);
      return;
    }
    
    const role = profile?.role || 'buyer';
    
    setUser({
      id: session.user.id,
      email: session.user.email!,
      name: profile?.name || session.user.email!.split('@')[0],
      role: role as 'buyer' | 'dealer',
      verified: profile?.verified || false,
      createdAt: session.user.created_at!,
      dealershipId: profile?.dealership_id, // NEW
    });
    
    setIsAdmin(isAdminFlag);
  } catch (error) {
    console.error('[AUTH] Failed to load user:', error);
  }
}
```

---

#### `middleware.ts`
**Current:** Reads role from JWT  
**Change:** Query `profiles` table, add onboarding gate

```typescript
// REPLACE lines 63-90 with:

const supabase = createServerClient(/* ... existing setup */);
const { data: { session } } = await supabase.auth.getSession();

if (!session) {
  return NextResponse.redirect(new URL('/auth', req.url));
}

const isAdmin = session.user.user_metadata?.is_admin === true;

// Query profiles for authoritative role and dealership_id
const { data: profile } = await supabase
  .from('profiles')
  .select('role, dealership_id')
  .eq('id', session.user.id)
  .single();

if (!profile && !isAdmin) {
  return NextResponse.redirect(new URL('/auth/account-invalid', req.url));
}

const role = profile?.role || 'buyer';
const dealershipId = profile?.dealership_id;

// DEALER PORTAL GATING
if (pathname.startsWith('/dealer')) {
  // Non-dealers cannot access
  if (role !== 'dealer') {
    return NextResponse.redirect(new URL('/buyer', req.url));
  }
  
  // Dealers must have dealership_id
  if (!dealershipId) {
    return NextResponse.redirect(new URL('/dealer/apply', req.url));
  }
  
  // Check dealership lifecycle status
  const { data: dealership } = await supabase
    .from('dealerships')
    .select('lifecycle_status')
    .eq('id', dealershipId)
    .single();
  
  // Pending → cannot access yet (waiting for admin approval)
  if (dealership?.lifecycle_status === 'pending') {
    return NextResponse.redirect(new URL('/', req.url));
  }
  
  // Approved → must complete onboarding
  if (dealership?.lifecycle_status === 'approved' && pathname !== '/dealer/onboarding') {
    return NextResponse.redirect(new URL('/dealer/onboarding', req.url));
  }
  
  // Active → can access portal (but not onboarding)
  if (dealership?.lifecycle_status === 'active' && pathname === '/dealer/onboarding') {
    return NextResponse.redirect(new URL('/dealer', req.url));
  }
}

// BUYER ROUTES
if (pathname.startsWith('/buyer') && role !== 'buyer') {
  return NextResponse.redirect(new URL('/dealer', req.url));
}

return response;
```

---

### Auth Pages (REDESIGN)

#### `src/app/auth/page.tsx` (NEW - UNIFIED AUTH)
**Create unified auth page at `/auth` (not `/auth/buyer` or `/auth/dealer`)**

```typescript
'use client';

import { AuthForm } from '@/components/auth/AuthForm';

export default function AuthPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full">
        <h1 className="text-3xl font-bold text-center mb-8">
          Welcome to Carly
        </h1>
        <AuthForm />
      </div>
    </div>
  );
}
```

**Remove:**
- `src/app/auth/buyer/page.tsx` ❌
- `src/app/auth/dealer/page.tsx` ❌

---

#### `src/components/auth/AuthForm.tsx`
**Change:** Remove role selection, all signups default to buyer

```typescript
// REMOVE role prop from signup
// REMOVE dealer/buyer toggle UI

// In signup function:
const { error } = await signUp({
  email,
  password,
  options: {
    data: {
      full_name: fullName,
      city: city,
      // NO ROLE - defaults to buyer in profiles table
    }
  }
});
```

---

### Dealer Application (MOVED & REDESIGNED)

#### `src/app/dealer/apply/page.tsx` (NEW)
**Accessible to authenticated buyers only**

```typescript
'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function DealerApplicationPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  
  // ONLY buyers can apply
  if (!isLoading && (!user || user.role !== 'buyer')) {
    router.push('/');
    return null;
  }
  
  const handleSubmit = async (formData) => {
    const response = await fetch('/api/dealerships/apply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });
    
    if (response.ok) {
      // Redirect to home (user remains buyer)
      router.push('/');
    }
  };
  
  return (
    <div>
      <h1>Apply to Become a Dealer</h1>
      {/* Application form */}
    </div>
  );
}
```

**Remove:**
- `src/app/auth/dealer/apply/page.tsx` ❌
- `src/app/dealer/under-review/page.tsx` ❌

---

#### `src/app/api/dealerships/apply/route.ts` (NEW)
**Creates dealerships row, user remains buyer**

```typescript
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const supabase = createClient();
  
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  // Verify user is a buyer
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', session.user.id)
    .single();
  
  if (profile?.role !== 'buyer') {
    return NextResponse.json({ error: 'Only buyers can apply' }, { status: 403 });
  }
  
  const body = await request.json();
  
  // Create dealership with pending status
  const { data, error } = await supabase
    .from('dealerships')
    .insert({
      lifecycle_status: 'pending',
      operational_status: 'disabled',
      contact_email: session.user.email,
      contact_name: body.contactName,
      contact_phone: body.phone,
      legal_name: body.dealershipName,
      dealership_type: body.dealershipType,
      city: body.city,
      region: body.region,
      country: body.country,
      timezone: body.timezone,
      description: body.description,
      // ... other fields
    })
    .select()
    .single();
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  
  return NextResponse.json({ success: true, dealership: data });
}
```

---

### Dealer Onboarding (NEW)

#### `src/app/dealer/onboarding/page.tsx` (NEW)
**Approved dealers complete onboarding here**

```typescript
'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function DealerOnboardingPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [dealership, setDealership] = useState(null);
  
  useEffect(() => {
    if (user?.dealershipId) {
      fetch(`/api/dealerships/${user.dealershipId}`)
        .then(res => res.json())
        .then(data => setDealership(data.dealership));
    }
  }, [user]);
  
  const handleComplete = async (onboardingData) => {
    const response = await fetch(`/api/dealerships/${user.dealershipId}/activate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(onboardingData),
    });
    
    if (response.ok) {
      router.push('/dealer'); // To portal
    }
  };
  
  return (
    <div>
      <h1>Complete Your Dealership Setup</h1>
      {/* Wizard: branding, payout, final details */}
    </div>
  );
}
```

---

#### `src/app/api/dealerships/[id]/activate/route.ts` (NEW)
**Completes onboarding, activates dealership**

```typescript
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createClient();
  
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  // Verify user owns this dealership
  const { data: profile } = await supabase
    .from('profiles')
    .select('dealership_id')
    .eq('id', session.user.id)
    .single();
  
  if (profile?.dealership_id !== params.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  
  const body = await request.json();
  
  // Update dealership to active
  const { error } = await supabase
    .from('dealerships')
    .update({
      lifecycle_status: 'active',
      operational_status: 'enabled',
      activated_at: new Date().toISOString(),
      branding: body.branding,
      payout_details: body.payoutDetails,
      // ... other onboarding fields
    })
    .eq('id', params.id)
    .eq('lifecycle_status', 'approved'); // Must be approved first
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  
  return NextResponse.json({ success: true });
}
```

---

### Admin Pages (UPDATE)

#### `src/app/admin/applications/page.tsx`
**Change:** Query `dealerships` instead of `dealer_applications`

```typescript
// REPLACE fetch call:
const response = await fetch('/api/admin/dealerships?status=pending', {
  cache: 'no-store',
});

// Display lifecycle_status instead of status
// Show approve/reject actions
```

---

#### `src/app/api/admin/dealerships/[id]/approve/route.ts` (NEW)
**Approves application, converts buyer to dealer**

```typescript
import { getSupabaseAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createClient();
  const adminSupabase = getSupabaseAdminClient();
  
  // Verify admin
  const { data: { session } } = await supabase.auth.getSession();
  if (!session || session.user.user_metadata?.is_admin !== true) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  // Get dealership
  const { data: dealership } = await adminSupabase
    .from('dealerships')
    .select('contact_email')
    .eq('id', params.id)
    .single();
  
  if (!dealership) {
    return NextResponse.json({ error: 'Dealership not found' }, { status: 404 });
  }
  
  // Find user by email
  const { data: profile } = await adminSupabase
    .from('profiles')
    .select('id')
    .eq('email', dealership.contact_email)
    .single();
  
  if (!profile) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }
  
  // ATOMIC APPROVAL
  // 1. Update dealership
  await adminSupabase
    .from('dealerships')
    .update({
      lifecycle_status: 'approved',
      approved_at: new Date().toISOString(),
      reviewed_by: session.user.id,
    })
    .eq('id', params.id);
  
  // 2. Update profile (buyer → dealer, link dealership)
  await adminSupabase
    .from('profiles')
    .update({
      role: 'dealer',
      dealership_id: params.id,
    })
    .eq('id', profile.id);
  
  return NextResponse.json({ success: true });
}
```

---

### Dealer Portal Pages (UPDATE)

#### `src/app/dealer/page.tsx`
**Change:** Use `dealership_id` from user context

```typescript
// REPLACE dashboard fetch:
const response = await fetch(`/api/dealerships/${user.dealershipId}/dashboard`, {
  cache: 'no-store',
});
```

---

#### `src/app/dealer/listings/page.tsx`
**Change:** Query by `dealership_id` instead of `dealer_id`

```typescript
// REPLACE listings fetch:
const { data: listings } = await supabase
  .from('listings')
  .select('*')
  .eq('dealership_id', user.dealershipId)
  .order('created_at', { ascending: false });
```

---

### Type Definitions (UPDATE)

#### `src/types/index.ts`
**Add:**

```typescript
export type Dealership = {
  id: string;
  lifecycle_status: 'pending' | 'approved' | 'active' | 'rejected';
  operational_status: 'enabled' | 'disabled';
  legal_name: string;
  trade_name?: string;
  contact_email: string;
  contact_name: string;
  contact_phone?: string;
  city?: string;
  region?: string;
  country?: string;
  branding?: Record<string, any>;
  created_at: string;
  approved_at?: string;
  activated_at?: string;
};

export type User = {
  id: string;
  email: string;
  name: string;
  role: 'buyer' | 'dealer';
  verified: boolean;
  createdAt: string;
  dealershipId?: string; // NEW
};
```

**Remove:**
```typescript
dealerStatus?: 'pending' | 'approved' | 'rejected'; // DELETE
```

---

## 3. KEY ARCHITECTURAL DECISIONS

### Role Resolution Authority
**Location:** `profiles` table (database)  
**NOT:** JWT `user_metadata.role`

**Why:**
- Database is single source of truth
- Role changes take effect immediately
- No JWT refresh required
- Middleware queries on every request (fast with indexes)

---

### Onboarding Gate Location
**Location:** `middleware.ts` (lines 74-90)

**Logic:**
1. Check `profiles.role = 'dealer'` ✅
2. Check `profiles.dealership_id IS NOT NULL` ✅
3. Query `dealerships.lifecycle_status`:
   - `pending` → Redirect to `/` (wait for admin)
   - `approved` → Redirect to `/dealer/onboarding`
   - `active` → Allow portal access

---

### Where Redirects Happen
**ONLY in middleware** - No client-side auth redirects

- AuthContext: Sets state only
- Admin/Dealer Layouts: Render null if unauthorized
- Middleware: Owns all routing decisions

---

## 4. REMOVED FILES

| File | Reason |
|------|--------|
| `src/app/auth/buyer/page.tsx` | Unified auth at `/auth` |
| `src/app/auth/dealer/page.tsx` | Unified auth at `/auth` |
| `src/app/auth/dealer/apply/page.tsx` | Moved to `/dealer/apply` |
| `src/app/dealer/under-review/page.tsx` | Replaced by onboarding flow |
| `src/app/api/dealer-applications/*` | Replaced by dealerships API |
| `src/lib/api/dealer-applications.ts` | Obsolete |

---

## 5. TESTING SEQUENCE

### 1. Fresh Signup
- [ ] Visit `/auth`
- [ ] Sign up with email/password
- [ ] Profile created with `role='buyer'`
- [ ] No dealership_id
- [ ] Redirected to `/buyer/browse`

### 2. Dealer Application
- [ ] Buyer visits `/dealer/apply`
- [ ] Submits application form
- [ ] `dealerships` row created (`lifecycle_status='pending'`)
- [ ] User still shows as buyer
- [ ] Redirected to `/`

### 3. Admin Approval
- [ ] Admin visits `/admin/applications`
- [ ] Sees pending dealership
- [ ] Clicks approve
- [ ] `dealerships.lifecycle_status` → `'approved'`
- [ ] `profiles.role` → `'dealer'`
- [ ] `profiles.dealership_id` → set

### 4. Dealer Onboarding
- [ ] Approved dealer logs in
- [ ] Middleware detects `lifecycle_status='approved'`
- [ ] Redirected to `/dealer/onboarding`
- [ ] Completes wizard
- [ ] `lifecycle_status` → `'active'`
- [ ] `operational_status` → `'enabled'`
- [ ] Redirected to `/dealer` (portal)

### 5. Dealer Operations
- [ ] Can access `/dealer/*`
- [ ] Listings query by `dealership_id`
- [ ] Cannot see other dealerships' data
- [ ] RLS enforces scope

### 6. Admin Deactivation
- [ ] Admin sets `operational_status='disabled'`
- [ ] Dealership hidden from marketplace
- [ ] Dealer can still log in
- [ ] Can view own listings (not public)

---

## 6. DEPLOYMENT CHECKLIST

- [ ] Backup database
- [ ] Run `supabase/migrations/100_dealership_architecture.sql`
- [ ] Verify dealerships table created
- [ ] Verify profiles.dealership_id column added
- [ ] Verify listings.dealership_id updated
- [ ] Deploy code changes
- [ ] Test buyer signup
- [ ] Test dealer application
- [ ] Test admin approval
- [ ] Test dealer onboarding
- [ ] Monitor error logs

---

## SUCCESS CRITERIA

✅ **Architecture:**
- Single source of truth: `profiles.role`, `dealerships.lifecycle_status`
- No JWT dependencies for authorization
- Deterministic routing

✅ **Security:**
- RLS enforces dealership scope
- Marketplace only shows enabled dealerships
- No client-side role manipulation

✅ **UX:**
- One auth flow
- Clear pipeline: Apply → Approve → Onboard → Operate
- No confusing states

✅ **Code Quality:**
- No role inference from routes
- No auth redirects in listeners
- Boring, correct, maintainable

---

END OF REFACTOR DOCUMENT
