-- Add vehicle detail fields to the jobs table.
-- Customers may optionally provide vehicle information to help drivers
-- identify the vehicle at pickup.

ALTER TABLE jobs
  ADD COLUMN IF NOT EXISTS vehicle_year INTEGER;

ALTER TABLE jobs
  ADD COLUMN IF NOT EXISTS vehicle_make TEXT;

ALTER TABLE jobs
  ADD COLUMN IF NOT EXISTS vehicle_model TEXT;

ALTER TABLE jobs
  ADD COLUMN IF NOT EXISTS vehicle_color TEXT;

-- vehicle_drive_type values: '2WD', '4WD', 'AWD', 'RWD', 'Unknown'
ALTER TABLE jobs
  ADD COLUMN IF NOT EXISTS vehicle_drive_type TEXT;
