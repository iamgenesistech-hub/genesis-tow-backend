-- Add cancellation support to the jobs table.
-- Customers can cancel a job while it is still 'pending' or 'assigned'.
-- Cancelling automatically applies a flat $15 (1500 cent) cancellation fee.

-- `status` was already added in 001_create_jobs.sql with a default of
-- 'requested'. Bring its default in line with the 'pending' value new jobs
-- should carry going forward; existing rows are left untouched.
ALTER TABLE jobs
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';

ALTER TABLE jobs
  ALTER COLUMN status SET DEFAULT 'pending';

ALTER TABLE jobs
  ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMP;

ALTER TABLE jobs
  ADD COLUMN IF NOT EXISTS cancellation_reason TEXT;

ALTER TABLE jobs
  ADD COLUMN IF NOT EXISTS cancellation_fee_cents INTEGER DEFAULT 0;
