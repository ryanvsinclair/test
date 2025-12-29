-- =============================================================================
-- AS-IS / PROJECT VEHICLES SCHEMA - STEP 1 CANONICALIZED
-- =============================================================================
-- Extends listings table to support non-running, uninspected, and project vehicles
-- 
-- UPDATED FOR STEP 1:
--   - Table name: vehicle_listings → listings
--   - Fixed FK: listing_id INTEGER → UUID REFERENCES listings(id)
--   - Fixed FK: auth.users(id) → profiles(id)
--   - Triggers/functions moved to schema-logic.sql (Step 3)
-- =============================================================================

-- Note: condition column already exists in schema-base.sql
-- Add AS-IS specific columns
ALTER TABLE listings
  ADD COLUMN IF NOT EXISTS road_ready BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS inspection_status VARCHAR(20) DEFAULT 'not_inspected' CHECK (inspection_status IN ('inspected', 'not_inspected', 'pending')),
  ADD COLUMN IF NOT EXISTS running_status VARCHAR(20) DEFAULT 'running' CHECK (running_status IN ('running', 'not_running', 'unknown'));

-- AS-IS Vehicle Disclosures Table
CREATE TABLE IF NOT EXISTS as_is_disclosures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID REFERENCES listings(id) ON DELETE CASCADE,
  not_running BOOLEAN DEFAULT false,
  mechanical_issues BOOLEAN DEFAULT false,
  electrical_issues BOOLEAN DEFAULT false,
  structural_damage BOOLEAN DEFAULT false,
  not_inspected BOOLEAN DEFAULT false,
  export_only BOOLEAN DEFAULT false,
  for_parts BOOLEAN DEFAULT false,
  severity disclosure_severity DEFAULT 'moderate',
  custom_description TEXT,
  disclosed_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User AS-IS Vehicle Acknowledgments
CREATE TABLE IF NOT EXISTS user_as_is_acknowledgments (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  acknowledged_at TIMESTAMPTZ DEFAULT NOW(),
  ip_address TEXT,
  user_agent TEXT
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_as_is_listings ON listings(condition) WHERE condition = 'as_is';
CREATE INDEX IF NOT EXISTS idx_road_ready ON listings(road_ready) WHERE road_ready = false;
CREATE INDEX IF NOT EXISTS idx_running_status ON listings(running_status);
CREATE INDEX IF NOT EXISTS idx_as_is_disclosures_listing ON as_is_disclosures(listing_id);
CREATE INDEX IF NOT EXISTS idx_user_acknowledgments ON user_as_is_acknowledgments(user_id);

-- =============================================================================
-- TRIGGERS AND FUNCTIONS DISABLED FOR STEP 1
-- =============================================================================
-- Moved to schema-logic.sql (Step 3):
--   - validate_as_is_disclosure() function + trigger
-- =============================================================================

-- Comments
COMMENT ON TABLE as_is_disclosures IS 'Required disclosures for AS-IS, non-running, and project vehicles';
COMMENT ON TABLE user_as_is_acknowledgments IS 'Tracks user acknowledgment of AS-IS vehicle section disclaimer';
COMMENT ON COLUMN listings.condition IS 'Vehicle condition: new, used, certified, or as_is';
COMMENT ON COLUMN listings.road_ready IS 'Whether vehicle is road-ready (false for as_is)';
COMMENT ON COLUMN listings.inspection_status IS 'Vehicle inspection status';
COMMENT ON COLUMN listings.running_status IS 'Vehicle running condition';
