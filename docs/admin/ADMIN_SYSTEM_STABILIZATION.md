# Admin System Stabilization - Implementation Summary

## Completed Tasks

### ✅ 1. Persist Dealer Applications

**Database Schema:** `src/lib/db/schema-admin.sql`
- Created `dealer_applications` table with full application data
- Enabled RLS with admin-only SELECT/UPDATE/DELETE policies
- Public can INSERT (submit applications)
- Unique constraint on email for pending applications
- Indexes for status, email, and created_at

**API Service:** `src/lib/api/dealer-applications.ts`
- Replaced in-memory storage with Supabase queries
- `createApplication()` - Checks for duplicate pending applications
- `getAllApplications()` - Admin-only via RLS
- `getApplicationsByStatus()` - Filter by status
- `hasExistingApplication()` - Duplicate prevention

**Application Form:** `src/app/auth/dealer/apply/page.tsx`
- Updated to use async service methods
- Error handling for duplicate submissions
- Persists to database on submit

### ✅ 2. Wire Admin Dashboard to Real Data

**Dashboard:** `src/app/admin/dashboard/page.tsx`
- "Pending Applications" card shows real count from database
- Clickable card routes to `/admin/applications`
- Uses `getPendingApplicationsCount()` API function

**Applications Page:** `src/app/admin/applications/page.tsx` (NEW)
- Lists all dealer applications with status badges
- Summary cards (pending, approved, rejected counts)
- Sortable table with dealer info
- Click any row to view full application details
- Modal dialog shows complete application data

### ✅ 3. Enforce Admin Access Correctly

**Middleware:** `middleware.ts`
- Admin route check happens BEFORE general auth
- Checks `session.user.user_metadata?.is_admin === true`
- Silent redirect to `/` for unauthorized access
- No client-side privilege checks

**RLS Policies:** Database-level enforcement
- Only admins can SELECT from `dealer_applications`
- Only admins can UPDATE/DELETE applications
- Public can INSERT (submit applications)
- JWT claim verification: `(auth.jwt() ->> 'user_metadata')::jsonb ->> 'is_admin' = 'true'`

**Layout:** `src/app/admin/layout.tsx`
- Only checks loading state (not admin status)
- Middleware is single source of truth
- No client-side access control logic

### ✅ 4. Add ONE Admin Action: Approve Dealer

**API Route:** `src/app/api/admin/approve-dealer/route.ts` (NEW)
- Server-side only with service role access
- Verifies admin session before processing
- Creates or updates dealer account
- Sets user_metadata: `role: 'dealer'`, `dealer_status: 'approved'`
- Updates application status to 'approved'

**Client Function:** `src/lib/api/admin-dealer-applications.ts`
- `approveDealerApplication()` calls server API route
- No direct service role access from client
- Returns success/error response

**UI:** `src/app/admin/applications/page.tsx`
- "Approve Dealer" button on pending applications
- Shows loading state during approval
- Refreshes application list after approval
- Approved dealer can now log in and access dealer dashboard

### ✅ 5. Safety Rules Compliance

✅ No new auth pages  
✅ No role switching UI  
✅ No client-side privilege changes  
✅ No charts or analytics  
✅ No admin user editing  

---

## Database Migration Required

Run this to enable the system:

```bash
psql $DATABASE_URL -f src/lib/db/schema-admin.sql
```

Or use Supabase Dashboard SQL editor to run the contents of `src/lib/db/schema-admin.sql`.

---

## Environment Variables Required

Add to your project settings (NOT in .env files):

```
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

This is required for the dealer approval API route to create user accounts.

**How to get it:**
1. Go to Supabase Dashboard
2. Project Settings → API
3. Copy "service_role" key (NOT the anon key)
4. Add to Tempo project settings

---

## Creating Admin Users

### Via Supabase Dashboard (Recommended)

1. Go to Supabase Dashboard → Authentication → Users
2. Find user to promote
3. Edit user → User Metadata
4. Add: `{ "is_admin": true }`
5. Save

### Via SQL

```sql
UPDATE auth.users
SET raw_user_meta_data = raw_user_meta_data || '{"is_admin": true}'::jsonb
WHERE email = 'admin@example.com';
```

---

## Usage Flow

### Dealer Application Flow

1. Dealer visits `/auth/dealer/apply`
2. Fills out 3-step application form
3. Application saved to `dealer_applications` table with status `'pending'`
4. Duplicate check prevents multiple pending applications per email
5. Success screen shown, application awaits review

### Admin Approval Flow

1. Admin logs in via `/auth/buyer` or `/auth/dealer`
2. Redirected to `/admin/dashboard`
3. "Pending Applications" card shows real count
4. Click card → `/admin/applications`
5. Review application details in modal
6. Click "Approve Dealer"
7. Server API creates dealer account
8. Application status updated to `'approved'`
9. Dealer can now log in and access dealer dashboard

### Dealer Login After Approval

1. Dealer visits `/auth/dealer`
2. Enters email (no password set yet)
3. Receives magic link or sets password
4. Logs in → redirected to `/dealer` dashboard
5. Full dealer access granted

---

## Files Created/Modified

### New Files
- `src/lib/api/admin-dealer-applications.ts` - Admin API functions
- `src/app/admin/applications/page.tsx` - Applications management page
- `src/app/api/admin/approve-dealer/route.ts` - Server approval API
- `docs/admin/ADMIN_SYSTEM_STABILIZATION.md` - This file

### Modified Files
- `src/lib/api/dealer-applications.ts` - Replaced in-memory with Supabase
- `src/app/auth/dealer/apply/page.tsx` - Async service calls
- `src/app/admin/dashboard/page.tsx` - Real pending count

### Existing (No Changes)
- `middleware.ts` - Already correct (admin enforcement)
- `src/app/admin/layout.tsx` - Already correct (no privilege checks)
- `src/lib/db/schema-admin.sql` - Database schema with RLS

---

## Testing Checklist

- [ ] Run database migration
- [ ] Add SUPABASE_SERVICE_ROLE_KEY to project settings
- [ ] Create test admin user
- [ ] Submit dealer application via form
- [ ] Verify application persists after page refresh
- [ ] Log in as admin
- [ ] Verify pending count shows on dashboard
- [ ] Click pending applications card
- [ ] View application details
- [ ] Approve application
- [ ] Verify dealer can log in
- [ ] Verify dealer has access to dealer dashboard
- [ ] Try accessing /admin as non-admin (should redirect)

---

## Security Verification

### Middleware Test
```bash
# As non-admin user, try to access admin route
curl -b cookies.txt https://your-app.com/admin/dashboard
# Expected: Redirect to /
```

### RLS Test
```sql
-- As non-admin user
SELECT * FROM dealer_applications;
-- Expected: 0 rows (RLS blocks)

-- As admin user
SELECT * FROM dealer_applications;
-- Expected: All applications returned
```

### Client-Side Test
Open browser console and try:
```javascript
// This should NOT grant admin access
await supabase.auth.updateUser({ data: { is_admin: true } })
// Middleware will still block /admin routes
```

---

## Known Limitations

1. **No rejection flow yet** - Only approval implemented
2. **No application editing** - Read-only review
3. **No bulk actions** - One approval at a time
4. **No email notifications** - Dealers not notified of approval
5. **No password reset link** - Dealers need to request magic link

---

## Future Enhancements (Not in Scope)

- Reject dealer applications with reason
- Edit application before approval
- Bulk approve/reject
- Email notifications on approval/rejection
- Application notes/comments
- Application history/audit log
- Search and filter applications
- Export applications to CSV

---

## Status

**Implementation:** ✅ Complete  
**Database Migration:** ⚠️ Required  
**Environment Variables:** ⚠️ Required (SUPABASE_SERVICE_ROLE_KEY)  
**Admin User Creation:** ⚠️ Required  
**Production Ready:** ⚠️ After migration + env vars + admin user  

---

## Support

For issues:
1. Verify database migration ran successfully
2. Check SUPABASE_SERVICE_ROLE_KEY is set in project settings
3. Verify admin user has `is_admin: true` flag
4. Check browser console for errors
5. Review API route logs in Vercel/deployment platform
6. Test RLS policies with SQL queries
