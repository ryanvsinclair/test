-- =============================================================================
-- MARKET LANE SEPARATION SCHEMA - STEP 1 CANONICALIZED
-- =============================================================================
-- Enforces strict separation between Primary Market (Browse) and Secondary Market (Project/As-Is)
-- 
-- UPDATED FOR STEP 1:
--   - Table name: vehicle_listings → listings
--   - Columns already exist in schema-base.sql and schema-as-is-vehicles.sql
--   - Triggers/functions moved to schema-logic.sql (Step 3)
-- =============================================================================

-- Note: market_lane, road_ready, running_status columns already added
-- Add market lane tracking columns
ALTER TABLE listings
  ADD COLUMN IF NOT EXISTS inspected BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS assigned_market_lane VARCHAR(20);

-- Create market lane transitions audit table
CREATE TABLE IF NOT EXISTS market_lane_transitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID REFERENCES listings(id) ON DELETE CASCADE,
  from_lane VARCHAR(20),
  to_lane VARCHAR(20),
  reason TEXT,
  transitioned_at TIMESTAMPTZ DEFAULT NOW(),
  transitioned_by UUID REFERENCES profiles(id) ON DELETE SET NULL
);

-- Create market lane reclassification requests table
CREATE TABLE IF NOT EXISTS market_lane_reclassification_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID REFERENCES listings(id) ON DELETE CASCADE,
  requested_lane VARCHAR(20),
  current_lane VARCHAR(20),
  reason TEXT,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  requested_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  reviewed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ
);

-- Create indexes for fast market lane filtering
CREATE INDEX IF NOT EXISTS idx_market_lane ON listings(market_lane);
CREATE INDEX IF NOT EXISTS idx_primary_market ON listings(market_lane, road_ready, inspected) 
  WHERE market_lane = 'primary';
CREATE INDEX IF NOT EXISTS idx_secondary_market ON listings(market_lane) 
  WHERE market_lane = 'secondary';
CREATE INDEX IF NOT EXISTS idx_market_lane_transitions_listing ON market_lane_transitions(listing_id);
CREATE INDEX IF NOT EXISTS idx_market_lane_requests_listing ON market_lane_reclassification_requests(listing_id);
CREATE INDEX IF NOT EXISTS idx_market_lane_requests_status ON market_lane_reclassification_requests(status);

-- =============================================================================
-- TRIGGERS AND FUNCTIONS DISABLED FOR STEP 1
-- =============================================================================
-- Moved to schema-logic.sql (Step 3):
--   - enforce_market_lane() function + trigger
--   - Market lane classification logic
-- =============================================================================

-- Comments
COMMENT ON COLUMN listings.market_lane IS 'Market classification: primary (browse) or secondary (project/as-is)';
COMMENT ON COLUMN listings.assigned_market_lane IS 'System-assigned market lane based on vehicle condition';
COMMENT ON TABLE market_lane_transitions IS 'Audit log of market lane changes';
COMMENT ON TABLE market_lane_reclassification_requests IS 'Dealer requests to reclassify vehicle market lane';

