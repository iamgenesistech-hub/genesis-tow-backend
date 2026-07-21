require('dotenv').config();
const express = require('express');
const jobsRouter = require('./routes/jobs');
const geocoder = require('./geocoder');

const app = express();
const PORT = process.env.PORT || 3000;

// Make the geocoder available to routes without each one re-initializing it.
app.set('geocoder', geocoder);

if (!process.env.OPENCAGE_API_KEY) {
  console.warn(
    'Warning: OPENCAGE_API_KEY is not set. Address geocoding will fail until it is configured.'
  );
}

app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Routes
app.use('/jobs', jobsRouter);

app.listen(PORT, () => {
  console.log(`Genesis Tow backend listening on port ${PORT}`);
});
