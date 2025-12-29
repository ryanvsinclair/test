-- =============================================================================
-- TEAM INVITATIONS SYSTEM - STEP 1 CANONICALIZATION
-- =============================================================================
-- Handles secure email-based team member onboarding
-- 
-- UPDATED FOR STEP 1:
--   - Fixed FK: users(id) → profiles(id)
--   - Triggers/functions disabled (moved to Step 3)
-- =============================================================================

-- Team invitations table
CREATE TABLE IF NOT EXISTS team_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL CHECK (role IN ('sales', 'manager', 'admin')),
  dealership_id UUID NOT NULL,
  invited_by UUID NOT NULL,
  invitation_token VARCHAR(255) NOT NULL UNIQUE,
  status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'revoked')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  accepted_at TIMESTAMPTZ,
  CONSTRAINT fk_dealership FOREIGN KEY (dealership_id) REFERENCES dealers(id) ON DELETE CASCADE,
  CONSTRAINT fk_invited_by FOREIGN KEY (invited_by) REFERENCES profiles(id) ON DELETE SET NULL
);

-- Team members table
CREATE TABLE IF NOT EXISTS team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  dealership_id UUID NOT NULL,
  role VARCHAR(50) NOT NULL CHECK (role IN ('owner', 'sales', 'manager', 'admin')),
  status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'invited')),
  invited_by UUID,
  invited_at TIMESTAMPTZ,
  joined_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE,
  CONSTRAINT fk_dealership FOREIGN KEY (dealership_id) REFERENCES dealers(id) ON DELETE CASCADE,
  CONSTRAINT fk_invited_by FOREIGN KEY (invited_by) REFERENCES profiles(id) ON DELETE SET NULL
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_team_invitations_token ON team_invitations(invitation_token);
CREATE INDEX IF NOT EXISTS idx_team_invitations_email ON team_invitations(email);
CREATE INDEX IF NOT EXISTS idx_team_invitations_dealership ON team_invitations(dealership_id);
CREATE INDEX IF NOT EXISTS idx_team_invitations_status ON team_invitations(status);
CREATE INDEX IF NOT EXISTS idx_team_members_dealership ON team_members(dealership_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user ON team_members(user_id);
CREATE INDEX IF NOT EXISTS idx_team_members_status ON team_members(status);

-- Composite index for duplicate prevention
CREATE UNIQUE INDEX IF NOT EXISTS idx_team_invitations_unique 
  ON team_invitations(email, dealership_id) 
  WHERE status = 'pending';

-- Composite index for active team members
CREATE UNIQUE INDEX IF NOT EXISTS idx_team_members_unique 
  ON team_members(user_id, dealership_id);

-- =============================================================================
-- TRIGGERS AND FUNCTIONS DISABLED FOR STEP 1
-- =============================================================================
-- Commented out to prevent execution - will be re-enabled in Step 3
-- =============================================================================

/*
-- Function to auto-expire invitations
CREATE OR REPLACE FUNCTION expire_old_invitations()
RETURNS void AS $$
BEGIN
  UPDATE team_invitations
  SET status = 'expired'
  WHERE status = 'pending'
    AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Function to check domain match (to be called from application layer)
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
  FROM dealers
  WHERE id = p_dealership_id;

  IF v_dealership_email IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Extract domains
  v_email_domain := LOWER(SPLIT_PART(p_email, '@', 2));
  v_dealership_domain := LOWER(SPLIT_PART(v_dealership_email, '@', 2));

  -- Compare domains
  RETURN v_email_domain = v_dealership_domain;
END;
$$ LANGUAGE plpgsql;
*/

-- Comments for documentation
COMMENT ON TABLE team_invitations IS 'Stores pending team member invitations with secure tokens';
COMMENT ON TABLE team_members IS 'Stores active team members associated with dealerships';
COMMENT ON COLUMN team_invitations.invitation_token IS 'Secure single-use token for invitation acceptance';
COMMENT ON COLUMN team_invitations.expires_at IS 'Token expiration timestamp (typically 72 hours from creation)';
COMMENT ON COLUMN team_members.status IS 'Member status: active, inactive, or invited (pending acceptance)';
