const { Router } = require('express');
const pool = require('../db');
const { calculateQuote } = require('../pricing');
const { assignRandomDriver } = require('../drivers');
const { sendServiceCompletedSms } = require('../sms');

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
    const { serviceType, duty_level, pickup, dropoff, customerName, customerPhone } = req.body;

    if (!serviceType || !pickup || !dropoff) {
      return res.status(400).json({ error: 'serviceType, pickup, and dropoff are required' });
    }

    const dutyLevel = duty_level || 'regular';

    const quote = calculateQuote({ serviceType, duty_level: dutyLevel, pickup, dropoff });

    const assignedDriver = assignRandomDriver();

    const result = await pool.query(
      `INSERT INTO jobs (service_type, duty_level, pickup_lat, pickup_lng, dropoff_lat, dropoff_lng,
                         customer_name, customer_phone, distance_miles, price_cents, driver_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
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
        assignedDriver.id,
      ]
    );

    res.status(201).json({ ...result.rows[0], driver: assignedDriver, priceFormatted: quote.priceFormatted });
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

// PATCH /jobs/:id — record a customer rating/tip once service is complete.
// Marks the job as completed and sends a completion SMS to the customer.
router.patch('/:id', async (req, res) => {
  try {
    const { rating, tip } = req.body;

    if (rating !== undefined && rating !== null) {
      const numericRating = Number(rating);
      if (!Number.isInteger(numericRating) || numericRating < 1 || numericRating > 5) {
        return res.status(400).json({ error: 'rating must be an integer between 1 and 5' });
      }
    }

    if (tip !== undefined && tip !== null) {
      const numericTip = Number(tip);
      if (Number.isNaN(numericTip) || numericTip < 0) {
        return res.status(400).json({ error: 'tip must be a non-negative number' });
      }
    }

    const result = await pool.query(
      `UPDATE jobs
       SET rating = COALESCE($1, rating),
           tip_amount = COALESCE($2, tip_amount),
           completed_at = NOW(),
           status = 'completed'
       WHERE id = $3
       RETURNING *`,
      [rating ?? null, tip ?? null, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Job not found' });
    }

    const job = result.rows[0];

    // Fire off the completion SMS to the customer. Don't let SMS
    // failures block the API response — just log the error.
    try {
      await sendServiceCompletedSms(job.customer_phone, job.customer_name);
    } catch (smsErr) {
      console.error(`Failed to send completion SMS for job ${job.id}:`, smsErr.message);
    }

    res.json(job);
  } catch (err) {
    console.error('PATCH /jobs/:id error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
