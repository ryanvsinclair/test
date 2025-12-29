-- =============================================================================
-- FIX DEALER APPLICATIONS RLS
-- =============================================================================
-- This migration ensures anonymous users can submit dealer applications
-- =============================================================================

-- Drop existing policies on dealer_applications
DROP POLICY IF EXISTS "Anyone can submit applications" ON dealer_applications;
DROP POLICY IF EXISTS "Admins can view all applications" ON dealer_applications;
DROP POLICY IF EXISTS "Admins can update applications" ON dealer_applications;
DROP POLICY IF EXISTS "Admins can delete applications" ON dealer_applications;

-- Disable RLS temporarily to ensure clean state
ALTER TABLE dealer_applications DISABLE ROW LEVEL SECURITY;

-- Re-enable RLS
ALTER TABLE dealer_applications ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "allow_anon_insert" ON dealer_applications;
DROP POLICY IF EXISTS "service_role_all_access" ON dealer_applications;

-- Grant necessary permissions
GRANT INSERT ON dealer_applications TO anon;
GRANT INSERT ON dealer_applications TO authenticated;
GRANT SELECT, UPDATE, DELETE ON dealer_applications TO service_role;

-- ✅ PUBLIC: Anyone can submit applications (anon-safe)
CREATE POLICY "allow_anon_insert"
  ON dealer_applications 
  FOR INSERT 
  TO anon, authenticated
  WITH CHECK (true);

-- ✅ SERVICE ROLE: Full access for admin operations
CREATE POLICY "service_role_all_access"
  ON dealer_applications 
  FOR ALL 
  TO service_role
  USING (true)
  WITH CHECK (true);
