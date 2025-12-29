-- =============================================================================
-- MARKETPLACE MODE UPLOAD FLOW SCHEMA - STEP 1 CANONICALIZED
-- =============================================================================
-- Supports Road Ready (Carly Verified), Near Road Ready (The Hub), and Builder's Market
-- 
-- UPDATED FOR STEP 1:
--   - Table name: vehicle_listings → listings
--   - marketplace_mode column already in schema-base.sql
--   - Triggers/functions moved to schema-logic.sql (Step 3)
-- =============================================================================

-- Note: marketplace_mode ENUM already created in schema-enums.sql
-- Note: marketplace_mode column already in schema-base.sql
-- Add marketplace mode specific fields
ALTER TABLE listings
  ADD COLUMN IF NOT EXISTS running BOOLEAN,
  ADD COLUMN IF NOT EXISTS inspection_uploaded BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS inspection_file_url TEXT,
  ADD COLUMN IF NOT EXISTS issue_severity disclosure_severity DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS estimated_fixes TEXT[],
  ADD COLUMN IF NOT EXISTS intended_use TEXT[],
  ADD COLUMN IF NOT EXISTS disclosure_acknowledged BOOLEAN DEFAULT false;

-- Create marketplace mode change requests table
CREATE TABLE IF NOT EXISTS marketplace_mode_change_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID REFERENCES listings(id) ON DELETE CASCADE,
  current_mode marketplace_mode,
  requested_mode marketplace_mode,
  reason TEXT,
  supporting_documentation JSONB,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  requested_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  reviewed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ
);

-- Indexes for marketplace mode filtering (marketplace_mode index already in schema-base.sql)
CREATE INDEX IF NOT EXISTS idx_listings_running ON listings(running);
CREATE INDEX IF NOT EXISTS idx_listings_issue_severity ON listings(issue_severity);
CREATE INDEX IF NOT EXISTS idx_listings_inspection_uploaded ON listings(inspection_uploaded);
CREATE INDEX IF NOT EXISTS idx_marketplace_mode_requests_listing ON marketplace_mode_change_requests(listing_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_mode_requests_status ON marketplace_mode_change_requests(status);

-- =============================================================================
-- TRIGGERS AND FUNCTIONS DISABLED FOR STEP 1
-- =============================================================================
-- Moved to schema-logic.sql (Step 3):
--   - validate_carly_verified_listing() function + trigger
--   - validate_the_hub_listing() function + trigger
--   - validate_builders_market_listing() function + trigger
-- =============================================================================

-- Comments
COMMENT ON COLUMN listings.marketplace_mode IS 'Marketplace classification: carly_verified (Road Ready), the_hub (Near Road Ready), builders_market (Project)';
COMMENT ON COLUMN listings.running IS 'Whether vehicle runs (required true for carly_verified and the_hub)';
COMMENT ON COLUMN listings.inspection_uploaded IS 'Whether inspection document has been uploaded';
COMMENT ON COLUMN listings.issue_severity IS 'Severity of known issues (NULL/minor for carly_verified, minor+ for the_hub, any for builders_market)';
COMMENT ON COLUMN listings.estimated_fixes IS 'Array of required fixes (required for the_hub)';
COMMENT ON COLUMN listings.intended_use IS 'Array of intended uses (required for builders_market)';
COMMENT ON COLUMN listings.disclosure_acknowledged IS 'Whether dealer acknowledged disclosure requirements';
COMMENT ON TABLE marketplace_mode_change_requests IS 'Dealer requests to change marketplace mode classification';
