-- Drivers table with availability tracking
CREATE TABLE IF NOT EXISTS drivers (
  id              SERIAL PRIMARY KEY,
  name            TEXT NOT NULL,
  phone           TEXT NOT NULL,
  company_name    TEXT DEFAULT 'Genesis Tow Services',
  photo_url       TEXT,
  current_lat     DOUBLE PRECISION,
  current_lng     DOUBLE PRECISION,
  is_available    BOOLEAN NOT NULL DEFAULT true,
  active_job_id   INTEGER REFERENCES jobs(id),
  duty_capability TEXT NOT NULL DEFAULT 'regular', -- regular, medium, heavy_duty
  created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add new columns to jobs for en-route miles and winch difficulty
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS en_route_miles DOUBLE PRECISION DEFAULT 0;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS en_route_cents INTEGER DEFAULT 0;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS winch_difficulty TEXT;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS driver_id INTEGER REFERENCES drivers(id);
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS is_combined BOOLEAN DEFAULT false;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS parent_job_id INTEGER REFERENCES jobs(id);
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS duty_level TEXT DEFAULT 'regular';
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS add_insurance BOOLEAN DEFAULT false;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS insurance_fee_cents INTEGER DEFAULT 0;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS rating INTEGER;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS tip_amount INTEGER DEFAULT 0;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS key_location TEXT;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS key_location_custom TEXT;
