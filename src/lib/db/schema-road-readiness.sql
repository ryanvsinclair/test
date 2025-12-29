-- =============================================================================
-- UNIFIED MARKETPLACE WITH ROAD READINESS STATES - STEP 1 CANONICALIZED
-- =============================================================================
-- Single source of truth for vehicle road readiness
-- 
-- UPDATED FOR STEP 1:
--   - Table name: vehicle_listings → listings
--   - road_readiness_state column already in schema-base.sql
--   - user_browse_preferences already exists
--   - Triggers/functions moved to schema-logic.sql (Step 3)
-- =============================================================================

-- Note: road_readiness_state ENUM already created in schema-enums.sql
-- Note: road_readiness_state column already in schema-base.sql

-- Index for fast filtering (already in schema-base.sql)
-- CREATE INDEX IF NOT EXISTS idx_listings_road_readiness_state ON listings(road_readiness_state);

-- =============================================================================
-- TRIGGERS AND FUNCTIONS DISABLED FOR STEP 1
-- =============================================================================
-- Moved to schema-logic.sql (Step 3):
--   - determine_road_readiness_state() function
--   - auto_set_road_readiness_state() function + trigger
-- =============================================================================

-- Note: user_browse_preferences table already exists in schema.sql
-- If not, create it here:
CREATE TABLE IF NOT EXISTS user_browse_preferences (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  show_carly_verified BOOLEAN DEFAULT true,
  show_the_hub BOOLEAN DEFAULT true,
  show_builders_market BOOLEAN DEFAULT false,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_browse_prefs ON user_browse_preferences(user_id);

-- Comments
COMMENT ON COLUMN listings.road_readiness_state IS 'SINGLE SOURCE OF TRUTH: Automatically determined from vehicle condition';
COMMENT ON TABLE user_browse_preferences IS 'Per-user browse filter preferences';

