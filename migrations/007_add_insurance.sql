-- Add optional insurance add-on support to the jobs table.
-- Customers can opt in to a flat $12 insurance fee at checkout.

ALTER TABLE jobs
  ADD COLUMN IF NOT EXISTS add_insurance BOOLEAN DEFAULT FALSE;

ALTER TABLE jobs
  ADD COLUMN IF NOT EXISTS insurance_fee_cents INTEGER DEFAULT 0;
