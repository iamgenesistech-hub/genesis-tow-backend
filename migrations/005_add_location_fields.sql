-- Add customer location + vehicle status fields to jobs table to support
-- Lyft/Uber-style live driver tracking and better dispatch accuracy.

ALTER TABLE jobs
  ADD COLUMN IF NOT EXISTS customer_phone_alt TEXT,
  ADD COLUMN IF NOT EXISTS with_vehicle BOOLEAN,
  ADD COLUMN IF NOT EXISTS staying_with_vehicle BOOLEAN,
  ADD COLUMN IF NOT EXISTS latitude NUMERIC,
  ADD COLUMN IF NOT EXISTS longitude NUMERIC,
  ADD COLUMN IF NOT EXISTS location_accuracy_meters INTEGER;
