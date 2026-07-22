-- Add Stripe payment tracking fields to the jobs table.
-- Customers pay via Stripe (test mode) before a job is created; these
-- columns record the outcome of that payment.

ALTER TABLE jobs
  ADD COLUMN IF NOT EXISTS stripe_payment_id TEXT;

ALTER TABLE jobs
  ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending';

ALTER TABLE jobs
  ADD COLUMN IF NOT EXISTS amount_paid_cents INTEGER DEFAULT 0;
