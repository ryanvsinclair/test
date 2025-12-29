-- =============================================================================
-- DEALERSHIP SINGLE-SOURCE-OF-TRUTH ARCHITECTURE
-- Master Migration File
-- =============================================================================
-- This migration consolidates dealer_applications and dealers tables into
-- a single dealerships table with proper lifecycle management.
-- 
-- Run on a FRESH Supabase project or after backing up existing data.
-- =============================================================================

-- =============================================================================
-- STEP 1: DROP OLD ENUM TYPES
-- =============================================================================

DROP TYPE IF EXISTS dealer_status CASCADE;
DROP TYPE IF EXISTS application_status CASCADE;

-- =============================================================================
-- STEP 2: CREATE NEW ENUM TYPES
-- =============================================================================

-- Lifecycle: Application → Approval → Onboarding → Active
CREATE TYPE dealership_lifecycle_status AS ENUM (
  'pending',    -- Application submitted, awaiting admin review
  'approved',   -- Admin approved, awaiting dealer onboarding
  'active',     -- Fully onboarded and operational
  'rejected'    -- Application rejected by admin
);

-- Operational: Admin control for enabling/disabling
CREATE TYPE dealership_operational_status AS ENUM (
  'enabled',    -- Visible in marketplace, can operate
  'disabled'    -- Hidden from marketplace (suspended or not yet activated)
);

-- User roles (keep existing)
CREATE TYPE IF NOT EXISTS user_role AS ENUM (
  'buyer',
  'dealer',
  'admin'
);

-- =============================================================================
-- STEP 3: CREATE DEALERSHIPS TABLE (REPLACES dealer_applications + dealers)
-- =============================================================================

CREATE TABLE IF NOT EXISTS dealerships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- ========== LIFECYCLE MANAGEMENT ==========
  lifecycle_status dealership_lifecycle_status NOT NULL DEFAULT 'pending',
  operational_status dealership_operational_status NOT NULL DEFAULT 'disabled',
  
  -- ========== BUSINESS IDENTITY ==========
  legal_name TEXT NOT NULL,
  trade_name TEXT,
  license_number TEXT,
  
  -- ========== CONTACT INFORMATION ==========
  contact_email TEXT NOT NULL,
  contact_name TEXT NOT NULL,
  contact_phone TEXT,
  
  -- ========== LOCATION ==========
  address JSONB, -- { street, city, region, postal_code, country }
  city TEXT,
  region TEXT,
  country TEXT DEFAULT 'CA',
  timezone TEXT DEFAULT 'America/Toronto',
  
  -- ========== BUSINESS DETAILS ==========
  dealership_type TEXT, -- e.g., 'franchise', 'independent', 'specialty'
  description TEXT,
  special_notes TEXT,
  additional_info TEXT,
  
  -- ========== OPERATING HOURS ==========
  business_hours JSONB, -- { days_of_operation: ['Mon','Tue'...], opening_time, closing_time }
  
  -- ========== ONLINE PRESENCE ==========
  website_url TEXT,
  social_links JSONB, -- { instagram, facebook, tiktok, google_business, other }
  
  -- ========== FINANCIAL ==========
  payout_details JSONB, -- Bank info, payment preferences (encrypted separately)
  
  -- ========== BRANDING ==========
  branding JSONB, -- Logo URL, colors, etc.
  
  -- ========== ADMIN REVIEW ==========
  reviewed_by UUID, -- Admin user who reviewed application
  reviewed_at TIMESTAMPTZ,
  rejection_reason TEXT,
  
  -- ========== TIMESTAMPS ==========
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  approved_at TIMESTAMPTZ, -- When admin approved
  activated_at TIMESTAMPTZ, -- When dealer completed onboarding
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_dealerships_lifecycle ON dealerships(lifecycle_status);
CREATE INDEX idx_dealerships_operational ON dealerships(operational_status);
CREATE INDEX idx_dealerships_contact_email ON dealerships(contact_email);
CREATE INDEX idx_dealerships_city_region ON dealerships(city, region);
CREATE INDEX idx_dealerships_created_at ON dealerships(created_at DESC);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_dealerships_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_dealerships_updated_at
  BEFORE UPDATE ON dealerships
  FOR EACH ROW
  EXECUTE FUNCTION update_dealerships_updated_at();

-- =============================================================================
-- STEP 4: UPDATE PROFILES TABLE
-- =============================================================================

-- Drop old dealer_status column if exists
ALTER TABLE profiles DROP COLUMN IF EXISTS dealer_status CASCADE;

-- Add dealership_id foreign key
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS dealership_id UUID REFERENCES dealerships(id) ON DELETE SET NULL;

-- Ensure role column exists with correct type
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE user_role AS ENUM ('buyer', 'dealer', 'admin');
  END IF;
END $$;

-- Update role column if needed
ALTER TABLE profiles ALTER COLUMN role TYPE user_role USING role::user_role;
ALTER TABLE profiles ALTER COLUMN role SET DEFAULT 'buyer';
ALTER TABLE profiles ALTER COLUMN role SET NOT NULL;

-- Create index on dealership_id
CREATE INDEX IF NOT EXISTS idx_profiles_dealership_id ON profiles(dealership_id);

-- =============================================================================
-- STEP 5: MIGRATE DATA FROM OLD TABLES (IF THEY EXIST)
-- =============================================================================

-- Migrate dealer_applications → dealerships
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'dealer_applications') THEN
    INSERT INTO dealerships (
      lifecycle_status,
      operational_status,
      legal_name,
      contact_email,
      contact_name,
      contact_phone,
      dealership_type,
      city,
      region,
      country,
      timezone,
      description,
      additional_info,
      special_notes,
      website_url,
      social_links,
      business_hours,
      reviewed_by,
      reviewed_at,
      rejection_reason,
      created_at
    )
    SELECT 
      CASE 
        WHEN status = 'approved' THEN 'approved'::dealership_lifecycle_status
        WHEN status = 'rejected' THEN 'rejected'::dealership_lifecycle_status
        ELSE 'pending'::dealership_lifecycle_status
      END,
      'disabled'::dealership_operational_status, -- Default to disabled until activated
      dealership_name,
      email,
      contact_name,
      phone,
      dealership_type,
      city,
      region,
      country,
      timezone,
      description,
      additional_info,
      special_notes,
      website_url,
      jsonb_build_object(
        'instagram', instagram_url,
        'facebook', facebook_url,
        'tiktok', tiktok_url,
        'google_business', google_business_url,
        'other', other_platforms
      ),
      jsonb_build_object(
        'days_of_operation', days_of_operation,
        'opening_time', opening_time,
        'closing_time', closing_time
      ),
      reviewed_by,
      reviewed_at,
      rejection_reason,
      created_at
    FROM dealer_applications;
  END IF;
END $$;

-- Link approved dealers to their dealerships
-- Assumes dealers table had profile_id and dealer_applications had email
DO $$
DECLARE
  dealer_record RECORD;
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'dealers') THEN
    FOR dealer_record IN 
      SELECT d.profile_id, da.email 
      FROM dealers d
      JOIN profiles p ON p.id = d.profile_id
      JOIN dealer_applications da ON da.email = p.email
      WHERE da.status = 'approved'
    LOOP
      UPDATE profiles
      SET 
        role = 'dealer'::user_role,
        dealership_id = (SELECT id FROM dealerships WHERE contact_email = (SELECT email FROM profiles WHERE id = dealer_record.profile_id) LIMIT 1)
      WHERE id = dealer_record.profile_id;
    END LOOP;
  END IF;
END $$;

-- =============================================================================
-- STEP 6: UPDATE LISTINGS TABLE (dealer_id → dealership_id)
-- =============================================================================

-- Add new dealership_id column if not exists
ALTER TABLE listings ADD COLUMN IF NOT EXISTS dealership_id UUID REFERENCES dealerships(id) ON DELETE CASCADE;

-- Migrate dealer_id to dealership_id (if dealers table existed)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'listings' AND column_name = 'dealer_id') THEN
    -- Map old dealer.id to new dealerships.id via profile_id
    UPDATE listings l
    SET dealership_id = p.dealership_id
    FROM dealers d
    JOIN profiles p ON p.id = d.profile_id
    WHERE l.dealer_id = d.id AND p.dealership_id IS NOT NULL;
  END IF;
END $$;

-- Drop old dealer_id column
ALTER TABLE listings DROP COLUMN IF EXISTS dealer_id;

-- Make dealership_id NOT NULL after migration
ALTER TABLE listings ALTER COLUMN dealership_id SET NOT NULL;

-- Create index
CREATE INDEX IF NOT EXISTS idx_listings_dealership_id ON listings(dealership_id);

-- =============================================================================
-- STEP 7: UPDATE TEAM TABLES
-- =============================================================================

-- team_invitations: dealership_id already points to dealers table
-- Update foreign key to point to new dealerships table
ALTER TABLE team_invitations DROP CONSTRAINT IF EXISTS fk_dealership;
ALTER TABLE team_invitations ADD CONSTRAINT fk_dealership 
  FOREIGN KEY (dealership_id) REFERENCES dealerships(id) ON DELETE CASCADE;

-- team_members: same update
ALTER TABLE team_members DROP CONSTRAINT IF EXISTS fk_dealership;
ALTER TABLE team_members ADD CONSTRAINT fk_dealership 
  FOREIGN KEY (dealership_id) REFERENCES dealerships(id) ON DELETE CASCADE;

-- =============================================================================
-- STEP 8: DROP OLD TABLES
-- =============================================================================

DROP TABLE IF EXISTS dealer_applications CASCADE;
DROP TABLE IF EXISTS dealers CASCADE;

-- =============================================================================
-- STEP 9: RLS POLICIES FOR DEALERSHIPS
-- =============================================================================

ALTER TABLE dealerships ENABLE ROW LEVEL SECURITY;

-- Admins can view all
CREATE POLICY "Admins can view all dealerships"
  ON dealerships FOR SELECT
  USING (((auth.jwt() ->> 'user_metadata')::jsonb ->> 'is_admin') = 'true');

-- Dealers can view their own dealership
CREATE POLICY "Dealers can view own dealership"
  ON dealerships FOR SELECT
  USING (
    id IN (
      SELECT dealership_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Anyone authenticated can submit application (creates pending dealership)
CREATE POLICY "Authenticated users can submit application"
  ON dealerships FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL 
    AND lifecycle_status = 'pending'
    AND operational_status = 'disabled'
  );

-- Admins can update any dealership (approval, rejection)
CREATE POLICY "Admins can update dealerships"
  ON dealerships FOR UPDATE
  USING (((auth.jwt() ->> 'user_metadata')::jsonb ->> 'is_admin') = 'true');

-- Dealers can update their own dealership (onboarding only)
CREATE POLICY "Dealers can update own dealership for onboarding"
  ON dealerships FOR UPDATE
  USING (
    id IN (
      SELECT dealership_id FROM profiles WHERE id = auth.uid()
    )
    AND lifecycle_status IN ('approved', 'active')
  );

-- Admins can delete
CREATE POLICY "Admins can delete dealerships"
  ON dealerships FOR DELETE
  USING (((auth.jwt() ->> 'user_metadata')::jsonb ->> 'is_admin') = 'true');

-- =============================================================================
-- STEP 10: UPDATE PROFILES RLS POLICIES
-- =============================================================================

-- Drop old policies
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update profiles" ON profiles;

-- Recreate policies
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  USING (((auth.jwt() ->> 'user_metadata')::jsonb ->> 'is_admin') = 'true');

CREATE POLICY "Admins can update profiles"
  ON profiles FOR UPDATE
  USING (((auth.jwt() ->> 'user_metadata')::jsonb ->> 'is_admin') = 'true');

-- Users can update own profile (limited fields)
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (
    id = auth.uid() 
    AND role = (SELECT role FROM profiles WHERE id = auth.uid()) -- Cannot change own role
  );

-- =============================================================================
-- STEP 11: UPDATE LISTINGS RLS POLICIES
-- =============================================================================

-- Drop old dealer-based policies
DROP POLICY IF EXISTS "Dealers can view own listings" ON listings;
DROP POLICY IF EXISTS "Dealers can insert own listings" ON listings;
DROP POLICY IF EXISTS "Dealers can update own listings" ON listings;
DROP POLICY IF EXISTS "Dealers can delete own listings" ON listings;
DROP POLICY IF EXISTS "Dealers can manage own listings" ON listings;

-- Recreate with dealership_id scope
CREATE POLICY "Dealers can view own dealership listings"
  ON listings FOR SELECT
  USING (
    dealership_id IN (
      SELECT dealership_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Dealers can insert for own dealership"
  ON listings FOR INSERT
  WITH CHECK (
    dealership_id IN (
      SELECT dealership_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Dealers can update own dealership listings"
  ON listings FOR UPDATE
  USING (
    dealership_id IN (
      SELECT dealership_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Dealers can delete own dealership listings"
  ON listings FOR DELETE
  USING (
    dealership_id IN (
      SELECT dealership_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Public can view active listings from enabled dealerships
CREATE POLICY "Public can view active enabled listings"
  ON listings FOR SELECT
  USING (
    status = 'active'
    AND dealership_id IN (
      SELECT id FROM dealerships 
      WHERE operational_status = 'enabled' 
      AND lifecycle_status = 'active'
    )
  );

-- Admins can view all
CREATE POLICY "Admins can view all listings"
  ON listings FOR SELECT
  USING (((auth.jwt() ->> 'user_metadata')::jsonb ->> 'is_admin') = 'true');

-- =============================================================================
-- STEP 12: CREATE HELPER FUNCTION FOR PROFILE CREATION
-- =============================================================================

-- Trigger to auto-create profile when user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_city TEXT;
  v_region TEXT;
BEGIN
  -- Extract city and region from user metadata
  -- Format expected: "City, Region" or just "City"
  v_city := COALESCE(NEW.raw_user_meta_data->>'city', '');
  
  -- Parse region from city field if it contains comma
  IF position(',' in v_city) > 0 THEN
    v_region := trim(substring(v_city from position(',' in v_city) + 1));
    v_city := trim(substring(v_city from 1 for position(',' in v_city) - 1));
  ELSE
    v_region := '';
  END IF;

  INSERT INTO public.profiles (id, email, name, city, region, role, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    v_city,
    v_region,
    'buyer', -- Default role
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attach trigger to auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================================================
-- STEP 13: VERIFICATION QUERIES
-- =============================================================================

-- Run these to verify migration success:

-- Check dealerships table structure
-- SELECT * FROM dealerships LIMIT 5;

-- Check profiles have dealership_id
-- SELECT id, email, role, dealership_id FROM profiles WHERE role = 'dealer';

-- Check listings point to dealerships
-- SELECT id, dealership_id FROM listings LIMIT 5;

-- Check RLS policies
-- SELECT schemaname, tablename, policyname FROM pg_policies WHERE tablename IN ('dealerships', 'profiles', 'listings');

-- =============================================================================
-- END OF MIGRATION
-- =============================================================================

-- ROLLBACK INSTRUCTIONS:
-- If you need to rollback, restore from backup taken before running this migration.
-- There is no automated rollback due to data consolidation.
