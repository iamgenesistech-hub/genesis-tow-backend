-- Add rating, tip, driver assignment, and completion tracking to jobs table.

ALTER TABLE jobs
  ADD COLUMN IF NOT EXISTS rating NUMERIC,
  ADD COLUMN IF NOT EXISTS tip_amount NUMERIC,
  ADD COLUMN IF NOT EXISTS driver_id INTEGER,
  ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'jobs_rating_check'
  ) THEN
    ALTER TABLE jobs
      ADD CONSTRAINT jobs_rating_check
      CHECK (rating IS NULL OR (rating >= 1 AND rating <= 5));
  END IF;
END $$;
