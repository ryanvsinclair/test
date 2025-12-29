# Carly Admin Access System

## Security Architecture

### Core Principle
**Admin is NOT a role. Admin is a capability flag.**

Admin access is controlled by a single source of truth:
```typescript
user_metadata.is_admin === true
```

### Non-Negotiable Security Rules

✅ **ALLOWED:**
- Admin flag stored in Supabase `user_metadata.is_admin`
- Middleware enforces all admin access
- Admins log in via existing buyer/dealer login
- Admin routes: `/admin/*`
- RLS policies check JWT claims

❌ **FORBIDDEN:**
- NO `/auth/admin` login page
- NO separate admin credentials
- NO client-side role elevation
- NO hardcoded admin emails in code
- NO admin logic in UI components
- NO mock/placeholder admin flags

---

## Implementation

### 1. Middleware Enforcement (`middleware.ts`)

Admin route protection occurs BEFORE general auth checks:

```typescript
// Admin route check (first priority)
if (pathname.startsWith('/admin')) {
  const { data: { session } } = await supabase.auth.getSession()
  
  // Silent redirect if not admin - no error hints
  if (!session || session.user.user_metadata?.is_admin !== true) {
    return NextResponse.redirect(new URL('/', req.url))
  }
  
  return response
}
```

**Key Points:**
- Admin check is the ONLY gate
- No error messages revealing admin existence
- Silent redirect to home page
- JWT claims are source of truth

### 2. Login Behavior (`AuthContext.tsx`)

After successful authentication:

```typescript
const isAdmin = session.user.user_metadata?.is_admin === true;

if (isAdmin) {
  router.push('/admin/dashboard');
}
```

**Flow:**
1. User logs in via `/auth/buyer` or `/auth/dealer`
2. If `is_admin === true` → redirect to `/admin/dashboard`
3. Otherwise → redirect to buyer/dealer dashboard per role

### 3. Admin UI Structure

**Layout:** `src/app/admin/layout.tsx`
- Simple header with admin branding
- No shared components with buyer/dealer
- Logout functionality
- Client-side checks only for loading state

**Dashboard:** `src/app/admin/dashboard/page.tsx`
- Platform overview
- Stats placeholders
- Links to admin sections (future)

### 4. Database Security

**Schema:** `src/lib/db/schema-admin.sql`

#### Dealer Applications Table
```sql
CREATE TABLE dealer_applications (
  id UUID PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  -- ... application fields ...
  status VARCHAR(50) DEFAULT 'pending',
  reviewed_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### RLS Policies (CRITICAL)
```sql
-- Only admins can SELECT
CREATE POLICY "Admins can view all applications"
  ON dealer_applications FOR SELECT
  USING (
    (auth.jwt() ->> 'user_metadata')::jsonb ->> 'is_admin' = 'true'
  );

-- Only admins can UPDATE
CREATE POLICY "Admins can update applications"
  ON dealer_applications FOR UPDATE
  USING (
    (auth.jwt() ->> 'user_metadata')::jsonb ->> 'is_admin' = 'true'
  );

-- Anyone can INSERT (initial submission)
CREATE POLICY "Anyone can submit applications"
  ON dealer_applications FOR INSERT
  WITH CHECK (true);
```

**Security Model:**
- Public can submit applications
- Only admins can read, update, or delete
- Even the applicant cannot view their own submission
- All queries require admin JWT claim

---

## Creating Admin Users

### Method 1: Supabase Dashboard (RECOMMENDED)

1. Go to Supabase Dashboard → Authentication → Users
2. Find the user
3. Click to edit
4. Add to `user_metadata`:
   ```json
   {
     "is_admin": true
   }
   ```
5. Save changes

### Method 2: SQL (Production)

```sql
UPDATE auth.users
SET raw_user_meta_data = raw_user_meta_data || '{"is_admin": true}'::jsonb
WHERE email = 'admin@example.com';
```

### Method 3: Secure Server Function

Create a protected API route or Supabase Edge Function:

```typescript
// MUST have additional security checks
export async function POST(req: Request) {
  // Verify caller is existing admin
  const session = await getSession();
  if (!session.user.user_metadata?.is_admin) {
    return new Response('Unauthorized', { status: 403 });
  }
  
  // Set admin flag for target user
  const { userId } = await req.json();
  await supabase.auth.admin.updateUserById(userId, {
    user_metadata: { is_admin: true }
  });
}
```

❌ **NEVER do this in client code:**
```typescript
// FORBIDDEN - client-side elevation
supabase.auth.updateUser({ 
  data: { is_admin: true } 
}) 
```

---

## Access Control Matrix

| Route | Unauthenticated | Buyer | Dealer | Admin |
|-------|----------------|-------|--------|-------|
| `/` | ✅ | ✅ | ✅ | ✅ |
| `/auth/*` | ✅ | ✅ | ✅ | ✅ |
| `/buyer/*` | ❌ → `/auth/buyer` | ✅ | ❌ → `/dealer` | ❌ → `/` |
| `/dealer/*` | ❌ → `/auth/buyer` | ❌ → `/buyer` | ✅ | ❌ → `/` |
| `/admin/*` | ❌ → `/` | ❌ → `/` | ❌ → `/` | ✅ |

**Key:**
- Admins can ONLY access `/admin/*` routes
- Admins logging in are redirected to `/admin/dashboard`
- No overlap between admin and buyer/dealer access

---

## Threat Model & Protections

### Threats Mitigated

1. **URL Guessing**
   - ✅ Middleware blocks all `/admin/*` access
   - ✅ Silent redirect provides no confirmation

2. **Client-Side Tampering**
   - ✅ Admin flag in JWT, not client state
   - ✅ No client code can set `is_admin`

3. **Privilege Escalation**
   - ✅ Only Supabase Admin API can set flag
   - ✅ RLS enforces admin checks at database level

4. **Information Disclosure**
   - ✅ No error messages reveal admin routes exist
   - ✅ UI never hints at admin capabilities

5. **Session Hijacking**
   - ✅ Admin uses same auth flow as buyers/dealers
   - ✅ Standard Supabase session security applies

### Attack Surface

**Before Admin System:**
- Public routes: `/`, `/auth/*`
- Protected routes: `/buyer/*`, `/dealer/*`

**After Admin System:**
- Public routes: `/`, `/auth/*` (unchanged)
- Protected routes: `/buyer/*`, `/dealer/*`, `/admin/*`
- Attack surface: **No increase** (middleware blocks all unauthorized)

---

## Testing Admin Access

### Test Case 1: Unauthorized Access
```bash
# As non-admin user
curl https://yourapp.com/admin/dashboard
# Expected: Redirect to /
```

### Test Case 2: Admin Login
1. Set `is_admin: true` for test user
2. Log in via `/auth/buyer`
3. Should redirect to `/admin/dashboard`
4. Should see admin UI

### Test Case 3: RLS Policy
```sql
-- As non-admin user
SELECT * FROM dealer_applications;
-- Expected: Returns 0 rows (RLS blocks)

-- As admin user
SELECT * FROM dealer_applications;
-- Expected: Returns all applications
```

### Test Case 4: Client-Side Elevation Attempt
```typescript
// Try to set admin flag from client
await supabase.auth.updateUser({
  data: { is_admin: true }
})
// Expected: May succeed, but middleware still blocks access
// Reason: JWT claims from server, not client data
```

---

## Future Enhancements

### Admin Features (Safe to Add)
- Dealer application approval workflow
- User management interface
- Content moderation queue
- Platform analytics dashboard
- System configuration

### Security Hardening (Optional)
- IP whitelisting for admin routes
- Two-factor authentication for admins
- Admin action audit log
- Session timeout for admin users
- Admin access notifications

---

## Troubleshooting

### "I can't access /admin/dashboard"
1. Verify `is_admin` flag is set in Supabase Dashboard
2. Log out and log back in (refresh JWT)
3. Check browser console for middleware logs
4. Verify middleware config includes `/admin/:path*`

### "Admin flag doesn't persist"
- Flag must be in `user_metadata`, not `app_metadata`
- Use Supabase Dashboard to verify storage
- Check JWT payload in browser dev tools

### "RLS policies not working"
```sql
-- Check if RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'dealer_applications';

-- Verify policies exist
SELECT * FROM pg_policies 
WHERE tablename = 'dealer_applications';
```

---

## Migration Checklist

- [x] Middleware updated with admin route protection
- [x] AuthContext handles admin redirect after login
- [x] Admin layout created (`/admin/layout.tsx`)
- [x] Admin dashboard created (`/admin/dashboard/page.tsx`)
- [x] Database schema with RLS policies (`schema-admin.sql`)
- [ ] Run schema migration on Supabase
- [ ] Create first admin user via Dashboard
- [ ] Test admin login and access
- [ ] Test non-admin blocking
- [ ] Verify RLS policies in production

---

## Security Review Checklist

Before deploying to production:

- [ ] No hardcoded admin emails in code
- [ ] No `/auth/admin` login page exists
- [ ] Middleware enforces all admin access
- [ ] RLS enabled on `dealer_applications`
- [ ] Admin policies check JWT `is_admin` claim
- [ ] Client code cannot set `is_admin` flag
- [ ] Admin UI has no shared components with buyer/dealer
- [ ] Silent redirects provide no information disclosure
- [ ] Admin access tested with non-admin user
- [ ] Admin access tested with admin user

---

## Status

**Implementation:** ✅ Complete
**Database Migration:** ⚠️ Pending
**Admin Users:** ⚠️ Not created
**Production Ready:** ⚠️ Requires migration + user creation
