-- Add duty_level column to jobs table to capture vehicle duty level
-- (regular, medium, heavy_duty) sent by the frontend.

ALTER TABLE jobs
  ADD COLUMN IF NOT EXISTS duty_level TEXT NOT NULL DEFAULT 'regular';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'jobs_duty_level_check'
  ) THEN
    ALTER TABLE jobs
      ADD CONSTRAINT jobs_duty_level_check
      CHECK (duty_level IN ('regular', 'medium', 'heavy_duty'));
  END IF;
END $$;
