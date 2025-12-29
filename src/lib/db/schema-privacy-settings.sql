-- User Notification Preferences Table
CREATE TABLE user_notification_preferences (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  saved_vehicle_updates BOOLEAN DEFAULT true,
  price_drop_alerts BOOLEAN DEFAULT true,
  message_notifications BOOLEAN DEFAULT true,
  announcements BOOLEAN DEFAULT false,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Privacy Settings Table
CREATE TABLE user_privacy_settings (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  profile_visibility TEXT DEFAULT 'platform-only', -- 'public' | 'platform-only' | 'private'
  discoverable BOOLEAN DEFAULT true,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_notification_prefs_user_id ON user_notification_preferences(user_id);
CREATE INDEX idx_privacy_settings_user_id ON user_privacy_settings(user_id);
