-- Add last_login_at to track first login for onboarding tour
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ;

-- Backfill existing users so they don't get the tour again
UPDATE users SET last_login_at = now() WHERE last_login_at IS NULL;
