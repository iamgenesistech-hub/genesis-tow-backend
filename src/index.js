require('dotenv').config();
const express = require('express');
const jobsRouter = require('./routes/jobs');
const { initSmsService } = require('./sms');

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize SMS service (Twilio) using env vars:
// TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER
initSmsService({
  accountSid: process.env.TWILIO_ACCOUNT_SID,
  authToken: process.env.TWILIO_AUTH_TOKEN,
  phoneNumber: process.env.TWILIO_PHONE_NUMBER,
});

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
