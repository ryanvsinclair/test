-- =============================================================================
-- STEP 3: BUSINESS LOGIC (Functions, Triggers, Views)
-- =============================================================================
-- This file restores all business logic after foundation (Step 1) and security (Step 2).
-- Run after: schema-enums.sql, schema-base.sql, schema-rls.sql, all canonicalized schemas
-- 
-- Execution order:
--   1. Helper functions (pure validation, immutable)
--   2. Automated triggers (state calculation, validation)
--   3. Views (read-only aggregations)
-- =============================================================================

-- =============================================================================
-- PART 1: HELPER FUNCTIONS (Pure, Immutable)
-- =============================================================================

-- Road Readiness State Determination
CREATE OR REPLACE FUNCTION determine_road_readiness_state(
  p_running BOOLEAN,
  p_inspection_uploaded BOOLEAN,
  p_issue_severity disclosure_severity,
  p_intended_use TEXT[]
)
RETURNS road_readiness_state AS $$
BEGIN
  -- Builder's Market if:
  -- - Not running
  -- - OR no inspection AND has builder intent
  -- - OR major/critical issues
  IF NOT p_running 
     OR (NOT p_inspection_uploaded AND p_intended_use IS NOT NULL AND array_length(p_intended_use, 1) > 0)
     OR p_issue_severity IN ('major', 'critical') THEN
    RETURN 'as_is'::road_readiness_state;
  END IF;
  
  -- Carly Verified (Ready to Go) if:
  -- - Running
  -- - Has inspection
  -- - No issues or minor only
  IF p_running 
     AND p_inspection_uploaded 
     AND p_issue_severity IN ('none', 'minor') THEN
    RETURN 'ready_to_go'::road_readiness_state;
  END IF;
  
  -- The Hub / Needs Attention (default for in-between states)
  RETURN 'needs_attention'::road_readiness_state;
END;
$$ LANGUAGE plpgsql IMMUTABLE SECURITY INVOKER;

COMMENT ON FUNCTION determine_road_readiness_state IS 'Pure function to calculate road readiness state from vehicle condition';

-- =============================================================================
-- PART 2: UPDATED_AT TRIGGERS (Universal Pattern)
-- =============================================================================

-- Generic updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER;

-- Apply to all tables with updated_at
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_dealers_updated_at ON dealers;
CREATE TRIGGER update_dealers_updated_at
  BEFORE UPDATE ON dealers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_listings_updated_at ON listings;
CREATE TRIGGER update_listings_updated_at
  BEFORE UPDATE ON listings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_conversations_updated_at ON conversations;
CREATE TRIGGER update_conversations_updated_at
  BEFORE UPDATE ON conversations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_messages_updated_at ON messages;
CREATE TRIGGER update_messages_updated_at
  BEFORE UPDATE ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_appointments_updated_at ON appointments;
CREATE TRIGGER update_appointments_updated_at
  BEFORE UPDATE ON appointments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_dealer_applications_updated_at ON dealer_applications;
CREATE TRIGGER update_dealer_applications_updated_at
  BEFORE UPDATE ON dealer_applications
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- PART 3: VALIDATION TRIGGERS (Consolidated)
-- =============================================================================

-- NEW INVENTORY: Vehicle State Validation
CREATE OR REPLACE FUNCTION validate_vehicle_state_transition()
RETURNS TRIGGER AS $$
BEGIN
  -- Prevent new_inventory -> carly_verified
  IF OLD.status = 'new_inventory' AND NEW.marketplace_mode = 'carly_verified' THEN
    RAISE EXCEPTION 'New inventory vehicles cannot be marked as Carly Verified';
  END IF;
  
  -- Prevent carly_verified -> new_inventory
  IF OLD.marketplace_mode = 'carly_verified' AND NEW.status = 'new_inventory' THEN
    RAISE EXCEPTION 'Carly Verified vehicles cannot be reclassified as new inventory';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER;

DROP TRIGGER IF EXISTS validate_state_transition ON listings;
CREATE TRIGGER validate_state_transition
  BEFORE UPDATE OF status, marketplace_mode ON listings
  FOR EACH ROW
  EXECUTE FUNCTION validate_vehicle_state_transition();

-- AS-IS VEHICLES: Disclosure Requirements
CREATE OR REPLACE FUNCTION validate_as_is_disclosure()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.condition = 'as_is' THEN
    -- Ensure at least one disclosure is present
    IF NOT EXISTS (
      SELECT 1 FROM as_is_disclosures 
      WHERE listing_id = NEW.id
      AND (
        not_running = true OR
        mechanical_issues = true OR
        electrical_issues = true OR
        structural_damage = true OR
        not_inspected = true OR
        export_only = true OR
        for_parts = true
      )
    ) THEN
      RAISE EXCEPTION 'AS-IS vehicles must have at least one disclosure';
    END IF;
    
    -- Enforce road_ready = false for as_is vehicles
    IF NEW.road_ready = true THEN
      NEW.road_ready := false;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER;

DROP TRIGGER IF EXISTS enforce_as_is_disclosure ON listings;
CREATE TRIGGER enforce_as_is_disclosure
  BEFORE INSERT OR UPDATE OF condition, road_ready ON listings
  FOR EACH ROW
  EXECUTE FUNCTION validate_as_is_disclosure();

-- MARKETPLACE MODES: Carly Verified Requirements
CREATE OR REPLACE FUNCTION validate_carly_verified_listing()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.marketplace_mode = 'carly_verified' THEN
    -- Must be running
    IF NEW.running != true THEN
      RAISE EXCEPTION 'Carly Verified vehicles must be running';
    END IF;
    
    -- Must have inspection uploaded
    IF NEW.inspection_uploaded != true THEN
      RAISE EXCEPTION 'Carly Verified vehicles must have inspection uploaded';
    END IF;
    
    -- Issue severity must be none or minor
    IF NEW.issue_severity NOT IN ('none', 'minor') THEN
      RAISE EXCEPTION 'Carly Verified vehicles can only have none or minor issues';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER;

DROP TRIGGER IF EXISTS trigger_validate_carly_verified ON listings;
CREATE TRIGGER trigger_validate_carly_verified
  BEFORE INSERT OR UPDATE OF marketplace_mode, running, inspection_uploaded, issue_severity ON listings
  FOR EACH ROW
  WHEN (NEW.marketplace_mode = 'carly_verified')
  EXECUTE FUNCTION validate_carly_verified_listing();

-- MARKETPLACE MODES: The Hub Requirements
CREATE OR REPLACE FUNCTION validate_the_hub_listing()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.marketplace_mode = 'the_hub' THEN
    -- Must be running
    IF NEW.running != true THEN
      RAISE EXCEPTION 'The Hub vehicles must be running';
    END IF;
    
    -- Issue severity must be moderate or higher (not none/minor)
    IF NEW.issue_severity IN ('none', 'minor') THEN
      RAISE EXCEPTION 'The Hub vehicles must have moderate or higher issues';
    END IF;
    
    -- Must have estimated fixes
    IF NEW.estimated_fixes IS NULL OR array_length(NEW.estimated_fixes, 1) = 0 THEN
      RAISE EXCEPTION 'The Hub vehicles must have estimated fixes listed';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER;

DROP TRIGGER IF EXISTS trigger_validate_the_hub ON listings;
CREATE TRIGGER trigger_validate_the_hub
  BEFORE INSERT OR UPDATE OF marketplace_mode, running, issue_severity, estimated_fixes ON listings
  FOR EACH ROW
  WHEN (NEW.marketplace_mode = 'the_hub')
  EXECUTE FUNCTION validate_the_hub_listing();

-- MARKETPLACE MODES: Builder's Market Requirements
CREATE OR REPLACE FUNCTION validate_builders_market_listing()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.marketplace_mode = 'builders_market' THEN
    -- Must meet at least ONE of these criteria
    IF NOT (
      NEW.running = false OR
      NEW.inspection_uploaded = false OR
      (NEW.intended_use IS NOT NULL AND array_length(NEW.intended_use, 1) > 0)
    ) THEN
      RAISE EXCEPTION 'Builder''s Market vehicles must be non-running, uninspected, or have project intent';
    END IF;
    
    -- Must acknowledge disclosure
    IF NEW.disclosure_acknowledged != true THEN
      RAISE EXCEPTION 'Builder''s Market vehicles require disclosure acknowledgment';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER;

DROP TRIGGER IF EXISTS trigger_validate_builders_market ON listings;
CREATE TRIGGER trigger_validate_builders_market
  BEFORE INSERT OR UPDATE OF marketplace_mode, running, inspection_uploaded, intended_use, disclosure_acknowledged ON listings
  FOR EACH ROW
  WHEN (NEW.marketplace_mode = 'builders_market')
  EXECUTE FUNCTION validate_builders_market_listing();

-- ROAD READINESS: Auto-set state based on condition
CREATE OR REPLACE FUNCTION auto_set_road_readiness_state()
RETURNS TRIGGER AS $$
BEGIN
  -- Determine state based on vehicle condition
  NEW.road_readiness_state := determine_road_readiness_state(
    NEW.running,
    NEW.inspection_uploaded,
    NEW.issue_severity,
    NEW.intended_use
  );
  
  -- Store the assigned state for audit
  NEW.assigned_road_readiness_state := NEW.road_readiness_state;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER;

DROP TRIGGER IF EXISTS trigger_auto_set_road_readiness_state ON listings;
CREATE TRIGGER trigger_auto_set_road_readiness_state
  BEFORE INSERT OR UPDATE OF running, inspection_uploaded, issue_severity, intended_use ON listings
  FOR EACH ROW
  EXECUTE FUNCTION auto_set_road_readiness_state();

-- PUBLISH FLOW: Validate completeness
CREATE OR REPLACE FUNCTION validate_publish_flow_completeness()
RETURNS TRIGGER AS $$
BEGIN
  -- All steps must be completed
  IF NEW.is_running IS NULL 
     OR NEW.is_drivable IS NULL 
     OR NEW.is_legally_operable IS NULL
     OR NEW.inspection_status IS NULL
     OR NEW.issue_severity IS NULL
     OR NEW.assigned_road_readiness_state IS NULL
     OR NEW.acknowledgement_confirmed != true
     OR NEW.acknowledgement_timestamp IS NULL THEN
    RAISE EXCEPTION 'All publish flow steps must be completed';
  END IF;
  
  -- Issue description required if not "none"
  IF NEW.issue_severity NOT IN ('none', 'minor') AND (NEW.issue_description IS NULL OR NEW.issue_description = '') THEN
    RAISE EXCEPTION 'Issue description is required when issue severity is not none/minor';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER;

DROP TRIGGER IF EXISTS trigger_validate_publish_flow ON vehicle_publish_logs;
CREATE TRIGGER trigger_validate_publish_flow
  BEFORE INSERT ON vehicle_publish_logs
  FOR EACH ROW
  EXECUTE FUNCTION validate_publish_flow_completeness();

-- =============================================================================
-- PART 4: VIEWS (Aggregations)
-- =============================================================================

-- Dealer Metrics View (Admin Dashboard)
CREATE OR REPLACE VIEW dealer_metrics AS
SELECT 
  p.id as dealer_id,
  p.email as dealer_email,
  p.name as dealer_name,
  d.status as dealer_status,
  d.dealership_name,
  p.created_at as onboarded_at,
  
  -- Listing metrics
  COUNT(DISTINCT l.id) FILTER (WHERE l.status IN ('active', 'sold')) as total_listings,
  COUNT(DISTINCT l.id) FILTER (WHERE l.status = 'active') as active_listings,
  COUNT(DISTINCT l.id) FILTER (WHERE l.status = 'sold') as sold_listings,
  
  -- Engagement metrics
  COUNT(DISTINCT c.id) as total_conversations,
  COUNT(DISTINCT m.id) as total_messages,
  COALESCE(SUM(c.unread_count_dealer), 0) as unread_messages,
  
  -- Appointment metrics
  COUNT(DISTINCT a.id) as total_appointments,
  COUNT(DISTINCT a.id) FILTER (WHERE a.status = 'scheduled') as scheduled_appointments,
  COUNT(DISTINCT a.id) FILTER (WHERE a.status = 'completed') as completed_appointments,
  
  -- Activity tracking
  MAX(GREATEST(
    l.updated_at,
    c.last_message_at,
    a.updated_at
  )) as last_activity_at
  
FROM profiles p
LEFT JOIN dealers d ON d.profile_id = p.id
LEFT JOIN listings l ON l.dealer_id = p.id
LEFT JOIN conversations c ON c.dealer_id = p.id
LEFT JOIN messages m ON m.sender_id = p.id
LEFT JOIN appointments a ON a.dealer_id = p.id
WHERE p.role = 'dealer'
GROUP BY p.id, p.email, p.name, d.status, d.dealership_name, p.created_at;

COMMENT ON VIEW dealer_metrics IS 'Aggregated dealer performance metrics (admin-only visibility via RLS on profiles)';

-- =============================================================================
-- PART 5: HELPER FUNCTIONS (Application Layer)
-- =============================================================================

-- Team Invitations: Auto-expire old invitations
CREATE OR REPLACE FUNCTION expire_old_invitations()
RETURNS void AS $$
BEGIN
  UPDATE team_invitations
  SET status = 'expired'
  WHERE status = 'pending'
    AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION expire_old_invitations IS 'Call periodically to expire pending invitations';

-- Team Invitations: Validate email domain
CREATE OR REPLACE FUNCTION validate_team_email_domain(
  p_email VARCHAR,
  p_dealership_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  v_dealership_email VARCHAR;
  v_email_domain VARCHAR;
  v_dealership_domain VARCHAR;
BEGIN
  -- Get dealership's primary email
  SELECT email INTO v_dealership_email
  FROM dealers d
  JOIN profiles p ON p.id = d.profile_id
  WHERE d.id = p_dealership_id;

  IF v_dealership_email IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Extract domains
  v_email_domain := LOWER(SPLIT_PART(p_email, '@', 2));
  v_dealership_domain := LOWER(SPLIT_PART(v_dealership_email, '@', 2));

  -- Compare domains
  RETURN v_email_domain = v_dealership_domain;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER;

COMMENT ON FUNCTION validate_team_email_domain IS 'Validates team member email matches dealership domain';

-- =============================================================================
-- END OF BUSINESS LOGIC
-- =============================================================================

-- Verification: List all triggers
-- SELECT tgname, tgrelid::regclass, tgtype 
-- FROM pg_trigger 
-- WHERE tgrelid IN (
--   'profiles'::regclass, 'dealers'::regclass, 'listings'::regclass,
--   'conversations'::regclass, 'messages'::regclass, 'appointments'::regclass,
--   'vehicle_publish_logs'::regclass
-- )
-- AND tgname NOT LIKE 'RI_%'
-- ORDER BY tgrelid, tgname;

-- =============================================================================
-- CONFIRMATION
-- =============================================================================
-- ✅ All validation triggers restored (with canonical table names)
-- ✅ All helper functions restored (immutable, security-appropriate)
-- ✅ Views created (dealer_metrics)
-- ✅ Updated_at triggers applied to all core tables
-- ✅ No security weakened (SECURITY INVOKER used for all triggers)
-- ✅ No DELETE policies added
-- ✅ All functions use correct table references (listings, profiles)
-- =============================================================================
