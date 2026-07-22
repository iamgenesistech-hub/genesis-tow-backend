const { Router } = require('express');
const pool = require('../db');
const { calculateQuote, calculateCombinedQuote } = require('../pricing');
const { sendSms } = require('../sms');

const CANCELLATION_FEE_CENTS = 1500; // flat $15 cancellation fee

const router = Router();

// POST /jobs/quote — calculate a price, nothing saved
router.post('/quote', async (req, res) => {
  try {
    const { serviceType, duty_level, pickup, dropoff, add_insurance, winch_difficulty, driverLocation, combined } = req.body;

    if (!serviceType || !pickup || !dropoff) {
      return res.status(400).json({ error: 'serviceType, pickup, and dropoff are required' });
    }

    // Combined winch-out + tow quote
    if (combined || serviceType === 'winch_and_tow') {
      const quote = calculateCombinedQuote({
        duty_level: duty_level || 'regular',
        pickup,
        dropoff,
        driverLocation: driverLocation || null,
        add_insurance,
        winch_difficulty: winch_difficulty || 'moderate',
      });
      return res.json(quote);
    }

    // Single service quote
    const quote = calculateQuote({
      serviceType,
      duty_level: duty_level || 'regular',
      pickup,
      dropoff,
      driverLocation: driverLocation || null,
      add_insurance,
      winch_difficulty: winch_difficulty || null,
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
      serviceType, duty_level, pickup, dropoff,
      customerName, customerPhone, add_insurance,
      winch_difficulty, driverLocation, combined,
      key_location, key_location_custom,
    } = req.body;

    if (!serviceType || !pickup || !dropoff) {
      return res.status(400).json({ error: 'serviceType, pickup, and dropoff are required' });
    }

    const dutyLevel = duty_level || 'regular';

    // Combined winch-out + tow → create two linked job rows
    if (combined || serviceType === 'winch_and_tow') {
      const combinedQuote = calculateCombinedQuote({
        duty_level: dutyLevel,
        pickup,
        dropoff,
        driverLocation: driverLocation || null,
        add_insurance,
        winch_difficulty: winch_difficulty || 'moderate',
      });

      // Insert winch-out job
      const winchResult = await pool.query(
        `INSERT INTO jobs (service_type, duty_level, pickup_lat, pickup_lng, dropoff_lat, dropoff_lng,
                           customer_name, customer_phone, distance_miles, en_route_miles, en_route_cents,
                           price_cents, add_insurance, insurance_fee_cents, winch_difficulty,
                           is_combined, key_location, key_location_custom)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
         RETURNING *`,
        [
          'winch_out', dutyLevel,
          pickup.lat, pickup.lng, pickup.lat, pickup.lng,
          customerName || null, customerPhone || null,
          0, combinedQuote.enRouteMiles, combinedQuote.enRouteCents,
          combinedQuote.winchOut.priceCents, false, 0,
          winch_difficulty || 'moderate', true,
          key_location || null, key_location_custom || null,
        ]
      );

      // Insert tow job linked to winch-out
      const towResult = await pool.query(
        `INSERT INTO jobs (service_type, duty_level, pickup_lat, pickup_lng, dropoff_lat, dropoff_lng,
                           customer_name, customer_phone, distance_miles, en_route_miles, en_route_cents,
                           price_cents, add_insurance, insurance_fee_cents,
                           is_combined, parent_job_id, key_location, key_location_custom)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
         RETURNING *`,
        [
          'tow', dutyLevel,
          pickup.lat, pickup.lng, dropoff.lat, dropoff.lng,
          customerName || null, customerPhone || null,
          combinedQuote.tow.towMiles, 0, 0,
          combinedQuote.tow.priceCents, !!add_insurance, combinedQuote.insuranceFeeCents,
          true, winchResult.rows[0].id,
          key_location || null, key_location_custom || null,
        ]
      );

      return res.status(201).json({
        type: 'combined',
        winchJob: winchResult.rows[0],
        towJob: towResult.rows[0],
        totalCents: combinedQuote.totalCents,
        totalFormatted: combinedQuote.totalFormatted,
        enRouteMiles: combinedQuote.enRouteMiles,
      });
    }

    // Single service job
    const quote = calculateQuote({
      serviceType,
      duty_level: dutyLevel,
      pickup,
      dropoff,
      driverLocation: driverLocation || null,
      add_insurance,
      winch_difficulty: winch_difficulty || null,
    });

    const result = await pool.query(
      `INSERT INTO jobs (service_type, duty_level, pickup_lat, pickup_lng, dropoff_lat, dropoff_lng,
                         customer_name, customer_phone, distance_miles, en_route_miles, en_route_cents,
                         price_cents, add_insurance, insurance_fee_cents, winch_difficulty,
                         key_location, key_location_custom)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
       RETURNING *`,
      [
        serviceType, dutyLevel,
        pickup.lat, pickup.lng, dropoff.lat, dropoff.lng,
        customerName || null, customerPhone || null,
        quote.towMiles, quote.enRouteMiles, quote.enRouteCents,
        quote.priceCents, !!add_insurance, quote.insuranceFeeCents,
        winch_difficulty || null,
        key_location || null, key_location_custom || null,
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

// PATCH /jobs/:id — update job (rating, tip, status)
router.patch('/:id', async (req, res) => {
  try {
    const { status, rating, tip } = req.body;
    const updates = [];
    const values = [];
    let idx = 1;

    if (status) { updates.push(`status = $${idx++}`); values.push(status); }
    if (rating) { updates.push(`rating = $${idx++}`); values.push(rating); }
    if (tip !== undefined) { updates.push(`tip_amount = $${idx++}`); values.push(tip); }
    if (status === 'completed') { updates.push(`completed_at = NOW()`); }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    values.push(req.params.id);
    const result = await pool.query(
      `UPDATE jobs SET ${updates.join(', ')} WHERE id = $${idx} RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Job not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('PATCH /jobs/:id error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /jobs/:id — customer cancels a booking
// Only allowed while the job is still 'pending' or 'assigned'. Automatically
// applies a flat $15 cancellation fee and texts the customer a confirmation.
router.delete('/:id', async (req, res) => {
  try {
    const { cancellation_reason } = req.body;

    if (!cancellation_reason) {
      return res.status(400).json({ error: 'cancellation_reason is required' });
    }

    const jobResult = await pool.query('SELECT * FROM jobs WHERE id = $1', [req.params.id]);
    if (jobResult.rows.length === 0) {
      return res.status(404).json({ error: 'Job not found' });
    }

    const job = jobResult.rows[0];
    if (!['pending', 'assigned'].includes(job.status)) {
      return res.status(409).json({
        error: `Cannot cancel a job with status '${job.status}'. Only 'pending' or 'assigned' jobs can be cancelled.`,
      });
    }

    const result = await pool.query(
      `UPDATE jobs
       SET status = 'cancelled', cancelled_at = NOW(), cancellation_reason = $1, cancellation_fee_cents = $2
       WHERE id = $3
       RETURNING *`,
      [cancellation_reason, CANCELLATION_FEE_CENTS, req.params.id]
    );

    const cancelledJob = result.rows[0];

    await sendSms(
      cancelledJob.customer_phone,
      'Your tow service has been cancelled. A $15 cancellation fee has been applied to your account.'
    );

    res.json(cancelledJob);
  } catch (err) {
    console.error('DELETE /jobs/:id error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
