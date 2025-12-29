-- =============================================================================
-- LISTING IDENTIFICATION SYSTEM - STEP 1 CANONICALIZATION
-- =============================================================================
-- Immutable listing IDs and marketplace mode enforcement
-- 
-- UPDATED FOR STEP 1:
--   - Table name: vehicle_listings → listings
--   - Triggers/functions disabled (moved to Step 3)
--   - Only column additions and indexes remain
-- =============================================================================

-- Add Carly listing ID and region fields to canonical listings table
ALTER TABLE listings
  ADD COLUMN IF NOT EXISTS region VARCHAR(2) CHECK (region IN ('CA', 'US')),
  ADD COLUMN IF NOT EXISTS disclosure_acknowledged_at TIMESTAMPTZ;

-- Note: carly_listing_id already added in schema-base.sql as VARCHAR UNIQUE
-- Note: marketplace_mode already added in schema-base.sql

-- Create indexes for fast lookups (carly_listing_id index already in schema-base.sql)
CREATE INDEX IF NOT EXISTS idx_listings_region ON listings(region);

-- Enforce Carly listing ID format
CREATE OR REPLACE FUNCTION validate_carly_listing_id()
RETURNS TRIGGER AS $$
BEGIN
  -- Validate format: CARLY-{REGION}-{MODE}-{YYYYMM}-{RANDOM}
  IF NEW.carly_listing_id !~ '^CARLY-(CA|US)-(RR|NRR|BM)-\d{6}-[A-Z0-9]{5}$' THEN
    RAISE EXCEPTION 'Invalid Carly listing ID format: %', NEW.carly_listing_id;
  END IF;
  
  -- Extract region from ID and ensure it matches
  IF substring(NEW.carly_listing_id from 7 for 2) != NEW.region THEN
    RAISE EXCEPTION 'Carly listing ID region does not match vehicle region';
  END IF;
  
  -- Extract mode abbreviation and ensure it matches marketplace_mode
  DECLARE
    mode_abbrev TEXT;
    expected_mode TEXT;
  BEGIN
    mode_abbrev := substring(NEW.carly_listing_id from 10 for 3);
    
    expected_mode := CASE
      WHEN NEW.marketplace_mode = 'carly_verified' THEN 'RR'
      WHEN NEW.marketplace_mode = 'the_hub' THEN 'NRR'
      WHEN NEW.marketplace_mode = 'builders_market' THEN 'BM'
    END;
    
    IF mode_abbrev != expected_mode THEN
      RAISE EXCEPTION 'Carly listing ID mode does not match marketplace_mode';
    END IF;
  END;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply Carly listing ID validation trigger
DROP TRIGGER IF EXISTS trigger_validate_carly_listing_id ON vehicle_listings;
CREATE TRIGGER trigger_validate_carly_listing_id
  BEFORE INSERT OR UPDATE ON vehicle_listings
  FOR EACH ROW
  EXECUTE FUNCTION validate_carly_listing_id();

-- Prevent Carly listing ID changes after creation
CREATE OR REPLACE FUNCTION prevent_listing_id_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.carly_listing_id IS DISTINCT FROM NEW.carly_listing_id THEN
    RAISE EXCEPTION 'Carly listing ID is immutable and cannot be changed';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply immutability trigger
DROP TRIGGER IF EXISTS trigger_prevent_listing_id_change ON vehicle_listings;
CREATE TRIGGER trigger_prevent_listing_id_change
  BEFORE UPDATE ON vehicle_listings
  FOR EACH ROW
  EXECUTE FUNCTION prevent_listing_id_change();

-- Enforce marketplace_mode as single source of truth
-- No runtime inference allowed
CREATE OR REPLACE FUNCTION enforce_marketplace_mode_explicit()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.marketplace_mode IS NULL THEN
    RAISE EXCEPTION 'marketplace_mode is required and must be set explicitly';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply marketplace mode enforcement trigger
DROP TRIGGER IF EXISTS trigger_enforce_marketplace_mode_explicit ON vehicle_listings;
CREATE TRIGGER trigger_enforce_marketplace_mode_explicit
  BEFORE INSERT OR UPDATE ON vehicle_listings
  FOR EACH ROW
  EXECUTE FUNCTION enforce_marketplace_mode_explicit();

-- Comments
COMMENT ON COLUMN vehicle_listings.carly_listing_id IS 'IMMUTABLE: Format CARLY-{REGION}-{MODE}-{YYYYMM}-{RANDOM}';
COMMENT ON COLUMN vehicle_listings.region IS 'Vehicle region: CA or US';
COMMENT ON COLUMN vehicle_listings.marketplace_mode IS 'SINGLE SOURCE OF TRUTH: Never infer at runtime';
COMMENT ON COLUMN vehicle_listings.disclosure_acknowledged_at IS 'Timestamp when Builder''s Market disclosure was acknowledged';
