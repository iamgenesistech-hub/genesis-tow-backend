const { Router } = require('express');
const pool = require('../db');
const { calculateQuote } = require('../pricing');

const router = Router();

// POST /jobs/quote — calculate a price, nothing saved
router.post('/quote', async (req, res) => {
  try {
    const { serviceType, duty_level, pickup, dropoff, add_insurance } = req.body;

    if (!serviceType || !pickup || !dropoff) {
      return res.status(400).json({ error: 'serviceType, pickup, and dropoff are required' });
    }

    const quote = calculateQuote({
      serviceType,
      duty_level: duty_level || 'regular',
      pickup,
      dropoff,
      add_insurance,
    });
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
      add_insurance,
      with_vehicle,
      key_location,
      key_location_custom,
    } = req.body;

    if (!serviceType || !pickup || !dropoff) {
      return res.status(400).json({ error: 'serviceType, pickup, and dropoff are required' });
    }

    // Key location is only relevant (and required) when the customer will
    // not be with the vehicle — the driver needs to know where the keys
    // are hidden to gain access.
    if (with_vehicle === false && !key_location) {
      return res.status(400).json({ error: 'key_location is required when with_vehicle is false' });
    }

    if (key_location === 'other' && !key_location_custom) {
      return res.status(400).json({ error: 'key_location_custom is required when key_location is "other"' });
    }

    const dutyLevel = duty_level || 'regular';

    const quote = calculateQuote({
      serviceType,
      duty_level: dutyLevel,
      pickup,
      dropoff,
      add_insurance,
    });

    const result = await pool.query(
      `INSERT INTO jobs (service_type, duty_level, pickup_lat, pickup_lng, dropoff_lat, dropoff_lng,
                         customer_name, customer_phone, distance_miles, price_cents,
                         add_insurance, insurance_fee_cents, key_location, key_location_custom)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
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
        quote.distanceMiles,
        quote.priceCents,
        !!add_insurance,
        quote.insuranceFeeCents,
        key_location || null,
        key_location_custom || null,
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
