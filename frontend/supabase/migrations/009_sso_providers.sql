-- SSO provider links for users
CREATE TABLE IF NOT EXISTS user_sso_providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,            -- 'google', 'linkedin', 'facebook'
  provider_user_id TEXT NOT NULL,    -- ID from the OAuth provider
  provider_email TEXT,               -- Email from the provider (for reference)
  provider_data JSONB DEFAULT '{}',  -- Full profile data from provider
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(provider, provider_user_id)
);

CREATE INDEX IF NOT EXISTS idx_user_sso_providers_user_id ON user_sso_providers(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sso_providers_lookup ON user_sso_providers(provider, provider_user_id);

-- Allow password_hash to be NULL for SSO-only users
ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;

-- Enable RLS
ALTER TABLE user_sso_providers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own SSO providers"
  ON user_sso_providers FOR SELECT
  USING (auth.uid() = user_id);
