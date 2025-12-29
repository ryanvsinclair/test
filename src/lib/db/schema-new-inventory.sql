-- =============================================================================
-- NEW INVENTORY VEHICLE STATE - STEP 1 CANONICALIZED
-- =============================================================================
-- Extends listings table to support New Inventory classification
-- 
-- UPDATED FOR STEP 1:
--   - Table name: vehicle_listings → listings (already in schema-base.sql)
--   - ENUM value already defined in schema-enums.sql
--   - Triggers/functions moved to schema-logic.sql (Step 3)
-- =============================================================================

-- Note: vehicle_state ENUM with 'new_inventory' already created in schema-enums.sql
-- Note: condition column already exists in schema-base.sql

-- Add explicitly_marked_new column
ALTER TABLE listings ADD COLUMN IF NOT EXISTS explicitly_marked_new BOOLEAN DEFAULT FALSE;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS seller_type VARCHAR(20);

-- Add index for New Inventory filtering
CREATE INDEX IF NOT EXISTS idx_listings_new_inventory 
ON listings (status) 
WHERE status = 'new_inventory';

-- Add constraint: New Inventory cannot have Carly Verified marketplace mode
ALTER TABLE listings ADD CONSTRAINT chk_new_inventory_not_verified 
CHECK (
  NOT (condition = 'new' AND marketplace_mode = 'carly_verified')
);

-- =============================================================================
-- TRIGGERS AND FUNCTIONS DISABLED FOR STEP 1
-- =============================================================================
-- Moved to schema-logic.sql (Step 3):
--   - validate_vehicle_state_transition() function + trigger
--   - Migration logic (UPDATE statements)
-- =============================================================================

-- Comments for documentation
COMMENT ON COLUMN listings.condition IS 'Vehicle condition: new, used, or certified';
COMMENT ON COLUMN listings.explicitly_marked_new IS 'Dealer explicitly marked this as new inventory';
COMMENT ON CONSTRAINT chk_new_inventory_not_verified ON listings IS 'New vehicles cannot be Carly Verified';
