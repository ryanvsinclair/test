-- =============================================================================
-- PUBLISH TO MARKETPLACE FLOW - STEP 1 CANONICALIZED
-- =============================================================================
-- Server-side enforcement and audit trail
-- 
-- UPDATED FOR STEP 1:
--   - Fixed FK: vehicle_id REFERENCES vehicles(id) → listing_id REFERENCES listings(id)
--   - Fixed FK: auth.users(id) → profiles(id)
--   - Triggers/functions moved to schema-logic.sql (Step 3)
-- =============================================================================

-- Vehicle publish log (audit trail)
CREATE TABLE IF NOT EXISTS vehicle_publish_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Step 1: Vehicle Condition
  is_running BOOLEAN NOT NULL,
  is_drivable BOOLEAN NOT NULL,
  is_legally_operable BOOLEAN NOT NULL,
  
  -- Step 2: Inspection
  inspection_status VARCHAR(20) NOT NULL CHECK (inspection_status IN ('verified', 'uploaded', 'none')),
  inspection_file_url TEXT,
  
  -- Step 3: Known Issues
  issue_severity disclosure_severity NOT NULL,
  issue_description TEXT,
  
  -- Step 4: Assigned State
  assigned_road_readiness_state road_readiness_state NOT NULL,
  
  -- Step 5: Acknowledgement
  acknowledgement_confirmed BOOLEAN NOT NULL,
  acknowledgement_timestamp TIMESTAMPTZ NOT NULL,
  
  -- Metadata
  published_at TIMESTAMPTZ DEFAULT NOW(),
  user_ip_address TEXT,
  user_agent TEXT
);

-- Condition update requests (for post-publish changes)
CREATE TABLE IF NOT EXISTS vehicle_condition_update_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Requested changes
  current_state JSONB NOT NULL,
  proposed_state JSONB NOT NULL,
  change_reason TEXT NOT NULL,
  
  -- Review
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  review_notes TEXT,
  approved_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_publish_logs_listing ON vehicle_publish_logs(listing_id);
CREATE INDEX IF NOT EXISTS idx_publish_logs_user ON vehicle_publish_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_publish_logs_published_at ON vehicle_publish_logs(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_condition_update_requests_listing ON vehicle_condition_update_requests(listing_id);
CREATE INDEX IF NOT EXISTS idx_condition_update_requests_status ON vehicle_condition_update_requests(status);

-- =============================================================================
-- TRIGGERS AND FUNCTIONS DISABLED FOR STEP 1
-- =============================================================================
-- Moved to schema-logic.sql (Step 3):
--   - validate_publish_flow_completeness() function + trigger
--   - require_publish_log_before_listing() function + trigger
--   - lock_condition_fields_after_publish() function + trigger
-- =============================================================================

-- Comments
COMMENT ON TABLE vehicle_publish_logs IS 'Audit trail for all marketplace publications';
COMMENT ON TABLE vehicle_condition_update_requests IS 'Requests to update condition after publish (requires review)';
COMMENT ON COLUMN vehicle_publish_logs.acknowledgement_confirmed IS 'User confirmed accuracy statement';
COMMENT ON COLUMN vehicle_publish_logs.assigned_road_readiness_state IS 'Server-assigned state (cannot be overridden by user)';
