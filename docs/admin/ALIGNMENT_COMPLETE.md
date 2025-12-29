# Admin System - Database Alignment Complete

## Summary

All `users` table references have been replaced with `profiles` table to align with Supabase auth architecture.

## Changes Made

### 1. Database Schema (`src/lib/db/schema-admin.sql`)

**dealer_metrics VIEW:**
- ❌ `FROM users u`
- ✅ `FROM profiles p`
- All joins now reference `profiles.id`

**get_dealer_detail_metrics() FUNCTION:**
- ❌ `FROM users u`
- ✅ `FROM profiles p`
- WHERE clause updated to `p.role = 'dealer'`

**RLS Policy:**
- ❌ `ON users FOR SELECT`
- ✅ `ON profiles FOR SELECT`

### 2. Dealer Dashboard Queries (`src/lib/db/dealer-dashboard.ts`)

**getNeedsAttention() function:**
- ❌ `JOIN users u ON c.buyer_id = u.id`
- ✅ `JOIN profiles p ON c.buyer_id = p.id`
- All column references updated (`p.name`, `p.verified`)

### 3. Dealer Approval Logic (`src/app/api/admin/approve-dealer/route.ts`)

**New behavior:**
- Creates/updates auth.users (with user_metadata)
- **ALSO** upserts into `profiles` table (source of truth)
- Sets `role = 'dealer'` and `dealer_status = 'approved'` in profiles

**Code added:**
```typescript
const { error: profileError } = await supabase
  .from('profiles')
  .upsert({
    id: dealerUserId,
    email: application.email,
    name: application.contact_name,
    role: 'dealer',
    dealer_status: 'approved',
  }, {
    onConflict: 'id'
  });
```

### 4. Application Submission (`src/lib/api/dealer-applications.ts`)

**Enhanced logging:**
- Logs insert data before submission
- Logs success data
- Enhanced error messages with details

## Architecture Alignment

### Source of Truth: `public.profiles`

**Required columns:**
- `id` (UUID, matches auth.users.id)
- `email` (VARCHAR)
- `name` (VARCHAR)
- `role` (VARCHAR: 'buyer' | 'dealer' | 'admin')
- `dealer_status` (VARCHAR: 'pending' | 'approved' | 'rejected')
- `created_at` (TIMESTAMPTZ)

### Data Flow

1. **Dealer applies** → `dealer_applications` table
2. **Admin approves** → 
   - Creates/updates `auth.users` (auth layer)
   - Upserts into `profiles` (application layer)
3. **Queries read from** → `profiles` table

### Security

- RLS policies reference `profiles`, not `users`
- Admin checks via `auth.jwt()` → `user_metadata.is_admin`
- Dealer queries filtered by `profiles.role = 'dealer'`

## Verification Checklist

- ✅ All SQL queries use `profiles` table
- ✅ No remaining `FROM users` references in active code
- ✅ Dealer approval updates both auth.users and profiles
- ✅ Admin metrics query profiles table
- ✅ Dealer dashboard queries profiles table
- ✅ Application submission logs added for debugging

## Files Modified

1. `src/lib/db/schema-admin.sql` - dealer_metrics view and function
2. `src/lib/db/dealer-dashboard.ts` - getNeedsAttention query
3. `src/app/api/admin/approve-dealer/route.ts` - profile upsert logic
4. `src/lib/api/dealer-applications.ts` - enhanced logging

## Next Steps

1. Run updated schema migration
2. Ensure `profiles` table exists with correct columns
3. Test dealer application submission
4. Test admin approval flow
5. Verify metrics queries execute without errors

## Notes

- Documentation files (`docs/`) still contain `users` references in example SQL - these are archived/documentation only and not executed code
- All active code paths now use `profiles` table
