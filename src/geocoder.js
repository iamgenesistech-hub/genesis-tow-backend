const NodeGeocoder = require('node-geocoder');

// OpenCage Geocoder — free tier gives 250 requests/day, no credit card
// required. Get a key at https://opencagedata.com/
const options = {
  provider: 'opencage',
  apiKey: process.env.OPENCAGE_API_KEY,
};

const geocoder = NodeGeocoder(options);

module.exports = geocoder;
