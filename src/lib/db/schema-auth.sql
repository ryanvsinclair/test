-- User Authentication Extension Tables

-- User Email Verification Status
CREATE TABLE user_email_verification (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email_verified BOOLEAN DEFAULT false,
  verification_sent_at TIMESTAMPTZ,
  verified_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Two-Factor Authentication Settings
CREATE TABLE user_2fa_settings (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  enabled BOOLEAN DEFAULT false,
  method TEXT DEFAULT 'totp', -- 'totp' (authenticator app), 'email' (email OTP)
  secret TEXT, -- Encrypted TOTP secret
  backup_codes TEXT[], -- Array of encrypted backup codes
  enabled_at TIMESTAMPTZ,
  last_used_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Password Metadata
CREATE TABLE user_password_metadata (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  last_changed_at TIMESTAMPTZ DEFAULT NOW(),
  reset_requested_at TIMESTAMPTZ,
  reset_token TEXT, -- Encrypted password reset token
  reset_token_expires_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Active Sessions (for session management)
CREATE TABLE user_active_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_token TEXT UNIQUE NOT NULL,
  device_info TEXT, -- User agent, device type
  ip_address TEXT,
  location TEXT, -- City, region from IP
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_active_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX idx_email_verification_user_id ON user_email_verification(user_id);
CREATE INDEX idx_2fa_settings_user_id ON user_2fa_settings(user_id);
CREATE INDEX idx_password_metadata_user_id ON user_password_metadata(user_id);
CREATE INDEX idx_active_sessions_user_id ON user_active_sessions(user_id);
CREATE INDEX idx_active_sessions_token ON user_active_sessions(session_token);
CREATE INDEX idx_active_sessions_expires ON user_active_sessions(expires_at);

-- Comments
COMMENT ON TABLE user_email_verification IS 'Tracks email verification status for users';
COMMENT ON TABLE user_2fa_settings IS 'Stores two-factor authentication settings per user';
COMMENT ON TABLE user_password_metadata IS 'Tracks password change history and reset tokens';
COMMENT ON TABLE user_active_sessions IS 'Tracks active user sessions across devices';
