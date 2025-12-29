-- =============================================================================
-- ENUM TYPE DEFINITIONS
-- =============================================================================
-- This file defines all enum types used across the database schemas.
-- Created during Step 1: Database Foundation & Canonicalization
-- =============================================================================

-- Marketplace Mode: Defines the type of marketplace listing
CREATE TYPE marketplace_mode AS ENUM (
  'carly_verified',
  'the_hub',
  'builders_market'
);

-- Road Readiness State: Vehicle condition classification
CREATE TYPE road_readiness_state AS ENUM (
  'ready_to_go',
  'needs_attention',
  'major_repairs',
  'as_is'
);

-- Vehicle State: Lifecycle state of a listing
CREATE TYPE vehicle_state AS ENUM (
  'draft',
  'active',
  'sold',
  'deleted',
  'new_inventory',
  'pending_approval'
);

-- Dealer Status: Dealer account status
CREATE TYPE dealer_status AS ENUM (
  'pending',
  'approved',
  'active',
  'suspended',
  'rejected'
);

-- User Role: System-wide user role
CREATE TYPE user_role AS ENUM (
  'buyer',
  'dealer',
  'admin'
);

-- Application Status: For dealer applications
CREATE TYPE application_status AS ENUM (
  'pending',
  'approved',
  'rejected'
);

-- Appointment Status
CREATE TYPE appointment_status AS ENUM (
  'scheduled',
  'confirmed',
  'completed',
  'cancelled',
  'no_show'
);

-- Message Status
CREATE TYPE message_status AS ENUM (
  'sent',
  'delivered',
  'read'
);

-- Disclosure Severity
CREATE TYPE disclosure_severity AS ENUM (
  'minor',
  'moderate',
  'major',
  'critical'
);
