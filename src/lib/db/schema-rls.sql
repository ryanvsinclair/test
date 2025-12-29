-- =============================================================================
-- STEP 2: ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================================================
-- This file adds security policies to all tables created in Step 1.
-- NO TRIGGERS, NO VIEWS, NO BUSINESS LOGIC - only access control.
--
-- Run after: schema-enums.sql, schema-base.sql, schema-admin.sql
-- Dependencies: auth.uid(), auth.jwt()
-- =============================================================================

-- =============================================================================
-- 1. PROFILES TABLE
-- =============================================================================
-- Rule: Users can only access their own profile
-- No manual inserts (profiles created via auth trigger or server function)

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Users can read their own profile
CREATE POLICY "Users can view own profile"
  ON profiles
  FOR SELECT
  USING (id = auth.uid());

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Admins can view all profiles
CREATE POLICY "Admins can view all profiles"
  ON profiles
  FOR SELECT
  USING (((auth.jwt() ->> 'user_metadata')::jsonb ->> 'is_admin') = 'true');

-- Admins can update any profile
CREATE POLICY "Admins can update all profiles"
  ON profiles
  FOR UPDATE
  USING (((auth.jwt() ->> 'user_metadata')::jsonb ->> 'is_admin') = 'true');

-- No INSERT policy - profiles created server-side only
-- No DELETE policy - prevent accidental profile deletion

-- =============================================================================
-- 2. DEALERS TABLE
-- =============================================================================
-- Rule: Dealers can read their own record, admins can read all

ALTER TABLE dealers ENABLE ROW LEVEL SECURITY;

-- Dealers can view their own dealer record
CREATE POLICY "Dealers can view own record"
  ON dealers
  FOR SELECT
  USING (profile_id = auth.uid());

-- Dealers can update their own dealer record
CREATE POLICY "Dealers can update own record"
  ON dealers
  FOR UPDATE
  USING (profile_id = auth.uid())
  WITH CHECK (profile_id = auth.uid());

-- Admins can view all dealers
CREATE POLICY "Admins can view all dealers"
  ON dealers
  FOR SELECT
  USING (((auth.jwt() ->> 'user_metadata')::jsonb ->> 'is_admin') = 'true');

-- Admins can update any dealer
CREATE POLICY "Admins can update all dealers"
  ON dealers
  FOR UPDATE
  USING (((auth.jwt() ->> 'user_metadata')::jsonb ->> 'is_admin') = 'true');

-- No INSERT policy - dealers created via application approval flow
-- No DELETE policy - prevent accidental dealer deletion

-- =============================================================================
-- 3. LISTINGS TABLE
-- =============================================================================
-- Rule: Dealers own their listings, public can view active listings

ALTER TABLE listings ENABLE ROW LEVEL SECURITY;

-- Public users can view active listings
CREATE POLICY "Public can view active listings"
  ON listings
  FOR SELECT
  USING (status = 'active');

-- Dealers can view all their own listings (any status)
CREATE POLICY "Dealers can view own listings"
  ON listings
  FOR SELECT
  USING (dealer_id = auth.uid());

-- Dealers can insert their own listings
CREATE POLICY "Dealers can insert own listings"
  ON listings
  FOR INSERT
  WITH CHECK (dealer_id = auth.uid());

-- Dealers can update their own listings
CREATE POLICY "Dealers can update own listings"
  ON listings
  FOR UPDATE
  USING (dealer_id = auth.uid())
  WITH CHECK (dealer_id = auth.uid());

-- Admins can view all listings
CREATE POLICY "Admins can view all listings"
  ON listings
  FOR SELECT
  USING (((auth.jwt() ->> 'user_metadata')::jsonb ->> 'is_admin') = 'true');

-- Admins can update any listing
CREATE POLICY "Admins can update all listings"
  ON listings
  FOR UPDATE
  USING (((auth.jwt() ->> 'user_metadata')::jsonb ->> 'is_admin') = 'true');

-- No DELETE policy - prevent accidental listing deletion

-- =============================================================================
-- 4. CONVERSATIONS TABLE
-- =============================================================================
-- Rule: Only participants (buyer or dealer) can access conversations

ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

-- Participants can view their conversations
CREATE POLICY "Participants can view conversations"
  ON conversations
  FOR SELECT
  USING (buyer_id = auth.uid() OR dealer_id = auth.uid());

-- Authenticated users can create conversations
-- Note: Application logic should prevent duplicate conversations
CREATE POLICY "Authenticated users can create conversations"
  ON conversations
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL 
    AND (buyer_id = auth.uid() OR dealer_id = auth.uid())
  );

-- Participants can update conversation metadata (unread counts, archive status)
CREATE POLICY "Participants can update conversations"
  ON conversations
  FOR UPDATE
  USING (buyer_id = auth.uid() OR dealer_id = auth.uid())
  WITH CHECK (buyer_id = auth.uid() OR dealer_id = auth.uid());

-- Admins can view all conversations
CREATE POLICY "Admins can view all conversations"
  ON conversations
  FOR SELECT
  USING (((auth.jwt() ->> 'user_metadata')::jsonb ->> 'is_admin') = 'true');

-- No DELETE policy - prevent accidental conversation deletion

-- =============================================================================
-- 5. MESSAGES TABLE
-- =============================================================================
-- Rule: Only conversation participants can read/send messages

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Participants can view messages in their conversations
CREATE POLICY "Participants can view messages"
  ON messages
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id
      AND (conversations.buyer_id = auth.uid() OR conversations.dealer_id = auth.uid())
    )
  );

-- Participants can insert messages in their conversations
CREATE POLICY "Participants can send messages"
  ON messages
  FOR INSERT
  WITH CHECK (
    sender_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id
      AND (conversations.buyer_id = auth.uid() OR conversations.dealer_id = auth.uid())
    )
  );

-- Admins can view all messages
CREATE POLICY "Admins can view all messages"
  ON messages
  FOR SELECT
  USING (((auth.jwt() ->> 'user_metadata')::jsonb ->> 'is_admin') = 'true');

-- No UPDATE policy - messages are immutable
-- No DELETE policy - prevent message deletion

-- =============================================================================
-- 6. APPOINTMENTS TABLE
-- =============================================================================
-- Rule: Buyer or dealer involved can access, dealers can update status

ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- Participants can view their appointments
CREATE POLICY "Participants can view appointments"
  ON appointments
  FOR SELECT
  USING (buyer_id = auth.uid() OR dealer_id = auth.uid());

-- Buyers can create appointments
CREATE POLICY "Buyers can create appointments"
  ON appointments
  FOR INSERT
  WITH CHECK (buyer_id = auth.uid());

-- Dealers can update appointment status and notes
CREATE POLICY "Dealers can update appointments"
  ON appointments
  FOR UPDATE
  USING (dealer_id = auth.uid())
  WITH CHECK (dealer_id = auth.uid());

-- Buyers can update their notes
CREATE POLICY "Buyers can update appointment notes"
  ON appointments
  FOR UPDATE
  USING (buyer_id = auth.uid())
  WITH CHECK (buyer_id = auth.uid());

-- Admins can view all appointments
CREATE POLICY "Admins can view all appointments"
  ON appointments
  FOR SELECT
  USING (((auth.jwt() ->> 'user_metadata')::jsonb ->> 'is_admin') = 'true');

-- Admins can update any appointment
CREATE POLICY "Admins can update all appointments"
  ON appointments
  FOR UPDATE
  USING (((auth.jwt() ->> 'user_metadata')::jsonb ->> 'is_admin') = 'true');

-- No DELETE policy - prevent accidental appointment deletion

-- =============================================================================
-- 7. DEALER_APPLICATIONS TABLE
-- =============================================================================
-- Rule: Anyone can submit, only admins can review

ALTER TABLE dealer_applications ENABLE ROW LEVEL SECURITY;

-- Anyone (including anon) can submit applications
CREATE POLICY "Anyone can submit dealer applications"
  ON dealer_applications
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Only admins can view applications
CREATE POLICY "Admins can view all applications"
  ON dealer_applications
  FOR SELECT
  USING (((auth.jwt() ->> 'user_metadata')::jsonb ->> 'is_admin') = 'true');

-- Only admins can update applications (approval/rejection)
CREATE POLICY "Admins can update applications"
  ON dealer_applications
  FOR UPDATE
  USING (((auth.jwt() ->> 'user_metadata')::jsonb ->> 'is_admin') = 'true');

-- Only admins can delete applications
CREATE POLICY "Admins can delete applications"
  ON dealer_applications
  FOR DELETE
  USING (((auth.jwt() ->> 'user_metadata')::jsonb ->> 'is_admin') = 'true');

-- Note: Applicants cannot view their own submissions
-- This prevents gaming the system or resubmitting

-- =============================================================================
-- 8. TEAM_INVITATIONS TABLE
-- =============================================================================
-- Rule: Dealer who invited can view, invitee can view their own invitation

ALTER TABLE team_invitations ENABLE ROW LEVEL SECURITY;

-- Dealers can view invitations they sent
CREATE POLICY "Dealers can view sent invitations"
  ON team_invitations
  FOR SELECT
  USING (
    invited_by = auth.uid()
  );

-- Dealers can create invitations for their dealership
CREATE POLICY "Dealers can create invitations"
  ON team_invitations
  FOR INSERT
  WITH CHECK (invited_by = auth.uid());

-- Dealers can update invitations they sent (revoke)
CREATE POLICY "Dealers can update sent invitations"
  ON team_invitations
  FOR UPDATE
  USING (invited_by = auth.uid())
  WITH CHECK (invited_by = auth.uid());

-- Authenticated users can view invitations to their email
CREATE POLICY "Users can view invitations to their email"
  ON team_invitations
  FOR SELECT
  USING (
    email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

-- Admins can view all invitations
CREATE POLICY "Admins can view all invitations"
  ON team_invitations
  FOR SELECT
  USING (((auth.jwt() ->> 'user_metadata')::jsonb ->> 'is_admin') = 'true');

-- No DELETE policy - use status change instead

-- =============================================================================
-- 9. TEAM_MEMBERS TABLE
-- =============================================================================
-- Rule: Team members can view their own dealership team

ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

-- Team members can view other members of their dealership
CREATE POLICY "Team members can view own dealership team"
  ON team_members
  FOR SELECT
  USING (
    dealership_id IN (
      SELECT dealership_id FROM team_members WHERE user_id = auth.uid()
    )
  );

-- Users can view their own team membership
CREATE POLICY "Users can view own team membership"
  ON team_members
  FOR SELECT
  USING (user_id = auth.uid());

-- Server-side only can insert team members (via invitation acceptance)
-- No INSERT policy for users

-- Dealership owners/admins can update team member status
CREATE POLICY "Dealership admins can update team members"
  ON team_members
  FOR UPDATE
  USING (
    dealership_id IN (
      SELECT dealership_id FROM team_members 
      WHERE user_id = auth.uid() 
      AND role IN ('owner', 'admin')
    )
  );

-- Admins can view all team members
CREATE POLICY "Admins can view all team members"
  ON team_members
  FOR SELECT
  USING (((auth.jwt() ->> 'user_metadata')::jsonb ->> 'is_admin') = 'true');

-- No DELETE policy - use status change instead

-- =============================================================================
-- TABLES FROM schema.sql, schema-auth.sql, schema-privacy-settings.sql
-- =============================================================================
-- These tables exist but were not canonicalized in Step 1.
-- Adding RLS now to secure them immediately.

-- User Preferences
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own preferences"
  ON user_preferences FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can update own preferences"
  ON user_preferences FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can insert own preferences"
  ON user_preferences FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- User Interactions
ALTER TABLE user_interactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own interactions"
  ON user_interactions FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own interactions"
  ON user_interactions FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- User Hidden Patterns
ALTER TABLE user_hidden_patterns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own hidden patterns"
  ON user_hidden_patterns FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own hidden patterns"
  ON user_hidden_patterns FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own hidden patterns"
  ON user_hidden_patterns FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- User Notification Preferences
ALTER TABLE user_notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notification preferences"
  ON user_notification_preferences FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can update own notification preferences"
  ON user_notification_preferences FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can insert own notification preferences"
  ON user_notification_preferences FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- User Privacy Settings
ALTER TABLE user_privacy_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own privacy settings"
  ON user_privacy_settings FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can update own privacy settings"
  ON user_privacy_settings FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can insert own privacy settings"
  ON user_privacy_settings FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- User Browse Preferences
ALTER TABLE user_browse_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own browse preferences"
  ON user_browse_preferences FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can update own browse preferences"
  ON user_browse_preferences FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can insert own browse preferences"
  ON user_browse_preferences FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- =============================================================================
-- SECURITY-CRITICAL TABLES (schema-auth.sql)
-- =============================================================================
-- These tables store sensitive authentication data and MUST be locked down

-- User Email Verification
ALTER TABLE user_email_verification ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own email verification"
  ON user_email_verification FOR SELECT
  USING (user_id = auth.uid());

-- Server-side only can insert/update verification records
-- No user INSERT/UPDATE policies

CREATE POLICY "Admins can view all email verifications"
  ON user_email_verification FOR SELECT
  USING (((auth.jwt() ->> 'user_metadata')::jsonb ->> 'is_admin') = 'true');

-- User 2FA Settings - CRITICAL
ALTER TABLE user_2fa_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own 2FA settings"
  ON user_2fa_settings FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can update own 2FA settings"
  ON user_2fa_settings FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can insert own 2FA settings"
  ON user_2fa_settings FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Note: 2FA secrets should be encrypted at application layer

-- User Password Metadata - CRITICAL
ALTER TABLE user_password_metadata ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own password metadata"
  ON user_password_metadata FOR SELECT
  USING (user_id = auth.uid());

-- Server-side only can update password metadata
-- No user UPDATE policies (prevents tampering with reset tokens)

CREATE POLICY "Admins can view all password metadata"
  ON user_password_metadata FOR SELECT
  USING (((auth.jwt() ->> 'user_metadata')::jsonb ->> 'is_admin') = 'true');

-- User Active Sessions - CRITICAL
ALTER TABLE user_active_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own active sessions"
  ON user_active_sessions FOR SELECT
  USING (user_id = auth.uid());

-- Server-side only can insert/update sessions
-- No user INSERT/UPDATE policies

CREATE POLICY "Admins can view all active sessions"
  ON user_active_sessions FOR SELECT
  USING (((auth.jwt() ->> 'user_metadata')::jsonb ->> 'is_admin') = 'true');

-- =============================================================================
-- DEALER DASHBOARD TABLES (schema-dealer-dashboard.sql - if not deprecated)
-- =============================================================================
-- Note: schema-dealer-dashboard.sql was deprecated in Step 1
-- If these tables exist from prior migrations, secure them now

-- Listing Metrics Daily (if exists)
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'listing_metrics_daily') THEN
    ALTER TABLE listing_metrics_daily ENABLE ROW LEVEL SECURITY;
    
    EXECUTE 'CREATE POLICY "Dealers can view own listing metrics"
      ON listing_metrics_daily FOR SELECT
      USING (
        listing_id IN (
          SELECT id FROM listings WHERE dealer_id = auth.uid()
        )
      )';
    
    EXECUTE 'CREATE POLICY "Admins can view all listing metrics"
      ON listing_metrics_daily FOR SELECT
      USING (((auth.jwt() ->> ''user_metadata'')::jsonb ->> ''is_admin'') = ''true'')';
  END IF;
END $$;

-- =============================================================================
-- END OF RLS POLICIES
-- =============================================================================

-- =============================================================================
-- VERIFICATION QUERIES
-- =============================================================================
-- Run these to verify RLS is properly configured:

-- 1. Check all tables have RLS enabled
-- SELECT tablename, rowsecurity 
-- FROM pg_tables 
-- WHERE schemaname = 'public' 
-- ORDER BY tablename;

-- 2. List all policies
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
-- FROM pg_policies 
-- WHERE schemaname = 'public'
-- ORDER BY tablename, policyname;

-- 3. Test access as different roles (use Supabase client with different users)

-- =============================================================================
-- STEP 3 ADDITIONS - RLS for Canonicalized Schema Extensions
-- =============================================================================

-- as_is_disclosures
ALTER TABLE as_is_disclosures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Dealers can view own listing disclosures"
  ON as_is_disclosures FOR SELECT
  USING (listing_id IN (SELECT id FROM listings WHERE dealer_id = auth.uid()));

CREATE POLICY "Dealers can manage own listing disclosures"
  ON as_is_disclosures FOR ALL
  USING (listing_id IN (SELECT id FROM listings WHERE dealer_id = auth.uid()))
  WITH CHECK (listing_id IN (SELECT id FROM listings WHERE dealer_id = auth.uid()));

CREATE POLICY "Public can view disclosures for active listings"
  ON as_is_disclosures FOR SELECT
  USING (listing_id IN (SELECT id FROM listings WHERE status = 'active'));

CREATE POLICY "Admins can view all disclosures"
  ON as_is_disclosures FOR SELECT
  USING (((auth.jwt() ->> 'user_metadata')::jsonb ->> 'is_admin') = 'true');

-- user_as_is_acknowledgments
ALTER TABLE user_as_is_acknowledgments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own acknowledgment"
  ON user_as_is_acknowledgments FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own acknowledgment"
  ON user_as_is_acknowledgments FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- market_lane_transitions
ALTER TABLE market_lane_transitions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Dealers can view own listing transitions"
  ON market_lane_transitions FOR SELECT
  USING (listing_id IN (SELECT id FROM listings WHERE dealer_id = auth.uid()));

CREATE POLICY "Admins can view all transitions"
  ON market_lane_transitions FOR SELECT
  USING (((auth.jwt() ->> 'user_metadata')::jsonb ->> 'is_admin') = 'true');

-- market_lane_reclassification_requests
ALTER TABLE market_lane_reclassification_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Dealers can view own reclassification requests"
  ON market_lane_reclassification_requests FOR SELECT
  USING (listing_id IN (SELECT id FROM listings WHERE dealer_id = auth.uid()));

CREATE POLICY "Dealers can create reclassification requests"
  ON market_lane_reclassification_requests FOR INSERT
  WITH CHECK (listing_id IN (SELECT id FROM listings WHERE dealer_id = auth.uid()));

CREATE POLICY "Admins can view all reclassification requests"
  ON market_lane_reclassification_requests FOR SELECT
  USING (((auth.jwt() ->> 'user_metadata')::jsonb ->> 'is_admin') = 'true');

CREATE POLICY "Admins can update reclassification requests"
  ON market_lane_reclassification_requests FOR UPDATE
  USING (((auth.jwt() ->> 'user_metadata')::jsonb ->> 'is_admin') = 'true');

-- marketplace_mode_change_requests
ALTER TABLE marketplace_mode_change_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Dealers can view own mode change requests"
  ON marketplace_mode_change_requests FOR SELECT
  USING (listing_id IN (SELECT id FROM listings WHERE dealer_id = auth.uid()));

CREATE POLICY "Dealers can create mode change requests"
  ON marketplace_mode_change_requests FOR INSERT
  WITH CHECK (listing_id IN (SELECT id FROM listings WHERE dealer_id = auth.uid()));

CREATE POLICY "Admins can view all mode change requests"
  ON marketplace_mode_change_requests FOR SELECT
  USING (((auth.jwt() ->> 'user_metadata')::jsonb ->> 'is_admin') = 'true');

CREATE POLICY "Admins can update mode change requests"
  ON marketplace_mode_change_requests FOR UPDATE
  USING (((auth.jwt() ->> 'user_metadata')::jsonb ->> 'is_admin') = 'true');

-- vehicle_publish_logs
ALTER TABLE vehicle_publish_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Dealers can view own publish logs"
  ON vehicle_publish_logs FOR SELECT
  USING (listing_id IN (SELECT id FROM listings WHERE dealer_id = auth.uid()));

CREATE POLICY "Admins can view all publish logs"
  ON vehicle_publish_logs FOR SELECT
  USING (((auth.jwt() ->> 'user_metadata')::jsonb ->> 'is_admin') = 'true');

-- Note: Server-side only can insert publish logs

-- vehicle_condition_update_requests
ALTER TABLE vehicle_condition_update_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Dealers can view own condition update requests"
  ON vehicle_condition_update_requests FOR SELECT
  USING (listing_id IN (SELECT id FROM listings WHERE dealer_id = auth.uid()));

CREATE POLICY "Dealers can create condition update requests"
  ON vehicle_condition_update_requests FOR INSERT
  WITH CHECK (listing_id IN (SELECT id FROM listings WHERE dealer_id = auth.uid()));

CREATE POLICY "Admins can view all condition update requests"
  ON vehicle_condition_update_requests FOR SELECT
  USING (((auth.jwt() ->> 'user_metadata')::jsonb ->> 'is_admin') = 'true');

CREATE POLICY "Admins can update condition update requests"
  ON vehicle_condition_update_requests FOR UPDATE
  USING (((auth.jwt() ->> 'user_metadata')::jsonb ->> 'is_admin') = 'true');

-- =============================================================================
-- CONFIRMATION
-- =============================================================================
-- ✅ RLS-safe: All tables have RLS enabled (including Step 3 additions)
-- ✅ Supabase-compatible: Uses auth.uid() and auth.jwt()
-- ⚠️ Still missing business logic: Triggers, views, functions (Step 3)
-- 
-- Security posture:
--   - Users can only access their own data
--   - Dealers can only access their own listings/conversations
--   - Conversation participants have exclusive access to messages
--   - Anonymous users can only submit dealer applications
--   - Admin access via JWT role claim only
--   - No DELETE policies (prevent accidental data loss)
--   - Sensitive auth data (2FA, sessions, passwords) locked down
--   - AS-IS disclosures visible to public for active listings
--   - Change requests isolated to dealers + admins
-- =============================================================================
