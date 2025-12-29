-- =============================================================================
-- COMPLETE SUPABASE SCHEMA - CLEAN RESET
-- =============================================================================
-- This file contains all schema definitions needed for the application.
-- Run this in Supabase SQL Editor to set up or reset the database.
-- =============================================================================

-- =============================================================================
-- STEP 0: DROP EXISTING OBJECTS (IN CORRECT ORDER)
-- =============================================================================

-- Drop tables (cascades will handle dependencies)
DROP TABLE IF EXISTS marketplace_mode_change_requests CASCADE;
DROP TABLE IF EXISTS user_hidden_patterns CASCADE;
DROP TABLE IF EXISTS user_interactions CASCADE;
DROP TABLE IF EXISTS user_preferences CASCADE;
DROP TABLE IF EXISTS team_members CASCADE;
DROP TABLE IF EXISTS team_invitations CASCADE;
DROP TABLE IF EXISTS dealer_applications CASCADE;
DROP TABLE IF EXISTS appointments CASCADE;
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS conversations CASCADE;
DROP TABLE IF EXISTS listings CASCADE;
DROP TABLE IF EXISTS dealers CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- Drop enums
DROP TYPE IF EXISTS disclosure_severity CASCADE;
DROP TYPE IF EXISTS message_status CASCADE;
DROP TYPE IF EXISTS appointment_status CASCADE;
DROP TYPE IF EXISTS application_status CASCADE;
DROP TYPE IF EXISTS user_role CASCADE;
DROP TYPE IF EXISTS dealer_status CASCADE;
DROP TYPE IF EXISTS vehicle_state CASCADE;
DROP TYPE IF EXISTS road_readiness_state CASCADE;
DROP TYPE IF EXISTS marketplace_mode CASCADE;

-- =============================================================================
-- STEP 1: ENUM TYPE DEFINITIONS
-- =============================================================================

CREATE TYPE marketplace_mode AS ENUM (
  'carly_verified',
  'the_hub',
  'builders_market'
);

CREATE TYPE road_readiness_state AS ENUM (
  'ready_to_go',
  'needs_attention',
  'major_repairs',
  'as_is'
);

CREATE TYPE vehicle_state AS ENUM (
  'draft',
  'active',
  'sold',
  'deleted',
  'new_inventory',
  'pending_approval'
);

CREATE TYPE dealer_status AS ENUM (
  'pending',
  'approved',
  'active',
  'suspended',
  'rejected'
);

CREATE TYPE user_role AS ENUM (
  'buyer',
  'dealer',
  'admin'
);

CREATE TYPE application_status AS ENUM (
  'pending',
  'approved',
  'rejected'
);

CREATE TYPE appointment_status AS ENUM (
  'scheduled',
  'confirmed',
  'completed',
  'cancelled',
  'no_show'
);

CREATE TYPE message_status AS ENUM (
  'sent',
  'delivered',
  'read'
);

CREATE TYPE disclosure_severity AS ENUM (
  'minor',
  'moderate',
  'major',
  'critical'
);

-- =============================================================================
-- STEP 2: BASE TABLES
-- =============================================================================

-- Profiles Table (extends auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR NOT NULL,
  name VARCHAR,
  phone VARCHAR,
  role user_role DEFAULT 'buyer',
  dealer_status dealer_status,
  verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_dealer_status ON profiles(dealer_status);

-- Dealers Table
CREATE TABLE dealers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  dealership_name VARCHAR NOT NULL,
  dealership_type VARCHAR,
  address VARCHAR,
  city VARCHAR,
  region VARCHAR,
  country VARCHAR DEFAULT 'CA',
  timezone VARCHAR DEFAULT 'America/Toronto',
  website_url VARCHAR,
  instagram_url VARCHAR,
  facebook_url VARCHAR,
  tiktok_url VARCHAR,
  google_business_url VARCHAR,
  days_of_operation TEXT[],
  opening_time VARCHAR,
  closing_time VARCHAR,
  description TEXT,
  special_notes TEXT,
  status dealer_status DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_dealer_profile UNIQUE(profile_id)
);

CREATE INDEX idx_dealers_profile_id ON dealers(profile_id);
CREATE INDEX idx_dealers_status ON dealers(status);
CREATE INDEX idx_dealers_city_region ON dealers(city, region);

-- Listings Table (canonical vehicle listings)
CREATE TABLE listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dealer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  carly_listing_id VARCHAR UNIQUE,
  legacy_listing_id VARCHAR,
  vin VARCHAR(17),
  year INTEGER,
  make VARCHAR,
  model VARCHAR,
  trim VARCHAR,
  body_style VARCHAR,
  price DECIMAL(10, 2),
  original_price DECIMAL(10, 2),
  mileage INTEGER,
  mileage_unit VARCHAR DEFAULT 'km',
  condition VARCHAR,
  marketplace_mode marketplace_mode,
  assigned_marketplace_mode marketplace_mode,
  road_readiness_state road_readiness_state,
  assigned_road_readiness_state road_readiness_state,
  market_lane VARCHAR,
  assigned_market_lane VARCHAR,
  status vehicle_state DEFAULT 'draft',
  images JSONB DEFAULT '[]'::jsonb,
  primary_image_url VARCHAR,
  title VARCHAR,
  description TEXT,
  features TEXT[],
  location_city VARCHAR,
  location_region VARCHAR,
  location_country VARCHAR DEFAULT 'CA',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  published_at TIMESTAMPTZ,
  sold_at TIMESTAMPTZ,
  view_count INTEGER DEFAULT 0,
  inquiry_count INTEGER DEFAULT 0,
  -- Marketplace mode specific fields
  running BOOLEAN,
  inspection_uploaded BOOLEAN DEFAULT false,
  inspection_file_url TEXT,
  issue_severity disclosure_severity DEFAULT NULL,
  estimated_fixes TEXT[],
  intended_use TEXT[],
  disclosure_acknowledged BOOLEAN DEFAULT false
);

CREATE INDEX idx_listings_dealer_id ON listings(dealer_id);
CREATE INDEX idx_listings_status ON listings(status);
CREATE INDEX idx_listings_marketplace_mode ON listings(marketplace_mode);
CREATE INDEX idx_listings_road_readiness_state ON listings(road_readiness_state);
CREATE INDEX idx_listings_market_lane ON listings(market_lane);
CREATE INDEX idx_listings_vin ON listings(vin);
CREATE INDEX idx_listings_carly_listing_id ON listings(carly_listing_id);
CREATE INDEX idx_listings_year_make_model ON listings(year, make, model);
CREATE INDEX idx_listings_created_at ON listings(created_at DESC);
CREATE INDEX idx_listings_price ON listings(price);
CREATE INDEX idx_listings_location ON listings(location_city, location_region);
CREATE INDEX idx_listings_running ON listings(running);
CREATE INDEX idx_listings_issue_severity ON listings(issue_severity);
CREATE INDEX idx_listings_inspection_uploaded ON listings(inspection_uploaded);

-- Conversations Table
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  dealer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  listing_id UUID REFERENCES listings(id) ON DELETE SET NULL,
  last_message_at TIMESTAMPTZ,
  last_message_preview TEXT,
  unread_count_buyer INTEGER DEFAULT 0,
  unread_count_dealer INTEGER DEFAULT 0,
  archived_by_buyer BOOLEAN DEFAULT false,
  archived_by_dealer BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_conversation UNIQUE(buyer_id, dealer_id, listing_id)
);

CREATE INDEX idx_conversations_buyer_id ON conversations(buyer_id);
CREATE INDEX idx_conversations_dealer_id ON conversations(dealer_id);
CREATE INDEX idx_conversations_listing_id ON conversations(listing_id);
CREATE INDEX idx_conversations_last_message_at ON conversations(last_message_at DESC);

-- Messages Table
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  attachments JSONB DEFAULT '[]'::jsonb,
  read_at TIMESTAMPTZ,
  status message_status DEFAULT 'sent',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_messages_sender_id ON messages(sender_id);
CREATE INDEX idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX idx_messages_status ON messages(status);

-- Appointments Table
CREATE TABLE appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  dealer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER DEFAULT 60,
  appointment_type VARCHAR DEFAULT 'test_drive',
  status appointment_status DEFAULT 'scheduled',
  buyer_notes TEXT,
  dealer_notes TEXT,
  cancellation_reason TEXT,
  confirmed_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_appointments_buyer_id ON appointments(buyer_id);
CREATE INDEX idx_appointments_dealer_id ON appointments(dealer_id);
CREATE INDEX idx_appointments_listing_id ON appointments(listing_id);
CREATE INDEX idx_appointments_scheduled_at ON appointments(scheduled_at);
CREATE INDEX idx_appointments_status ON appointments(status);

-- Dealer Applications Table
CREATE TABLE dealer_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR NOT NULL,
  contact_name VARCHAR NOT NULL,
  phone VARCHAR NOT NULL,
  dealership_name VARCHAR NOT NULL,
  dealership_type VARCHAR NOT NULL,
  address VARCHAR NOT NULL,
  city VARCHAR NOT NULL,
  region VARCHAR NOT NULL,
  country VARCHAR NOT NULL,
  timezone VARCHAR NOT NULL,
  preferred_contact_method VARCHAR,
  days_of_operation TEXT[],
  opening_time VARCHAR,
  closing_time VARCHAR,
  special_notes TEXT,
  website_url VARCHAR,
  instagram_url VARCHAR,
  facebook_url VARCHAR,
  tiktok_url VARCHAR,
  google_business_url VARCHAR,
  other_platforms TEXT,
  description TEXT,
  additional_info TEXT,
  status VARCHAR DEFAULT 'pending',
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_dealer_applications_pending_email 
  ON dealer_applications(email) 
  WHERE status = 'pending';

CREATE INDEX idx_dealer_applications_status ON dealer_applications(status);
CREATE INDEX idx_dealer_applications_email ON dealer_applications(email);
CREATE INDEX idx_dealer_applications_created_at ON dealer_applications(created_at DESC);

-- Team Invitations Table
CREATE TABLE team_invitations (
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

CREATE INDEX idx_team_invitations_token ON team_invitations(invitation_token);
CREATE INDEX idx_team_invitations_email ON team_invitations(email);
CREATE INDEX idx_team_invitations_dealership ON team_invitations(dealership_id);
CREATE INDEX idx_team_invitations_status ON team_invitations(status);

CREATE UNIQUE INDEX idx_team_invitations_unique 
  ON team_invitations(email, dealership_id) 
  WHERE status = 'pending';

-- Team Members Table
CREATE TABLE team_members (
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

CREATE INDEX idx_team_members_dealership ON team_members(dealership_id);
CREATE INDEX idx_team_members_user ON team_members(user_id);
CREATE INDEX idx_team_members_status ON team_members(status);

CREATE UNIQUE INDEX idx_team_members_unique 
  ON team_members(user_id, dealership_id);

-- User Preferences Table
CREATE TABLE user_preferences (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  budget_min INTEGER,
  budget_max INTEGER,
  preferred_body_types TEXT[] DEFAULT '{}',
  preferred_makes TEXT[] DEFAULT '{}',
  preferred_fuel_types TEXT[] DEFAULT '{}',
  mileage_tolerance TEXT DEFAULT 'flexible',
  vehicle_age_preference TEXT DEFAULT 'open',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Interactions Table
CREATE TABLE user_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  listing_id TEXT NOT NULL,
  interaction_type TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_user_interactions_user_id ON user_interactions(user_id);
CREATE INDEX idx_user_interactions_listing_id ON user_interactions(listing_id);
CREATE INDEX idx_user_interactions_type ON user_interactions(interaction_type);
CREATE INDEX idx_user_interactions_created_at ON user_interactions(created_at DESC);

-- User Hidden Patterns Table
CREATE TABLE user_hidden_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  make TEXT,
  body_type TEXT,
  fuel_type TEXT,
  penalty_weight DECIMAL(3,2) DEFAULT 0.05,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, make, body_type, fuel_type)
);

CREATE INDEX idx_user_hidden_patterns_user_id ON user_hidden_patterns(user_id);

-- Marketplace Mode Change Requests Table
CREATE TABLE marketplace_mode_change_requests (
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

CREATE INDEX idx_marketplace_mode_requests_listing ON marketplace_mode_change_requests(listing_id);
CREATE INDEX idx_marketplace_mode_requests_status ON marketplace_mode_change_requests(status);

-- =============================================================================
-- STEP 3: ROW LEVEL SECURITY POLICIES
-- =============================================================================

-- Profiles Table RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  USING ((auth.jwt() ->> 'role') = 'admin');

CREATE POLICY "Admins can update all profiles"
  ON profiles FOR UPDATE
  USING ((auth.jwt() ->> 'role') = 'admin');

-- Service role can insert profiles (for dealer approvals)
CREATE POLICY "Service role can insert profiles"
  ON profiles FOR INSERT
  WITH CHECK (true);

-- Dealers Table RLS
ALTER TABLE dealers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Dealers can view own record"
  ON dealers FOR SELECT
  USING (profile_id = auth.uid());

CREATE POLICY "Dealers can update own record"
  ON dealers FOR UPDATE
  USING (profile_id = auth.uid())
  WITH CHECK (profile_id = auth.uid());

CREATE POLICY "Admins can view all dealers"
  ON dealers FOR SELECT
  USING ((auth.jwt() ->> 'role') = 'admin');

CREATE POLICY "Admins can update all dealers"
  ON dealers FOR UPDATE
  USING ((auth.jwt() ->> 'role') = 'admin');

-- Listings Table RLS
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view active listings"
  ON listings FOR SELECT
  USING (status = 'active');

CREATE POLICY "Dealers can view own listings"
  ON listings FOR SELECT
  USING (dealer_id = auth.uid());

CREATE POLICY "Dealers can insert own listings"
  ON listings FOR INSERT
  WITH CHECK (dealer_id = auth.uid());

CREATE POLICY "Dealers can update own listings"
  ON listings FOR UPDATE
  USING (dealer_id = auth.uid())
  WITH CHECK (dealer_id = auth.uid());

CREATE POLICY "Admins can view all listings"
  ON listings FOR SELECT
  USING ((auth.jwt() ->> 'role') = 'admin');

CREATE POLICY "Admins can update all listings"
  ON listings FOR UPDATE
  USING ((auth.jwt() ->> 'role') = 'admin');

-- Conversations Table RLS
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants can view conversations"
  ON conversations FOR SELECT
  USING (buyer_id = auth.uid() OR dealer_id = auth.uid());

CREATE POLICY "Authenticated users can create conversations"
  ON conversations FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL 
    AND (buyer_id = auth.uid() OR dealer_id = auth.uid())
  );

CREATE POLICY "Participants can update conversations"
  ON conversations FOR UPDATE
  USING (buyer_id = auth.uid() OR dealer_id = auth.uid())
  WITH CHECK (buyer_id = auth.uid() OR dealer_id = auth.uid());

CREATE POLICY "Admins can view all conversations"
  ON conversations FOR SELECT
  USING ((auth.jwt() ->> 'role') = 'admin');

-- Messages Table RLS
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants can view messages"
  ON messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id
      AND (conversations.buyer_id = auth.uid() OR conversations.dealer_id = auth.uid())
    )
  );

CREATE POLICY "Participants can send messages"
  ON messages FOR INSERT
  WITH CHECK (
    sender_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id
      AND (conversations.buyer_id = auth.uid() OR conversations.dealer_id = auth.uid())
    )
  );

CREATE POLICY "Admins can view all messages"
  ON messages FOR SELECT
  USING ((auth.jwt() ->> 'role') = 'admin');

-- Appointments Table RLS
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants can view appointments"
  ON appointments FOR SELECT
  USING (buyer_id = auth.uid() OR dealer_id = auth.uid());

CREATE POLICY "Buyers can create appointments"
  ON appointments FOR INSERT
  WITH CHECK (buyer_id = auth.uid());

CREATE POLICY "Dealers can update appointments"
  ON appointments FOR UPDATE
  USING (dealer_id = auth.uid())
  WITH CHECK (dealer_id = auth.uid());

CREATE POLICY "Buyers can update appointment notes"
  ON appointments FOR UPDATE
  USING (buyer_id = auth.uid())
  WITH CHECK (buyer_id = auth.uid());

CREATE POLICY "Admins can view all appointments"
  ON appointments FOR SELECT
  USING ((auth.jwt() ->> 'role') = 'admin');

CREATE POLICY "Admins can update all appointments"
  ON appointments FOR UPDATE
  USING ((auth.jwt() ->> 'role') = 'admin');

-- Dealer Applications Table RLS
ALTER TABLE dealer_applications ENABLE ROW LEVEL SECURITY;

-- ✅ PUBLIC: Anyone can submit applications (anon-safe)
CREATE POLICY "Anyone can submit applications"
  ON dealer_applications FOR INSERT
  WITH CHECK (true);

-- ❌ NO SELECT/UPDATE/DELETE POLICIES
-- Admin operations MUST use service role via API routes
-- Service role bypasses RLS, so no admin policies needed

-- Team Invitations RLS
ALTER TABLE team_invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Dealers can view sent invitations"
  ON team_invitations FOR SELECT
  USING (invited_by = auth.uid());

CREATE POLICY "Dealers can create invitations"
  ON team_invitations FOR INSERT
  WITH CHECK (invited_by = auth.uid());

CREATE POLICY "Dealers can update sent invitations"
  ON team_invitations FOR UPDATE
  USING (invited_by = auth.uid());

-- Team Members RLS
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team members can view own membership"
  ON team_members FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Dealers can view team members"
  ON team_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM team_members tm2
      WHERE tm2.user_id = auth.uid()
      AND tm2.dealership_id = team_members.dealership_id
    )
  );

-- User Preferences RLS
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own preferences"
  ON user_preferences FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- User Interactions RLS
ALTER TABLE user_interactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own interactions"
  ON user_interactions FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- User Hidden Patterns RLS
ALTER TABLE user_hidden_patterns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own hidden patterns"
  ON user_hidden_patterns FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- =============================================================================
-- STEP 4: COMMENTS
-- =============================================================================

COMMENT ON TABLE dealer_applications IS 'Stores dealer application submissions - admin access via service role only';
COMMENT ON TABLE profiles IS 'User profiles extending auth.users';
COMMENT ON TABLE dealers IS 'Dealer-specific information';
COMMENT ON TABLE listings IS 'Canonical vehicle listings table';
COMMENT ON TABLE conversations IS 'Messaging conversations between buyers and dealers';
COMMENT ON TABLE messages IS 'Individual messages within conversations';
COMMENT ON TABLE appointments IS 'Test drive and viewing appointments';
COMMENT ON TABLE team_invitations IS 'Team member email invitations';
COMMENT ON TABLE team_members IS 'Dealership team members';
COMMENT ON TABLE user_preferences IS 'User vehicle preferences for personalization';
COMMENT ON TABLE user_interactions IS 'User interactions with listings';
COMMENT ON TABLE user_hidden_patterns IS 'Learned patterns from hidden vehicles';
COMMENT ON TABLE marketplace_mode_change_requests IS 'Requests to change marketplace classification';

-- =============================================================================
-- END OF SCHEMA
-- =============================================================================
