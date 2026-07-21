-- Store the original human-entered address alongside the geocoded
-- lat/lng coordinates. Coordinates remain required and are used for
-- all internal distance/price calculations; the address columns exist
-- purely so the raw text a user typed can be displayed back to them.
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS pickup_address TEXT;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS dropoff_address TEXT;
