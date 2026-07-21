const { Router } = require('express');
const pool = require('../db');
const { calculateQuote } = require('../pricing');

const router = Router();

// POST /jobs/quote — calculate a price, nothing saved
router.post('/quote', async (req, res) => {
  try {
    const { serviceType, duty_level, pickup, dropoff } = req.body;

    if (!serviceType || !pickup || !dropoff) {
      return res.status(400).json({ error: 'serviceType, pickup, and dropoff are required' });
    }

    const quote = calculateQuote({ serviceType, duty_level: duty_level || 'regular', pickup, dropoff });
    res.json(quote);
  } catch (err) {
    console.error('POST /jobs/quote error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /jobs — calculate a price AND save a real Job row
router.post('/', async (req, res) => {
  try {
    const {
      serviceType,
      duty_level,
      pickup,
      dropoff,
      customerName,
      customerPhone,
      customerPhoneAlt,
      with_vehicle,
      staying_with_vehicle,
      latitude,
      longitude,
      location_accuracy,
    } = req.body;

    if (!serviceType || !pickup || !dropoff) {
      return res.status(400).json({ error: 'serviceType, pickup, and dropoff are required' });
    }

    const hasLatitude = latitude !== undefined && latitude !== null;
    const hasLongitude = longitude !== undefined && longitude !== null;
    if (hasLatitude !== hasLongitude) {
      return res.status(400).json({ error: 'latitude and longitude must be provided together' });
    }

    const dutyLevel = duty_level || 'regular';

    const quote = calculateQuote({ serviceType, duty_level: dutyLevel, pickup, dropoff });

    const result = await pool.query(
      `INSERT INTO jobs (service_type, duty_level, pickup_lat, pickup_lng, dropoff_lat, dropoff_lng,
                         customer_name, customer_phone, customer_phone_alt, distance_miles, price_cents,
                         with_vehicle, staying_with_vehicle, latitude, longitude, location_accuracy_meters)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
       RETURNING *`,
      [
        serviceType,
        dutyLevel,
        pickup.lat,
        pickup.lng,
        dropoff.lat,
        dropoff.lng,
        customerName || null,
        customerPhone || null,
        customerPhoneAlt || null,
        quote.distanceMiles,
        quote.priceCents,
        with_vehicle ?? null,
        staying_with_vehicle ?? null,
        hasLatitude ? latitude : null,
        hasLongitude ? longitude : null,
        location_accuracy ?? null,
      ]
    );

    res.status(201).json({ ...result.rows[0], priceFormatted: quote.priceFormatted });
  } catch (err) {
    console.error('POST /jobs error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /jobs — list the 50 most recent jobs
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM jobs ORDER BY created_at DESC LIMIT 50'
    );
    res.json(result.rows);
  } catch (err) {
    console.error('GET /jobs error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /jobs/:id — fetch one job
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM jobs WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Job not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('GET /jobs/:id error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
