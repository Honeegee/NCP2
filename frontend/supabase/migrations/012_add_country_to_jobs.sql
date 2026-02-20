-- Add country column to jobs for local vs international filtering
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'Philippines';

-- Backfill existing jobs
UPDATE jobs SET country = 'Philippines' WHERE country IS NULL;
