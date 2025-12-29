-- =============================================================================
-- FIX: "column status does not exist" error
-- =============================================================================
-- This script cleans up partial deployments and starts fresh
-- Run this in Supabase SQL Editor, then re-run schema files in order
-- =============================================================================

-- Drop all tables (if they exist)
DROP TABLE IF EXISTS team_members CASCADE;
DROP TABLE IF EXISTS team_invitations CASCADE;
DROP TABLE IF EXISTS dealer_applications CASCADE;
DROP TABLE IF EXISTS appointments CASCADE;
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS conversations CASCADE;
DROP TABLE IF EXISTS listings CASCADE;
DROP TABLE IF EXISTS dealers CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- Drop all custom types (if they exist)
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
-- NOW RE-RUN THE SCHEMA FILES IN ORDER:
-- =============================================================================
-- 1. Copy/paste content from src/lib/db/schema-enums.sql
-- 2. Copy/paste content from src/lib/db/schema-base.sql
-- 3. Continue with remaining schema files
-- =============================================================================
