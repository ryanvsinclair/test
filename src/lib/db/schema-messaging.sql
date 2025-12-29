-- Messaging System Schema
-- Supports: Buyer↔Dealer, Buyer↔Buyer
-- AWS-Ready: Indexed, scalable, production-ready

-- ============================================
-- CONVERSATIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Participants
  buyer_id UUID NOT NULL,
  buyer_name VARCHAR(255) NOT NULL,
  seller_id UUID NOT NULL,
  seller_name VARCHAR(255) NOT NULL,
  seller_type VARCHAR(10) NOT NULL CHECK (seller_type IN ('dealer', 'buyer')),
  
  -- Context
  listing_id UUID,
  listing_title VARCHAR(255),
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  last_message_at TIMESTAMP,
  
  -- Unread tracking (per participant)
  unread_count_buyer INT DEFAULT 0,
  unread_count_seller INT DEFAULT 0,
  
  -- Lifecycle
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'closed_by_buyer', 'closed_by_seller')),
  
  -- Metadata (for future extensions)
  metadata JSONB,
  
  -- Ensure uniqueness per buyer-seller-listing combo
  UNIQUE(buyer_id, seller_id, listing_id)
);

-- ============================================
-- MESSAGES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  
  -- Sender
  sender_id UUID NOT NULL,
  sender_name VARCHAR(255) NOT NULL,
  sender_type VARCHAR(10) NOT NULL CHECK (sender_type IN ('buyer', 'dealer')), -- For unread count logic only
  
  -- Content
  content TEXT NOT NULL CHECK (length(content) <= 5000),
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  read_at TIMESTAMP,
  
  -- Delivery tracking
  delivery_status VARCHAR(20) DEFAULT 'sent' CHECK (delivery_status IN ('pending', 'sent', 'delivered', 'failed')),
  
  -- Metadata (for future extensions: attachments, reactions, etc.)
  metadata JSONB
);

-- ============================================
-- INDEXES (Performance-Critical)
-- ============================================

-- Conversations list for buyer (most common query)
CREATE INDEX IF NOT EXISTS idx_conversations_buyer 
  ON conversations(buyer_id, last_message_at DESC NULLS LAST)
  WHERE status = 'active';

-- Conversations list for seller (dealer or private)
CREATE INDEX IF NOT EXISTS idx_conversations_seller 
  ON conversations(seller_id, seller_type, last_message_at DESC NULLS LAST)
  WHERE status = 'active';

-- Conversation lookup by participants + listing
CREATE INDEX IF NOT EXISTS idx_conversations_lookup 
  ON conversations(buyer_id, seller_id, listing_id);

-- Messages for conversation (chronological)
CREATE INDEX IF NOT EXISTS idx_messages_conversation 
  ON messages(conversation_id, created_at DESC);

-- Unread messages count
CREATE INDEX IF NOT EXISTS idx_messages_unread 
  ON messages(conversation_id, read_at)
  WHERE read_at IS NULL;

-- ============================================
-- TRIGGERS (Auto-Update Logic)
-- ============================================

-- Update conversation timestamp on new message
CREATE OR REPLACE FUNCTION update_conversation_on_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE conversations
  SET 
    last_message_at = NEW.created_at,
    updated_at = NEW.created_at,
    -- Increment unread count for receiver
    unread_count_buyer = CASE 
      WHEN NEW.sender_type != 'buyer' THEN unread_count_buyer + 1 
      ELSE unread_count_buyer 
    END,
    unread_count_seller = CASE 
      WHEN NEW.sender_type = 'buyer' THEN unread_count_seller + 1 
      ELSE unread_count_seller 
    END
  WHERE id = NEW.conversation_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS messages_update_conversation ON messages;
CREATE TRIGGER messages_update_conversation
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_on_message();

-- Reset unread count when messages are marked as read
CREATE OR REPLACE FUNCTION reset_unread_count_on_read()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.read_at IS NOT NULL AND OLD.read_at IS NULL THEN
    UPDATE conversations
    SET 
      unread_count_buyer = CASE 
        WHEN NEW.sender_type != 'buyer' THEN GREATEST(unread_count_buyer - 1, 0)
        ELSE unread_count_buyer 
      END,
      unread_count_seller = CASE 
        WHEN NEW.sender_type = 'buyer' THEN GREATEST(unread_count_seller - 1, 0)
        ELSE unread_count_seller 
      END
    WHERE id = NEW.conversation_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS messages_reset_unread ON messages;
CREATE TRIGGER messages_reset_unread
  AFTER UPDATE ON messages
  FOR EACH ROW
  WHEN (OLD.read_at IS NULL AND NEW.read_at IS NOT NULL)
  EXECUTE FUNCTION reset_unread_count_on_read();

-- ============================================
-- HELPER FUNCTIONS (Optional)
-- ============================================

-- Mark all messages in a conversation as read
CREATE OR REPLACE FUNCTION mark_conversation_as_read(
  p_conversation_id UUID,
  p_user_id UUID,
  p_user_type VARCHAR(10)
)
RETURNS VOID AS $$
BEGIN
  UPDATE messages
  SET read_at = NOW()
  WHERE conversation_id = p_conversation_id
    AND read_at IS NULL
    AND sender_id != p_user_id;
  
  -- Reset unread count for the reader
  IF p_user_type = 'buyer' THEN
    UPDATE conversations
    SET unread_count_buyer = 0
    WHERE id = p_conversation_id;
  ELSE
    UPDATE conversations
    SET unread_count_seller = 0
    WHERE id = p_conversation_id;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Get conversations with last message (optimized query)
CREATE OR REPLACE FUNCTION get_conversations_for_user(
  p_user_id UUID,
  p_user_type VARCHAR(10),
  p_limit INT DEFAULT 50,
  p_offset INT DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  buyer_id UUID,
  buyer_name VARCHAR(255),
  seller_id UUID,
  seller_name VARCHAR(255),
  seller_type VARCHAR(10),
  listing_id UUID,
  listing_title VARCHAR(255),
  last_message_at TIMESTAMP,
  last_message_content TEXT,
  unread_count_buyer INT,
  unread_count_seller INT,
  status VARCHAR(20),
  created_at TIMESTAMP,
  updated_at TIMESTAMP
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.buyer_id,
    c.buyer_name,
    c.seller_id,
    c.seller_name,
    c.seller_type,
    c.listing_id,
    c.listing_title,
    c.last_message_at,
    (SELECT content FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message_content,
    c.unread_count_buyer,
    c.unread_count_seller,
    c.status,
    c.created_at,
    c.updated_at
  FROM conversations c
  WHERE 
    CASE 
      WHEN p_user_type = 'dealer' THEN 
        c.seller_id = p_user_id AND c.seller_type = 'dealer'
      ELSE 
        c.buyer_id = p_user_id OR (c.seller_id = p_user_id AND c.seller_type = 'buyer')
    END
    AND c.status = 'active'
  ORDER BY c.last_message_at DESC NULLS LAST
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- COMMENTS (Documentation)
-- ============================================
COMMENT ON TABLE conversations IS 'Message threads between buyers and dealers';
COMMENT ON TABLE messages IS 'Individual messages within conversations';

COMMENT ON COLUMN conversations.seller_type IS 'Either dealer OR buyer (buyer-owned listing)';
COMMENT ON COLUMN conversations.unread_count_buyer IS 'Number of unread messages for the buyer';
COMMENT ON COLUMN conversations.unread_count_seller IS 'Number of unread messages for the seller (dealer or listing owner)';
COMMENT ON COLUMN conversations.status IS 'Lifecycle state: active, closed_by_buyer, closed_by_seller';

COMMENT ON INDEX idx_conversations_buyer IS 'Optimizes buyer inbox query (most common)';
COMMENT ON INDEX idx_conversations_seller IS 'Optimizes dealer/listing owner inbox query';
COMMENT ON INDEX idx_messages_conversation IS 'Optimizes message list query for a conversation';

-- ============================================
-- SAMPLE QUERIES (For Reference)
-- ============================================

-- Get conversations for buyer
-- SELECT * FROM get_conversations_for_user('buyer-uuid', 'buyer', 50, 0);

-- Get conversations for dealer
-- SELECT * FROM get_conversations_for_user('dealer-uuid', 'dealer', 50, 0);

-- Get messages for conversation
-- SELECT * FROM messages WHERE conversation_id = 'conv-uuid' ORDER BY created_at DESC LIMIT 50;

-- Send message (insert only, trigger handles conversation update)
-- INSERT INTO messages (id, conversation_id, sender_id, sender_name, sender_type, content)
-- VALUES ('msg-uuid', 'conv-uuid', 'user-uuid', 'User Name', 'buyer', 'Message content');

-- Mark conversation as read
-- SELECT mark_conversation_as_read('conv-uuid', 'user-uuid', 'buyer');

-- Find or create conversation
-- INSERT INTO conversations (buyer_id, buyer_name, seller_id, seller_name, seller_type, listing_id, listing_title)
-- VALUES ('buyer-uuid', 'Buyer', 'seller-uuid', 'Seller', 'dealer', 'listing-uuid', 'Vehicle Title')
-- ON CONFLICT (buyer_id, seller_id, listing_id) DO NOTHING
-- RETURNING *;
