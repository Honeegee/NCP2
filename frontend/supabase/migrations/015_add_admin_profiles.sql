-- Create admin profiles table
CREATE TABLE admin_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL DEFAULT '',
  last_name TEXT NOT NULL DEFAULT '',
  phone TEXT DEFAULT '',
  profile_picture_url TEXT,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE admin_profiles ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Admin profiles viewable by admins" ON admin_profiles
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND (role = 'admin' OR role = 'superadmin')
  ));

CREATE POLICY "Admin profiles editable by owner" ON admin_profiles
  FOR ALL USING (user_id = auth.uid());

-- Automatically create profiles for existing admins
INSERT INTO admin_profiles (user_id, first_name, last_name)
SELECT id, split_part(email, '@', 1), ''
FROM users
WHERE role IN ('admin', 'superadmin')
ON CONFLICT (user_id) DO NOTHING;
