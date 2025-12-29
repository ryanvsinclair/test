# DATABASE DEPLOYMENT GUIDE

**For:** Fresh Supabase Project  
**Last Updated:** January 2025  
**Status:** ✅ Production Ready

---

## Quick Start

Run these commands in Supabase SQL Editor in exact order:

```sql
-- STEP 1: Foundation (ENUMs + Core Tables)
\i src/lib/db/schema-enums.sql
\i src/lib/db/schema-base.sql
\i src/lib/db/schema-admin.sql
\i src/lib/db/schema-team-invites.sql

-- STEP 2: Security (RLS Policies)
\i src/lib/db/schema-rls.sql

-- STEP 3: Extensions (Feature Tables)
\i src/lib/db/schema-new-inventory.sql
\i src/lib/db/schema-as-is-vehicles.sql
\i src/lib/db/schema-market-lanes.sql
\i src/lib/db/schema-marketplace-modes.sql
\i src/lib/db/schema-road-readiness.sql
\i src/lib/db/schema-publish-flow.sql

-- STEP 3: Business Logic (Triggers, Views, Functions)
\i src/lib/db/schema-logic.sql

-- STEP 6: Performance (Indexes, Constraints)
\i src/lib/db/schema-performance.sql

-- OPTIONAL: Additional Features
\i src/lib/db/schema-messaging.sql          # If not already in base
\i src/lib/db/schema-auth.sql               # If not already in base
\i src/lib/db/schema-privacy-settings.sql   # If not already in base
\i src/lib/db/schema-listing-identification.sql  # Partially disabled
```

**Expected Time:** 2-3 minutes  
**Expected Errors:** 0

---

## File Descriptions

### Core Foundation (4 files)
1. **schema-enums.sql** - Type definitions (marketplace_mode, road_readiness_state, etc.)
2. **schema-base.sql** - Core tables (profiles, dealers, listings, conversations, messages, appointments)
3. **schema-admin.sql** - Admin tables (dealer_applications)
4. **schema-team-invites.sql** - Team management (invitations, members)

### Security Layer (1 file)
5. **schema-rls.sql** - Row Level Security policies (100+ policies for 30+ tables)

### Feature Extensions (6 files)
6. **schema-new-inventory.sql** - New vehicle classification
7. **schema-as-is-vehicles.sql** - AS-IS/project vehicles + disclosures
8. **schema-market-lanes.sql** - Primary/secondary market separation
9. **schema-marketplace-modes.sql** - Road ready classification
10. **schema-road-readiness.sql** - Unified road readiness states
11. **schema-publish-flow.sql** - Publish workflow + audit log

### Business Logic (1 file)
12. **schema-logic.sql** - Triggers, views, functions (consolidated)

### Optional (4 files)
13. **schema-messaging.sql** - Additional messaging features
14. **schema-auth.sql** - 2FA, sessions, password metadata
15. **schema-privacy-settings.sql** - User privacy controls
16. **schema-listing-identification.sql** - Carly listing IDs (partially disabled)

---

## Verification Steps

### After Each Step

```sql
-- Check for errors
SELECT * FROM pg_stat_activity WHERE state = 'idle in transaction (aborted)';

-- Should return 0 rows
```

### After Step 1 (Foundation)

```sql
-- Verify tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Expected: profiles, dealers, listings, conversations, messages, appointments, 
--           dealer_applications, team_invitations, team_members

-- Verify ENUMs exist
SELECT typname 
FROM pg_type 
WHERE typtype = 'e' 
ORDER BY typname;

-- Expected: marketplace_mode, road_readiness_state, vehicle_state, dealer_status, 
--           user_role, application_status, appointment_status, message_status, 
--           disclosure_severity
```

### After Step 2 (Security)

```sql
-- Verify RLS enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND rowsecurity = true
ORDER BY tablename;

-- Expected: 30+ tables with rowsecurity = true

-- Verify policies exist
SELECT tablename, COUNT(*) as policy_count
FROM pg_policies 
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY policy_count DESC;

-- Expected: 100+ total policies
```

### After Step 3 (Business Logic)

```sql
-- Verify triggers exist
SELECT tgname, tgrelid::regclass 
FROM pg_trigger 
WHERE tgname NOT LIKE 'RI_%'
AND tgrelid::regclass::text LIKE 'listings%'
ORDER BY tgname;

-- Expected: 10+ triggers on listings table

-- Verify views exist
SELECT viewname 
FROM pg_views 
WHERE schemaname = 'public';

-- Expected: dealer_metrics

-- Verify functions exist
SELECT proname, prokind 
FROM pg_proc 
WHERE pronamespace = 'public'::regnamespace
AND proname LIKE '%validate%'
OR proname LIKE '%determine%'
ORDER BY proname;

-- Expected: 10+ functions
```

---

## Testing Access Patterns

### Test 1: User Isolation

```sql
-- As user A (set session)
SET request.jwt.claims = '{"sub": "user-a-uuid", "role": "authenticated"}';

-- Try to read user B's data
SELECT * FROM profiles WHERE id = 'user-b-uuid';
-- Expected: 0 rows (blocked by RLS)

-- Read own data
SELECT * FROM profiles WHERE id = 'user-a-uuid';
-- Expected: 1 row (allowed)
```

### Test 2: Public Listing Access

```sql
-- As anonymous user
RESET request.jwt.claims;

-- View active listings
SELECT * FROM listings WHERE status = 'active' LIMIT 5;
-- Expected: Success (public read allowed)

-- Try to create listing
INSERT INTO listings (dealer_id, title) VALUES ('dealer-uuid', 'Test');
-- Expected: Error (anon cannot insert)
```

### Test 3: Dealer Listing Ownership

```sql
-- As dealer A
SET request.jwt.claims = '{"sub": "dealer-a-uuid", "role": "authenticated"}';

-- View own listings (all statuses)
SELECT * FROM listings WHERE dealer_id = auth.uid();
-- Expected: All dealer A's listings

-- Try to view dealer B's draft listings
SELECT * FROM listings WHERE dealer_id = 'dealer-b-uuid' AND status = 'draft';
-- Expected: 0 rows (blocked by RLS)
```

### Test 4: Admin Access

```sql
-- As admin
SET request.jwt.claims = '{"sub": "admin-uuid", "role": "admin"}';

-- View all profiles
SELECT COUNT(*) FROM profiles;
-- Expected: All profiles visible

-- View all dealer applications
SELECT * FROM dealer_applications;
-- Expected: All applications visible
```

---

## Troubleshooting

### Issue: "relation does not exist"

**Cause:** Files run out of order  
**Fix:** Drop all tables and restart from Step 1

```sql
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;
```

### Issue: "duplicate key value violates unique constraint"

**Cause:** Running files multiple times without cleanup  
**Fix:** Use `IF NOT EXISTS` or clean database first

```sql
-- Check for duplicates
SELECT table_name, COUNT(*) 
FROM information_schema.tables 
WHERE table_schema = 'public' 
GROUP BY table_name 
HAVING COUNT(*) > 1;
```

### Issue: "policy already exists"

**Cause:** schema-rls.sql run multiple times  
**Fix:** Drop policies first

```sql
-- Drop all policies on a table
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'listings')
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON listings';
    END LOOP;
END $$;
```

### Issue: "function does not exist"

**Cause:** schema-logic.sql not run or failed  
**Fix:** Check function names match trigger definitions

```sql
-- Verify all functions exist
SELECT p.proname, n.nspname
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
ORDER BY p.proname;
```

---

## Performance Optimization

### After Initial Setup

```sql
-- Analyze all tables
ANALYZE profiles;
ANALYZE dealers;
ANALYZE listings;
ANALYZE conversations;
ANALYZE messages;
ANALYZE appointments;

-- Or analyze all at once
ANALYZE;
```

### Add Missing Indexes (if needed)

```sql
-- Conversation performance
CREATE INDEX CONCURRENTLY idx_conversations_buyer_last_message 
ON conversations(buyer_id, last_message_at DESC);

CREATE INDEX CONCURRENTLY idx_conversations_dealer_last_message 
ON conversations(dealer_id, last_message_at DESC);

-- Listing search performance
CREATE INDEX CONCURRENTLY idx_listings_search 
ON listings USING gin(to_tsvector('english', title || ' ' || COALESCE(description, '')));

-- Message threading performance  
CREATE INDEX CONCURRENTLY idx_messages_conversation_created 
ON messages(conversation_id, created_at DESC);
```

---

## Admin User Setup

### Via Supabase Dashboard

1. Go to Authentication → Users
2. Select admin user
3. Edit user metadata
4. Add: `{ "role": "admin" }`
5. Save

### Via SQL (Server-side only)

```sql
-- Update user metadata (requires service_role key)
UPDATE auth.users 
SET raw_user_meta_data = raw_user_meta_data || '{"role": "admin"}'::jsonb
WHERE email = 'admin@example.com';
```

---

## Backup Before Production

```bash
# Dump entire database
pg_dump -h your-host -U postgres -d your-database -F c -f backup.dump

# Restore if needed
pg_restore -h your-host -U postgres -d your-database backup.dump
```

---

## Migration Strategy for Existing Data

If you have existing data from the old schema:

### 1. Backup Current Data

```sql
-- Export to temp tables
CREATE TABLE old_vehicle_listings AS SELECT * FROM vehicle_listings;
CREATE TABLE old_users AS SELECT * FROM users;
```

### 2. Run New Schema

Follow the Quick Start guide above

### 3. Migrate Data

```sql
-- Migrate users → profiles
INSERT INTO profiles (id, email, name, role, created_at)
SELECT id, email, name, role, created_at 
FROM old_users
ON CONFLICT (id) DO NOTHING;

-- Migrate vehicle_listings → listings
INSERT INTO listings (
  id, dealer_id, vin, year, make, model, status, created_at
)
SELECT 
  id, 
  dealer_id, 
  vin, 
  year, 
  make, 
  model, 
  CASE status 
    WHEN 'published' THEN 'active'::vehicle_state
    ELSE 'draft'::vehicle_state
  END,
  created_at
FROM old_vehicle_listings
ON CONFLICT (id) DO NOTHING;
```

### 4. Verify Migration

```sql
-- Check counts match
SELECT 'old_users' as table, COUNT(*) FROM old_users
UNION ALL
SELECT 'profiles', COUNT(*) FROM profiles;

SELECT 'old_vehicle_listings' as table, COUNT(*) FROM old_vehicle_listings
UNION ALL
SELECT 'listings', COUNT(*) FROM listings;
```

### 5. Drop Old Tables

```sql
DROP TABLE old_users;
DROP TABLE old_vehicle_listings;
```

---

## Health Check Queries

```sql
-- Check table sizes
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Check index usage
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan,
  idx_tup_read,
  idx_tup_fetch
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
AND idx_scan = 0
ORDER BY tablename;

-- Check slow queries (enable pg_stat_statements first)
SELECT 
  query,
  calls,
  mean_exec_time,
  max_exec_time
FROM pg_stat_statements
WHERE query NOT LIKE '%pg_stat%'
ORDER BY mean_exec_time DESC
LIMIT 10;
```

---

## Support & Documentation

- **Step 1 Details:** `/docs/database/STEP1_FOUNDATION_COMPLETE.md`
- **Step 2 Details:** `/docs/database/STEP2_SECURITY_COMPLETE.md`
- **Step 3 Details:** `/docs/database/STEP3_COMPLETE.md`
- **RLS Policy Matrix:** `/docs/database/RLS_POLICY_MATRIX.md`
- **Original Audit:** `/docs/audits/DATABASE_AUDIT_REPORT.md`

---

**Database Ready for Production ✅**
