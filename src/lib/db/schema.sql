-- User Preferences Table
CREATE TABLE user_preferences (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  budget_min INTEGER,
  budget_max INTEGER,
  preferred_body_types TEXT[] DEFAULT '{}',
  preferred_makes TEXT[] DEFAULT '{}',
  preferred_fuel_types TEXT[] DEFAULT '{}',
  mileage_tolerance TEXT DEFAULT 'flexible', -- 'low' | 'flexible'
  vehicle_age_preference TEXT DEFAULT 'open', -- 'newer' | 'classic' | 'open'
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Interactions Table
CREATE TABLE user_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  listing_id TEXT NOT NULL,
  interaction_type TEXT NOT NULL, -- 'like' | 'hide' | 'view'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_user_interactions_user_id ON user_interactions(user_id);
CREATE INDEX idx_user_interactions_listing_id ON user_interactions(listing_id);
CREATE INDEX idx_user_interactions_type ON user_interactions(interaction_type);
CREATE INDEX idx_user_interactions_created_at ON user_interactions(created_at DESC);

-- User Hidden Patterns (Optimization)
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
