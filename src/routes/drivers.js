const { Router } = require('express');
const pool = require('../db');

const router = Router();

// GET /drivers — list all drivers (with availability)
router.get('/', async (req, res) => {
  try {
    const { available } = req.query;
    let query = 'SELECT * FROM drivers ORDER BY name';
    const params = [];

    if (available === 'true') {
      query = 'SELECT * FROM drivers WHERE is_available = true ORDER BY name';
    }

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error('GET /drivers error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /drivers/:id — get one driver
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM drivers WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Driver not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('GET /drivers/:id error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /drivers — register a new driver
router.post('/', async (req, res) => {
  try {
    const { name, phone, company_name, photo_url, duty_capability } = req.body;

    if (!name || !phone) {
      return res.status(400).json({ error: 'name and phone are required' });
    }

    const result = await pool.query(
      `INSERT INTO drivers (name, phone, company_name, photo_url, duty_capability)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [name, phone, company_name || 'Genesis Tow Services', photo_url || null, duty_capability || 'regular']
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('POST /drivers error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /drivers/:id/location — update driver's current location
router.patch('/:id/location', async (req, res) => {
  try {
    const { lat, lng } = req.body;
    const result = await pool.query(
      `UPDATE drivers SET current_lat = $1, current_lng = $2, updated_at = NOW()
       WHERE id = $3 RETURNING *`,
      [lat, lng, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Driver not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('PATCH /drivers/:id/location error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /drivers/:id/available — mark driver available after completing a job
router.patch('/:id/available', async (req, res) => {
  try {
    const result = await pool.query(
      `UPDATE drivers SET is_available = true, active_job_id = NULL, updated_at = NOW()
       WHERE id = $1 RETURNING *`,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Driver not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('PATCH /drivers/:id/available error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /drivers/:id/accept — driver accepts a job (becomes unavailable)
router.post('/:id/accept', async (req, res) => {
  try {
    const { job_id } = req.body;

    if (!job_id) {
      return res.status(400).json({ error: 'job_id is required' });
    }

    // Check driver is available
    const driverCheck = await pool.query('SELECT * FROM drivers WHERE id = $1', [req.params.id]);
    if (driverCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Driver not found' });
    }
    if (!driverCheck.rows[0].is_available) {
      return res.status(409).json({ error: 'Driver is not available — currently on another call' });
    }

    // Assign driver to job and mark unavailable
    await pool.query(
      `UPDATE drivers SET is_available = false, active_job_id = $1, updated_at = NOW()
       WHERE id = $2`,
      [job_id, req.params.id]
    );

    await pool.query(
      `UPDATE jobs SET driver_id = $1, status = 'accepted' WHERE id = $2`,
      [req.params.id, job_id]
    );

    const result = await pool.query('SELECT * FROM drivers WHERE id = $1', [req.params.id]);
    res.json(result.rows[0]);
  } catch (err) {
    console.error('POST /drivers/:id/accept error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /drivers/:id/complete — driver completes a job (becomes available again)
router.post('/:id/complete', async (req, res) => {
  try {
    const driver = await pool.query('SELECT * FROM drivers WHERE id = $1', [req.params.id]);
    if (driver.rows.length === 0) {
      return res.status(404).json({ error: 'Driver not found' });
    }

    const activeJobId = driver.rows[0].active_job_id;
    if (activeJobId) {
      await pool.query(
        `UPDATE jobs SET status = 'completed', completed_at = NOW() WHERE id = $1`,
        [activeJobId]
      );
    }

    await pool.query(
      `UPDATE drivers SET is_available = true, active_job_id = NULL, updated_at = NOW()
       WHERE id = $1`,
      [req.params.id]
    );

    const result = await pool.query('SELECT * FROM drivers WHERE id = $1', [req.params.id]);
    res.json({ driver: result.rows[0], message: 'Job completed, driver is now available' });
  } catch (err) {
    console.error('POST /drivers/:id/complete error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
