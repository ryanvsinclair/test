# DATABASE FOLDER SUPABASE AUDIT REPORT
**Date:** January 2025  
**Audited By:** Senior Backend Engineer (PostgreSQL + Supabase Specialist)  
**Status:** 🔴 **CRITICAL ISSUES FOUND - NOT PRODUCTION READY**

---

## EXECUTIVE SUMMARY

The `/src/lib/db` folder contains **17 database-related files** spanning schema definitions, TypeScript clients, and helper functions. After comprehensive review, the database layer has **critical architectural issues** that prevent it from being Supabase-ready and production-safe.

### Severity Rating: 🔴 **CRITICAL**

- ❌ **NOT Supabase-ready**
- ❌ **NOT RLS-safe** 
- ❌ **NOT Production-safe**

---

## CRITICAL ISSUES DISCOVERED

### 1. **MISSING CORE TABLES** ⚠️ BLOCKER

Multiple schemas reference tables that **do not exist** anywhere in the database definitions:

#### Missing Tables:
- ❌ `profiles` - Referenced extensively but **never created**
- ❌ `vehicle_listings` - Referenced in 7+ schemas but **never created**
- ❌ `vehicles` - Referenced in publish flow but **never created**
- ❌ `dealers` - Referenced in team invites but **never created**

#### Impact:
```sql
-- schema-admin.sql LINE 164-170 (BROKEN)
FROM profiles p
LEFT JOIN listings l ON l.dealer_id = p.id
-- ❌ profiles table does not exist

-- schema-dealer-dashboard.sql LINE 54 (BROKEN)
dealer_id UUID NOT NULL REFERENCES users(id)
-- ❌ users table is deprecated, should be profiles

-- schema-team-invites.sql LINE 16 (BROKEN)
FOREIGN KEY (dealership_id) REFERENCES dealers(id)
-- ❌ dealers table does not exist

-- schema-listing-identification.sql LINE 5-6 (BROKEN)
ALTER TABLE vehicle_listings
  ADD COLUMN IF NOT EXISTS carly_listing_id...
-- ❌ vehicle_listings table does not exist
```

**All 8 ALTER TABLE schemas will fail immediately on execution.**

---

### 2. **TABLE NAMING CONFUSION** ⚠️ CRITICAL

The codebase uses **THREE different table names** for the same concept:

| Schema File | References |
|-------------|------------|
| `schema-dealer-dashboard.sql` | `users` table (deprecated) |
| `schema-admin.sql` | `profiles` table (doesn't exist) |
| `dealer-dashboard.ts` | `profiles` table (doesn't exist) |
| `schema.sql` | `auth.users` (Supabase native) |

#### Code Inconsistency:
```typescript
// dealer-dashboard.ts LINE 174
JOIN profiles p ON c.buyer_id = p.id
// ❌ profiles doesn't exist

// schema-dealer-dashboard.sql LINE 5
CREATE TABLE IF NOT EXISTS users (...)
// ❌ Conflicts with Supabase auth.users

// schema-admin.sql LINE 44
reviewed_by UUID REFERENCES auth.users(id)
// ✅ Correct - but inconsistent with other files
```

---

### 3. **NO RLS POLICIES ON CRITICAL TABLES** ⚠️ SECURITY RISK

Tables with **NO RLS protection**:

| Table | RLS Status | Security Risk |
|-------|-----------|---------------|
| `user_preferences` | ❌ No RLS | Anyone can read/modify any user's preferences |
| `user_interactions` | ❌ No RLS | Anyone can see all user likes/views/hides |
| `user_hidden_patterns` | ❌ No RLS | Anyone can see learning patterns |
| `user_email_verification` | ❌ No RLS | Anyone can see verification status |
| `user_2fa_settings` | ❌ No RLS | **CRITICAL: 2FA secrets exposed** |
| `user_password_metadata` | ❌ No RLS | **CRITICAL: Reset tokens exposed** |
| `user_active_sessions` | ❌ No RLS | **CRITICAL: Session tokens exposed** |
| `user_notification_preferences` | ❌ No RLS | Anyone can modify notification settings |
| `user_privacy_settings` | ❌ No RLS | Anyone can change privacy settings |
| `user_browse_preferences` | ❌ No RLS | Anyone can see/modify browse filters |
| `listings` (dealer-dashboard) | ❌ No RLS | Any dealer can see all listings |
| `listing_metrics_daily` | ❌ No RLS | Competitive intelligence leak |
| `conversations` (dealer-dashboard) | ❌ No RLS | Anyone can read all messages |
| `messages` (dealer-dashboard) | ❌ No RLS | **CRITICAL: All messages exposed** |
| `appointments` (dealer-dashboard) | ❌ No RLS | Anyone can see all appointments |
| `as_is_disclosures` | ❌ No RLS | Anyone can modify safety disclosures |
| `user_as_is_acknowledgments` | ❌ No RLS | Legal acknowledgments not protected |
| `vehicle_publish_logs` | ❌ No RLS | Publishing audit trail exposed |
| `vehicle_condition_update_requests` | ❌ No RLS | Anyone can approve condition changes |
| `market_lane_transitions` | ❌ No RLS | Classification history exposed |
| `market_lane_reclassification_requests` | ❌ No RLS | Anyone can approve reclassifications |
| `marketplace_mode_change_requests` | ❌ No RLS | Mode changes not protected |

**Total: 22+ tables with zero RLS protection** 🔴

---

### 4. **BROKEN FOREIGN KEY REFERENCES**

Multiple foreign keys point to **non-existent tables or columns**:

```sql
-- schema-admin.sql LINE 44
reviewed_by UUID REFERENCES auth.users(id)
-- ⚠️ Supabase auth.users doesn't have standard FK support

-- schema-team-invites.sql LINE 16-17
FOREIGN KEY (dealership_id) REFERENCES dealers(id)
FOREIGN KEY (invited_by) REFERENCES users(id)
-- ❌ dealers table doesn't exist
-- ❌ users conflicts with Supabase auth

-- schema-publish-flow.sql LINE 35-36
FOREIGN KEY (vehicle_id) REFERENCES vehicles(id)
FOREIGN KEY (user_id) REFERENCES auth.users(id)
-- ❌ vehicles table doesn't exist
-- ⚠️ auth.users FK not supported

-- schema-as-is-vehicles.sql LINE 14
listing_id INTEGER REFERENCES vehicle_listings(listing_id)
-- ❌ vehicle_listings doesn't exist
-- ⚠️ listing_id is INTEGER but vehicle_listings uses UUID
```

---

### 5. **CONFLICTING COLUMN DEFINITIONS**

Same columns defined with **different types** across schemas:

| Column | Schema 1 | Schema 2 | Issue |
|--------|----------|----------|-------|
| `listing_id` | `as-is-vehicles.sql: INTEGER` | `dealer-dashboard.sql: UUID` | Type mismatch |
| `dealer_id` | `admin.sql: profiles(id) UUID` | `dealer-dashboard.sql: users(id) UUID` | Table mismatch |
| `marketplace_mode` | `marketplace-modes.sql: TEXT NOT NULL` | `listing-identification.sql: extracted from carly_listing_id` | Logic conflict |
| `road_readiness_state` | `road-readiness.sql: TEXT NOT NULL` | `marketplace-modes.sql: assigned_road_readiness_state` | Name conflict |

---

### 6. **TRIGGER/FUNCTION CONFLICTS**

Multiple schemas define **overlapping triggers** on the same non-existent table:

```sql
-- schema-new-inventory.sql LINE 53
DROP TRIGGER IF EXISTS validate_state_transition ON listings

-- schema-as-is-vehicles.sql LINE 74
CREATE TRIGGER enforce_as_is_disclosure
  BEFORE INSERT OR UPDATE ON vehicle_listings

-- schema-market-lanes.sql LINE 84
DROP TRIGGER IF EXISTS trigger_enforce_market_lane ON vehicle_listings

-- schema-marketplace-modes.sql LINE 97-113
CREATE TRIGGER trigger_validate_carly_verified ON vehicle_listings
CREATE TRIGGER trigger_validate_the_hub ON vehicle_listings
CREATE TRIGGER trigger_validate_builders_market ON vehicle_listings

-- schema-listing-identification.sql LINE 51-94
CREATE TRIGGER trigger_validate_carly_listing_id ON vehicle_listings
CREATE TRIGGER trigger_prevent_listing_id_change ON vehicle_listings
CREATE TRIGGER trigger_enforce_marketplace_mode_explicit ON vehicle_listings
```

**Problem:** All triggers reference `vehicle_listings` which doesn't exist, and multiple triggers fire on the same events causing conflicts.

---

### 7. **ENUM ISSUES**

```sql
-- schema-new-inventory.sql LINE 5
ALTER TYPE vehicle_state ADD VALUE IF NOT EXISTS 'new_inventory';
-- ❌ vehicle_state enum doesn't exist

-- Multiple constraint checks without corresponding enums
CHECK (marketplace_mode IN ('carly_verified', 'the_hub', 'builders_market'))
-- ⚠️ Should use ENUM for type safety
```

---

### 8. **MESSAGING SCHEMA ISSUES**

`schema-messaging.sql` has **partial RLS** but critical gaps:

```sql
-- CRITICAL: No RLS policies defined AT ALL
-- Lines 63, 95: RLS not enabled
-- Lines 8-39: conversations table - NO RLS
-- Lines 44-65: messages table - NO RLS

-- Anyone can:
SELECT * FROM conversations;  -- Read all conversations
SELECT * FROM messages;        -- Read all messages
UPDATE conversations SET unread_count_buyer = 0;  -- Reset unread counts
DELETE FROM messages;          -- Delete messages
```

**Messaging has ZERO authentication/authorization checks at database level.**

---

### 9. **CLIENT.TS ISSUES**

`src/lib/db/client.ts` uses **node-postgres** instead of Supabase client:

```typescript
// LINE 8
import { Pool, QueryResult } from 'pg';

// ❌ Should use Supabase client for:
// - Automatic RLS enforcement
// - Connection pooling
// - Auth integration
// - Real-time subscriptions
```

**Impact:** All queries bypass RLS entirely.

---

### 10. **DEALER-DASHBOARD.SQL CONFLICTS**

This schema creates a **parallel auth system**:

```sql
-- LINE 5-15
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,  -- ❌ Conflicts with Supabase Auth
  ...
);
```

**This completely bypasses Supabase authentication.**

---

## SCHEMA-BY-SCHEMA BREAKDOWN

### ✅ ACCEPTABLE (3 files)

1. **schema-admin.sql** - Logic is sound, but references missing `profiles` table
2. **schema-messaging.sql** - Structure is good, but **CRITICAL: NO RLS**
3. **schema-team-invites.sql** - Well-designed, but references missing `dealers` and `users` tables

### ⚠️ NEEDS MAJOR FIXES (11 files)

1. **schema.sql** - NO RLS on any table
2. **schema-auth.sql** - NO RLS, stores plaintext secrets
3. **schema-privacy-settings.sql** - NO RLS on privacy settings
4. **schema-dealer-dashboard.sql** - Creates conflicting `users` table, NO RLS
5. **schema-new-inventory.sql** - Alters non-existent table
6. **schema-as-is-vehicles.sql** - Alters non-existent table, NO RLS
7. **schema-listing-identification.sql** - Alters non-existent table
8. **schema-market-lanes.sql** - Alters non-existent table, NO RLS
9. **schema-marketplace-modes.sql** - Alters non-existent table
10. **schema-publish-flow.sql** - References non-existent tables, NO RLS
11. **schema-road-readiness.sql** - Alters non-existent table

### 🔴 CRITICAL ISSUES (3 files)

1. **client.ts** - Uses pg instead of Supabase client (bypasses RLS)
2. **dealer-dashboard.ts** - Queries non-existent `profiles` table
3. **messaging-db.ts** - No RLS enforcement, security bypass

---

## REQUIRED FIXES

### Phase 1: Foundation (CRITICAL)

1. **Create base tables** (MUST be first):
```sql
-- Create profiles table (extends Supabase auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR NOT NULL,
  name VARCHAR,
  role VARCHAR DEFAULT 'buyer',
  dealer_status VARCHAR,
  verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create dealers table
CREATE TABLE dealers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  dealership_name VARCHAR NOT NULL,
  email VARCHAR NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create vehicle_listings table (NOT vehicle_listings or listings)
CREATE TABLE vehicle_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dealer_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  vin VARCHAR(17),
  year INTEGER,
  make VARCHAR,
  model VARCHAR,
  status VARCHAR DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

2. **Remove schema-dealer-dashboard.sql** - Conflicts with Supabase auth

3. **Replace client.ts with Supabase client**:
```typescript
import { createClient } from '@supabase/supabase-js';

export const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
```

### Phase 2: Add RLS Policies (SECURITY CRITICAL)

**Every table needs:**
```sql
ALTER TABLE <table_name> ENABLE ROW LEVEL SECURITY;

-- User can only access own data
CREATE POLICY "Users access own data"
  ON <table_name>
  FOR ALL
  USING (user_id = auth.uid());

-- Admins can access all
CREATE POLICY "Admins access all"
  ON <table_name>
  FOR ALL
  USING ((auth.jwt() ->> 'user_metadata')::jsonb ->> 'is_admin' = 'true');
```

**Required for 22+ tables currently unprotected.**

### Phase 3: Fix Foreign Keys

1. Change all `REFERENCES auth.users(id)` to `REFERENCES profiles(id)`
2. Fix type mismatches (INTEGER vs UUID)
3. Remove circular dependencies

### Phase 4: Consolidate Triggers

1. Merge overlapping triggers into single comprehensive trigger
2. Order trigger execution properly
3. Remove duplicate validation logic

### Phase 5: Add Enums

```sql
CREATE TYPE marketplace_mode AS ENUM ('carly_verified', 'the_hub', 'builders_market');
CREATE TYPE vehicle_state AS ENUM ('active', 'sold', 'deleted', 'new_inventory');
```

---

## MIGRATION SAFETY

❌ **CURRENT STATE: NOT SAFE TO RUN**

If you run these schemas on a fresh Supabase project:
1. ✅ `schema-admin.sql` lines 1-112 will succeed
2. ❌ `schema-admin.sql` lines 134-170 (view) will FAIL - missing `profiles`
3. ❌ All ALTER TABLE schemas will FAIL immediately
4. ❌ All triggers will fail - missing base table
5. ⚠️ `schema-dealer-dashboard.sql` will create conflicting auth system

**Zero schemas can be run in sequence without errors.**

---

## SECURITY ASSESSMENT

### Critical Vulnerabilities:

1. **🔴 RLS Bypass** - All queries via `client.ts` bypass RLS
2. **🔴 Exposed Secrets** - 2FA secrets, session tokens, reset tokens readable by anyone
3. **🔴 Message Privacy** - All messages readable by all users
4. **🔴 Competitive Intelligence** - All dealer metrics exposed
5. **🔴 Legal Liability** - Disclosure acknowledgments can be deleted

### Exploits Possible:

```sql
-- Any authenticated user can:
SELECT * FROM user_2fa_settings;  -- Steal 2FA secrets
SELECT * FROM messages;            -- Read all messages
UPDATE dealer_applications SET status = 'approved';  -- ❌ Wait, this ONE has RLS
UPDATE profiles SET role = 'dealer';  -- ❌ Table doesn't exist anyway
```

---

## PERFORMANCE ISSUES

1. **Missing indexes** on foreign keys (conversations, messages)
2. **No partitioning** on time-series data (messages, metrics)
3. **Suboptimal trigger execution order**
4. **No materialized views** for expensive aggregations

---

## RECOMMENDATIONS

### Immediate Actions (Week 1):

1. ✅ Create `profiles` table extending `auth.users`
2. ✅ Create `dealers` table with proper FKs
3. ✅ Create `vehicle_listings` base table
4. ✅ Add RLS to ALL tables
5. ✅ Replace `client.ts` with Supabase client
6. ✅ Remove `schema-dealer-dashboard.sql`

### Short-term (Week 2-3):

1. Consolidate triggers into coherent execution order
2. Add proper indexes
3. Create ENUMs for type safety
4. Add comprehensive RLS policies
5. Test all foreign keys

### Long-term (Month 1):

1. Add audit logging
2. Implement soft deletes
3. Add materialized views for dashboards
4. Set up real-time subscriptions
5. Add database-level rate limiting

---

## TESTING CHECKLIST

Before marking as production-ready:

- [ ] All tables created successfully
- [ ] All foreign keys resolve
- [ ] All triggers fire without conflicts
- [ ] All views compile
- [ ] All functions execute
- [ ] RLS policies tested for:
  - [ ] Buyer accessing own data only
  - [ ] Buyer cannot access other buyer data
  - [ ] Dealer accessing own listings only
  - [ ] Dealer cannot access other dealer data
  - [ ] Admin can access all data
  - [ ] Anon cannot access protected data
- [ ] No SQL injection vulnerabilities
- [ ] Performance tested with 10k+ rows
- [ ] Connection pooling works
- [ ] Migrations run in correct order

---

## CONCLUSION

### Current Status: 🔴 NOT PRODUCTION READY

**Blockers:**
1. Missing core tables (profiles, vehicle_listings, dealers)
2. Zero RLS protection on 22+ tables
3. Direct pg client bypassing all Supabase features
4. Conflicting table definitions
5. Broken foreign keys and triggers

**Estimated Effort to Fix:** 40-60 hours

**Priority:** 🔴 **CRITICAL - Security and data integrity at risk**

**Recommendation:** 
- **DO NOT deploy to production** until all Critical issues resolved
- **DO NOT run any migration** until base tables are created
- **DO NOT use client.ts** - replace with Supabase client immediately
- **DO NOT allow user access** until RLS policies are in place

---

## FILES REQUIRING CHANGES

### 🔴 Must Delete:
- `src/lib/db/schema-dealer-dashboard.sql` (conflicts with Supabase auth)

### 🔴 Must Rewrite:
- `src/lib/db/client.ts` (replace pg with Supabase client)
- `src/lib/db/dealer-dashboard.ts` (fix table references)
- `src/lib/db/messaging-db.ts` (add RLS enforcement)

### ⚠️ Must Fix:
- All 11 ALTER TABLE schemas (create base table first)
- `schema.sql` (add RLS)
- `schema-auth.sql` (add RLS + encryption)
- `schema-messaging.sql` (add RLS)
- `schema-privacy-settings.sql` (add RLS)
- `schema-admin.sql` (fix table references)
- `schema-team-invites.sql` (fix table references)

### ✅ Need New Files:
- `schema-base-tables.sql` (create profiles, dealers, vehicle_listings)
- `schema-rls-policies.sql` (comprehensive RLS for all tables)
- `schema-enums.sql` (type safety)

---

**End of Audit Report**
