-- Add 'superadmin' to the existing user_role enum
-- Note: PostgreSQL enums cannot be easily updated inside a transaction in some versions,
-- but adding a value is generally supported with ALTER TYPE.

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_enum
        WHERE enumtypid = 'user_role'::regtype
        AND enumlabel = 'superadmin'
    ) THEN
        ALTER TYPE user_role ADD VALUE 'superadmin';
    END IF;
END
$$;

-- Commentary:
-- After running this migration, you can promote any user to superadmin by running:
-- UPDATE users SET role = 'superadmin' WHERE email = 'your-primary-admin@example.com';
-- UPDATE users SET role = 'superadmin' WHERE email = 'your-backup-admin@example.com';
