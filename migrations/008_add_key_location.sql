-- Capture where the customer has hidden the vehicle keys when they are
-- not staying with the vehicle, so the driver can gain access on arrival.

ALTER TABLE jobs
  ADD COLUMN IF NOT EXISTS key_location TEXT;

ALTER TABLE jobs
  ADD COLUMN IF NOT EXISTS key_location_custom TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'jobs_key_location_check'
  ) THEN
    ALTER TABLE jobs
      ADD CONSTRAINT jobs_key_location_check
      CHECK (key_location IS NULL OR key_location IN (
        'with_customer', 'under_mat', 'under_bumper', 'mailbox', 'with_neighbor', 'other'
      ));
  END IF;
END $$;
