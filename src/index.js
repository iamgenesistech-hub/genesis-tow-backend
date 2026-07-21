require('dotenv').config();
const express = require('express');
const jobsRouter = require('./routes/jobs');

const app = express();
const PORT = process.env.PORT || 3000;

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
