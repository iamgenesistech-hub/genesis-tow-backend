CREATE TABLE IF NOT EXISTS jobs (
  id            SERIAL PRIMARY KEY,
  service_type  TEXT NOT NULL,
  pickup_lat    DOUBLE PRECISION NOT NULL,
  pickup_lng    DOUBLE PRECISION NOT NULL,
  dropoff_lat   DOUBLE PRECISION NOT NULL,
  dropoff_lng   DOUBLE PRECISION NOT NULL,
  customer_name TEXT,
  customer_phone TEXT,
  distance_miles DOUBLE PRECISION NOT NULL,
  price_cents   INTEGER NOT NULL,
  status        TEXT NOT NULL DEFAULT 'requested',
  created_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
