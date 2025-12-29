-- =============================================================================
-- STEP 6: PERFORMANCE & CORRECTNESS OPTIMIZATIONS
-- =============================================================================
-- Safe performance improvements and data integrity constraints
-- Run after: All previous schema files
-- =============================================================================

-- =============================================================================
-- PART 1: PERFORMANCE INDEXES
-- =============================================================================

-- Messages: Conversation threading performance
-- Speeds up message retrieval and ordering within conversations
CREATE INDEX IF NOT EXISTS idx_messages_conversation_created 
ON messages(conversation_id, created_at DESC);

COMMENT ON INDEX idx_messages_conversation_created IS 
'Optimizes message thread queries - conversation_id + created_at ordering';

-- Conversations: Participant lookup performance
-- Speeds up "get my conversations" queries for buyers
CREATE INDEX IF NOT EXISTS idx_conversations_buyer_updated 
ON conversations(buyer_id, updated_at DESC);

COMMENT ON INDEX idx_conversations_buyer_updated IS 
'Optimizes buyer conversation list - buyer_id + updated_at ordering';

-- Conversations: Participant lookup performance
-- Speeds up "get my conversations" queries for dealers
CREATE INDEX IF NOT EXISTS idx_conversations_dealer_updated 
ON conversations(dealer_id, updated_at DESC);

COMMENT ON INDEX idx_conversations_dealer_updated IS 
'Optimizes dealer conversation list - dealer_id + updated_at ordering';

-- Appointments: Listing-based lookup
-- Speeds up "appointments for this listing" queries
CREATE INDEX IF NOT EXISTS idx_appointments_listing_scheduled 
ON appointments(listing_id, scheduled_at DESC);

COMMENT ON INDEX idx_appointments_listing_scheduled IS 
'Optimizes appointment queries by listing - listing_id + scheduled_at ordering';

-- Appointments: Dealer dashboard performance
-- Speeds up "upcoming appointments" and "appointment history" queries
CREATE INDEX IF NOT EXISTS idx_appointments_dealer_scheduled 
ON appointments(dealer_id, scheduled_at DESC);

COMMENT ON INDEX idx_appointments_dealer_scheduled IS 
'Optimizes dealer appointment queries - dealer_id + scheduled_at ordering';

-- Appointments: Buyer dashboard performance
CREATE INDEX IF NOT EXISTS idx_appointments_buyer_scheduled 
ON appointments(buyer_id, scheduled_at DESC);

COMMENT ON INDEX idx_appointments_buyer_scheduled IS 
'Optimizes buyer appointment queries - buyer_id + scheduled_at ordering';

-- =============================================================================
-- PART 2: DATA INTEGRITY CONSTRAINTS
-- =============================================================================

-- Prevent duplicate conversations (same buyer + dealer + listing)
-- This enforces business rule: one conversation per listing between two parties
CREATE UNIQUE INDEX IF NOT EXISTS idx_conversations_unique 
ON conversations(buyer_id, dealer_id, listing_id);

COMMENT ON INDEX idx_conversations_unique IS 
'Enforces unique constraint: one conversation per buyer + dealer + listing combination';

-- Ensure VIN uniqueness across active listings (if VIN is provided)
-- Allows NULL VINs (not all vehicles have them)
CREATE UNIQUE INDEX IF NOT EXISTS idx_listings_vin_unique 
ON listings(vin) 
WHERE vin IS NOT NULL AND status = 'active';

COMMENT ON INDEX idx_listings_vin_unique IS 
'Ensures no duplicate active listings for same VIN - allows NULL VINs';

-- =============================================================================
-- PART 3: MATERIALIZED VIEW (Optional - for high traffic)
-- =============================================================================

-- Convert dealer_metrics to materialized view for performance
-- Uncomment when traffic grows beyond 1000 dealers

/*
DROP VIEW IF EXISTS dealer_metrics;

CREATE MATERIALIZED VIEW dealer_metrics AS
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

-- Create unique index for concurrent refresh
CREATE UNIQUE INDEX idx_dealer_metrics_dealer_id ON dealer_metrics(dealer_id);

-- Refresh function (call this periodically - e.g., every 5 minutes)
CREATE OR REPLACE FUNCTION refresh_dealer_metrics()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY dealer_metrics;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON MATERIALIZED VIEW dealer_metrics IS 
'Cached dealer performance metrics - refresh every 5 minutes with refresh_dealer_metrics()';
*/

-- =============================================================================
-- PART 4: ADDITIONAL PERFORMANCE INDEXES (Conditional)
-- =============================================================================

-- Listing search by location (if location search is used)
CREATE INDEX IF NOT EXISTS idx_listings_location_status 
ON listings(location_city, location_region, status) 
WHERE status = 'active';

COMMENT ON INDEX idx_listings_location_status IS 
'Optimizes location-based listing search - active listings only';

-- Listing search by price range (if price filtering is used)
CREATE INDEX IF NOT EXISTS idx_listings_price_status 
ON listings(price, status) 
WHERE status = 'active';

COMMENT ON INDEX idx_listings_price_status IS 
'Optimizes price range filtering - active listings only';

-- Listing search by year (if year filtering is used)
CREATE INDEX IF NOT EXISTS idx_listings_year_status 
ON listings(year, status) 
WHERE status = 'active';

COMMENT ON INDEX idx_listings_year_status IS 
'Optimizes year filtering - active listings only';

-- Messages: Read/unread status filtering
CREATE INDEX IF NOT EXISTS idx_messages_conversation_read 
ON messages(conversation_id, read_at) 
WHERE read_at IS NULL;

COMMENT ON INDEX idx_messages_conversation_read IS 
'Optimizes unread message queries - partial index on unread messages';

-- =============================================================================
-- PART 5: QUERY ANALYSIS HELPERS
-- =============================================================================

-- Function to analyze slow queries (requires pg_stat_statements)
CREATE OR REPLACE FUNCTION analyze_slow_queries(min_duration_ms INTEGER DEFAULT 1000)
RETURNS TABLE(
  query TEXT,
  calls BIGINT,
  mean_time_ms NUMERIC,
  max_time_ms NUMERIC,
  total_time_minutes NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    LEFT(query, 200) as query,
    calls,
    ROUND((mean_exec_time)::numeric, 2) as mean_time_ms,
    ROUND((max_exec_time)::numeric, 2) as max_time_ms,
    ROUND((total_exec_time / 60000)::numeric, 2) as total_time_minutes
  FROM pg_stat_statements
  WHERE mean_exec_time > min_duration_ms
  AND query NOT LIKE '%pg_stat%'
  ORDER BY mean_exec_time DESC
  LIMIT 20;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION analyze_slow_queries IS 
'Finds slow queries (>1 second mean) - requires pg_stat_statements extension';

-- =============================================================================
-- VERIFICATION QUERIES
-- =============================================================================

-- Check index usage
-- SELECT 
--   schemaname,
--   tablename,
--   indexname,
--   idx_scan,
--   idx_tup_read,
--   idx_tup_fetch
-- FROM pg_stat_user_indexes
-- WHERE schemaname = 'public'
-- AND idx_scan = 0
-- ORDER BY tablename;

-- Check table sizes
-- SELECT 
--   schemaname,
--   tablename,
--   pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size,
--   pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) AS table_size,
--   pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename) - 
--                  pg_relation_size(schemaname||'.'||tablename)) AS index_size
-- FROM pg_tables
-- WHERE schemaname = 'public'
-- ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- =============================================================================
-- CONFIRMATION
-- =============================================================================
-- ✅ Performance indexes added for common query patterns
-- ✅ Unique constraints enforce data integrity
-- ✅ Materialized view option documented (commented out)
-- ✅ Query analysis helpers provided
-- ✅ All indexes are safe to add (IF NOT EXISTS)
-- ✅ No breaking changes to existing queries
-- =============================================================================
