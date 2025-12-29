-- =============================================================================
-- DEPRECATED - DO NOT USE
-- =============================================================================
-- This file created a conflicting users table with password_hash that bypasses
-- Supabase authentication. 
--
-- REPLACEMENT: Use schema-base.sql which provides:
--   - profiles table (extends Supabase auth.users)
--   - dealers table (dealer-specific data)
--   - listings table (vehicle listings)
--   - conversations table (messaging)
--   - messages table (message content)
--   - appointments table (test drives)
--
-- THIS FILE WILL BE DELETED IN STEP 2
-- =============================================================================

-- ALL CONTENT COMMENTED OUT TO PREVENT EXECUTION

/*
-- Database Schema for Dealer Dashboard
-- AWS RDS PostgreSQL

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name VARCHAR(255),
  role VARCHAR(20) NOT NULL CHECK (role IN ('buyer', 'dealer')),
  verified BOOLEAN DEFAULT FALSE,
  dealer_status VARCHAR(20) CHECK (dealer_status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Conversations table
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dealer_id UUID NOT NULL REFERENCES users(id),
  buyer_id UUID NOT NULL REFERENCES users(id),
  listing_id UUID,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'closed')),
  unread_count INTEGER DEFAULT 0,
  last_message_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Messages table
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES users(id),
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Appointments table
CREATE TABLE IF NOT EXISTS appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dealer_id UUID NOT NULL REFERENCES users(id),
  buyer_id UUID NOT NULL REFERENCES users(id),
  listing_id UUID,
  scheduled_at TIMESTAMP NOT NULL,
  status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'cancelled', 'completed')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Listings table
CREATE TABLE IF NOT EXISTS listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dealer_id UUID NOT NULL REFERENCES users(id),
  vin VARCHAR(17),
  year INTEGER NOT NULL,
  make VARCHAR(100) NOT NULL,
  model VARCHAR(100) NOT NULL,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'sold', 'deleted')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Daily metrics aggregation table
CREATE TABLE IF NOT EXISTS listing_metrics_daily (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dealer_id UUID NOT NULL REFERENCES users(id),
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  views INTEGER DEFAULT 0,
  saves INTEGER DEFAULT 0,
  messages INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(listing_id, date)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_conversations_dealer_response 
  ON conversations(dealer_id, unread_count, last_message_at DESC);

CREATE INDEX IF NOT EXISTS idx_conversations_dealer_activity 
  ON conversations(dealer_id, status, last_message_at DESC);

CREATE INDEX IF NOT EXISTS idx_messages_conversation 
  ON messages(conversation_id, created_at DESC);

-- END OF COMMENTED OUT CONTENT
*/

CREATE INDEX IF NOT EXISTS idx_appointments_dealer_scheduled 
  ON appointments(dealer_id, scheduled_at, status);

CREATE INDEX IF NOT EXISTS idx_listings_dealer_status 
  ON listings(dealer_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_metrics_dealer_date 
  ON listing_metrics_daily(dealer_id, date DESC);

CREATE INDEX IF NOT EXISTS idx_metrics_engagement 
  ON listing_metrics_daily(dealer_id, date, views, saves, messages);

-- Comments for documentation
COMMENT ON TABLE users IS 'User accounts for buyers and dealers';
COMMENT ON TABLE conversations IS 'Message threads between buyers and dealers';
COMMENT ON TABLE listing_metrics_daily IS 'Daily aggregated metrics per listing for dashboard performance';

COMMENT ON INDEX idx_conversations_dealer_response IS 'Optimizes "Needs Attention" query';
COMMENT ON INDEX idx_metrics_engagement IS 'Optimizes "Hot Listings" query';
