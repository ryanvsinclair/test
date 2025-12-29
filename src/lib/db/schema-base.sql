-- =============================================================================
-- BASE SCHEMA - CANONICAL CORE TABLES
-- =============================================================================
-- This file defines the foundational tables required by all other schemas.
-- Created during Step 1: Database Foundation & Canonicalization
--
-- IMPORTANT: This file must be run BEFORE all other schema files.
-- Dependencies: schema-enums.sql (run first)
--
-- Tables defined here:
--   1. profiles (extends auth.users)
--   2. dealers (dealer-specific data)
--   3. listings (canonical vehicle listings table)
--   4. conversations (messaging foundation)
--   5. messages (message content)
--   6. appointments (test drive appointments)
--
-- NO RLS POLICIES, TRIGGERS, OR VIEWS in this file - added in later steps.
-- =============================================================================

-- =============================================================================
-- 1. PROFILES TABLE
-- =============================================================================
-- Extends Supabase auth.users with application-specific user data
-- This is the canonical user table referenced throughout the application

CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR NOT NULL,
  name VARCHAR,
  phone VARCHAR,
  role user_role DEFAULT 'buyer',
  dealer_status dealer_status,
  verified BOOLEAN DEFAULT false,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_dealer_status ON profiles(dealer_status);

-- =============================================================================
-- 2. DEALERS TABLE
-- =============================================================================
-- Dealer-specific information linked to profiles where role = 'dealer'

CREATE TABLE IF NOT EXISTS dealers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Business Information
  dealership_name VARCHAR NOT NULL,
  dealership_type VARCHAR,
  address VARCHAR,
  city VARCHAR,
  region VARCHAR,
  country VARCHAR DEFAULT 'CA',
  timezone VARCHAR DEFAULT 'America/Toronto',
  
  -- Contact Information
  website_url VARCHAR,
  instagram_url VARCHAR,
  facebook_url VARCHAR,
  tiktok_url VARCHAR,
  google_business_url VARCHAR,
  
  -- Business Hours
  days_of_operation TEXT[],
  opening_time VARCHAR,
  closing_time VARCHAR,
  
  -- Description
  description TEXT,
  special_notes TEXT,
  
  -- Status
  status dealer_status DEFAULT 'pending',
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT unique_dealer_profile UNIQUE(profile_id)
);

CREATE INDEX IF NOT EXISTS idx_dealers_profile_id ON dealers(profile_id);
CREATE INDEX IF NOT EXISTS idx_dealers_status ON dealers(status);
CREATE INDEX IF NOT EXISTS idx_dealers_city_region ON dealers(city, region);

-- =============================================================================
-- 3. LISTINGS TABLE (CANONICAL)
-- =============================================================================
-- Single source of truth for all vehicle listings
-- Previously scattered across: vehicle_listings, listings, vehicles

CREATE TABLE IF NOT EXISTS listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Ownership
  dealer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Listing Identification (added by schema-listing-identification.sql)
  carly_listing_id VARCHAR UNIQUE,
  legacy_listing_id VARCHAR,
  
  -- Vehicle Information
  vin VARCHAR(17),
  year INTEGER,
  make VARCHAR,
  model VARCHAR,
  trim VARCHAR,
  body_style VARCHAR,
  
  -- Pricing
  price DECIMAL(10, 2),
  original_price DECIMAL(10, 2),
  
  -- Mileage
  mileage INTEGER,
  mileage_unit VARCHAR DEFAULT 'km',
  
  -- Condition
  condition VARCHAR,
  
  -- Marketplace Classification (added by schema-marketplace-modes.sql)
  marketplace_mode marketplace_mode,
  assigned_marketplace_mode marketplace_mode,
  
  -- Road Readiness (added by schema-road-readiness.sql)
  road_readiness_state road_readiness_state,
  assigned_road_readiness_state road_readiness_state,
  
  -- Market Lane (added by schema-market-lanes.sql)
  market_lane VARCHAR,
  assigned_market_lane VARCHAR,
  
  -- Status
  status vehicle_state DEFAULT 'draft',
  
  -- Media
  images JSONB DEFAULT '[]'::jsonb,
  primary_image_url VARCHAR,
  
  -- Description
  title VARCHAR,
  description TEXT,
  features TEXT[],
  
  -- Location
  location_city VARCHAR,
  location_region VARCHAR,
  location_country VARCHAR DEFAULT 'CA',
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  published_at TIMESTAMPTZ,
  sold_at TIMESTAMPTZ,
  
  -- View/Engagement Tracking
  view_count INTEGER DEFAULT 0,
  inquiry_count INTEGER DEFAULT 0
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_listings_dealer_id ON listings(dealer_id);
CREATE INDEX IF NOT EXISTS idx_listings_status ON listings(status);
CREATE INDEX IF NOT EXISTS idx_listings_marketplace_mode ON listings(marketplace_mode);
CREATE INDEX IF NOT EXISTS idx_listings_road_readiness_state ON listings(road_readiness_state);
CREATE INDEX IF NOT EXISTS idx_listings_market_lane ON listings(market_lane);
CREATE INDEX IF NOT EXISTS idx_listings_vin ON listings(vin);
CREATE INDEX IF NOT EXISTS idx_listings_carly_listing_id ON listings(carly_listing_id);
CREATE INDEX IF NOT EXISTS idx_listings_year_make_model ON listings(year, make, model);
CREATE INDEX IF NOT EXISTS idx_listings_created_at ON listings(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_listings_price ON listings(price);
CREATE INDEX IF NOT EXISTS idx_listings_location ON listings(location_city, location_region);

-- =============================================================================
-- 4. CONVERSATIONS TABLE
-- =============================================================================
-- Messaging between buyers and dealers

CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Participants
  buyer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  dealer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  listing_id UUID REFERENCES listings(id) ON DELETE SET NULL,
  
  -- Message tracking
  last_message_at TIMESTAMPTZ,
  last_message_preview TEXT,
  
  -- Unread counts
  unread_count_buyer INTEGER DEFAULT 0,
  unread_count_dealer INTEGER DEFAULT 0,
  
  -- Status
  archived_by_buyer BOOLEAN DEFAULT false,
  archived_by_dealer BOOLEAN DEFAULT false,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT unique_conversation UNIQUE(buyer_id, dealer_id, listing_id)
);

CREATE INDEX IF NOT EXISTS idx_conversations_buyer_id ON conversations(buyer_id);
CREATE INDEX IF NOT EXISTS idx_conversations_dealer_id ON conversations(dealer_id);
CREATE INDEX IF NOT EXISTS idx_conversations_listing_id ON conversations(listing_id);
CREATE INDEX IF NOT EXISTS idx_conversations_last_message_at ON conversations(last_message_at DESC);

-- =============================================================================
-- 5. MESSAGES TABLE
-- =============================================================================
-- Individual messages within conversations

CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relationships
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Content
  content TEXT NOT NULL,
  attachments JSONB DEFAULT '[]'::jsonb,
  
  -- Status
  read_at TIMESTAMPTZ,
  status message_status DEFAULT 'sent',
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_status ON messages(status);

-- =============================================================================
-- 6. APPOINTMENTS TABLE
-- =============================================================================
-- Test drive and viewing appointments

CREATE TABLE IF NOT EXISTS appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Participants
  buyer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  dealer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  
  -- Appointment Details
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER DEFAULT 60,
  appointment_type VARCHAR DEFAULT 'test_drive',
  
  -- Status
  status appointment_status DEFAULT 'scheduled',
  
  -- Notes
  buyer_notes TEXT,
  dealer_notes TEXT,
  cancellation_reason TEXT,
  
  -- Confirmation
  confirmed_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_appointments_buyer_id ON appointments(buyer_id);
CREATE INDEX IF NOT EXISTS idx_appointments_dealer_id ON appointments(dealer_id);
CREATE INDEX IF NOT EXISTS idx_appointments_listing_id ON appointments(listing_id);
CREATE INDEX IF NOT EXISTS idx_appointments_scheduled_at ON appointments(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);

-- =============================================================================
-- END OF BASE SCHEMA
-- =============================================================================
-- Next steps (separate files/migrations):
--   - Add RLS policies (schema-rls.sql)
--   - Add triggers (schema-triggers.sql)
--   - Add views (schema-views.sql)
--   - Add functions (schema-functions.sql)
-- =============================================================================
