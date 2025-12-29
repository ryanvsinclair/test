# SUPABASE DEPLOYMENT STEPS

**IMPORTANT:** Supabase SQL Editor does NOT support `\i` file inclusion commands.
You must copy/paste the actual SQL content from each file.

---

## Step 1: Run schema-enums.sql

1. Open `src/lib/db/schema-enums.sql`
2. Copy ALL the SQL content
3. Paste into Supabase SQL Editor
4. Click **Run**

**Expected result:** 9 ENUMs created (user_role, dealer_status, vehicle_state, etc.)

---

## Step 2: Run schema-base.sql

1. Open `src/lib/db/schema-base.sql`
2. Copy ALL the SQL content
3. Paste into Supabase SQL Editor
4. Click **Run**

**Expected result:** 6 core tables created (profiles, dealers, listings, conversations, messages, appointments)

---

## Step 3: Run schema-admin.sql

1. Open `src/lib/db/schema-admin.sql`
2. Copy ALL the SQL content
3. Paste into Supabase SQL Editor
4. Click **Run**

**Expected result:** dealer_applications table created

---

## Step 4: Run schema-team-invites.sql

1. Open `src/lib/db/schema-team-invites.sql`
2. Copy ALL the SQL content
3. Paste into Supabase SQL Editor
4. Click **Run**

**Expected result:** team_invitations and team_members tables created

---

## Step 5: Run schema-rls.sql

1. Open `src/lib/db/schema-rls.sql`
2. Copy ALL the SQL content
3. Paste into Supabase SQL Editor
4. Click **Run**

**Expected result:** 100+ RLS policies created on all tables

---

## Step 6: Run schema-new-inventory.sql

1. Open `src/lib/db/schema-new-inventory.sql`
2. Copy ALL the SQL content
3. Paste into Supabase SQL Editor
4. Click **Run**

**Expected result:** New inventory columns and constraints added

---

## Step 7: Run schema-as-is-vehicles.sql

1. Open `src/lib/db/schema-as-is-vehicles.sql`
2. Copy ALL the SQL content
3. Paste into Supabase SQL Editor
4. Click **Run**

**Expected result:** AS-IS vehicle tables and columns added

---

## Step 8: Run schema-market-lanes.sql

1. Open `src/lib/db/schema-market-lanes.sql`
2. Copy ALL the SQL content
3. Paste into Supabase SQL Editor
4. Click **Run**

**Expected result:** Market lane tables and indexes added

---

## Step 9: Run schema-marketplace-modes.sql

1. Open `src/lib/db/schema-marketplace-modes.sql`
2. Copy ALL the SQL content
3. Paste into Supabase SQL Editor
4. Click **Run**

**Expected result:** Marketplace mode columns and tables added

---

## Step 10: Run schema-road-readiness.sql

1. Open `src/lib/db/schema-road-readiness.sql`
2. Copy ALL the SQL content
3. Paste into Supabase SQL Editor
4. Click **Run**

**Expected result:** Road readiness columns added

---

## Step 11: Run schema-publish-flow.sql

1. Open `src/lib/db/schema-publish-flow.sql`
2. Copy ALL the SQL content
3. Paste into Supabase SQL Editor
4. Click **Run**

**Expected result:** Publish flow audit tables added

---

## Step 12: Run schema-logic.sql

1. Open `src/lib/db/schema-logic.sql`
2. Copy ALL the SQL content
3. Paste into Supabase SQL Editor
4. Click **Run**

**Expected result:** All triggers, functions, and views created

---

## Step 13: Run schema-performance.sql

1. Open `src/lib/db/schema-performance.sql`
2. Copy ALL the SQL content
3. Paste into Supabase SQL Editor
4. Click **Run**

**Expected result:** All performance indexes and constraints added

---

## Verification After All Steps

Run this query to verify:

```sql
-- Check tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Check RLS enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';

-- Check indexes
SELECT indexname, tablename 
FROM pg_indexes 
WHERE schemaname = 'public' 
ORDER BY tablename, indexname;
```

**Expected:**
- 27+ tables
- All tables have `rowsecurity = true`
- 50+ indexes

---

## Troubleshooting

### Error: "type X does not exist"
**Fix:** Run schema-enums.sql first

### Error: "column X does not exist"
**Fix:** Run schema files in exact order listed above

### Error: "relation X does not exist"
**Fix:** Check that previous schema file completed successfully

### Error: "policy already exists"
**Fix:** Safe to ignore - policy was already created

---

**Total Time:** 10-15 minutes for all steps
