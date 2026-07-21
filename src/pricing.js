/**
 * Calculate the distance in miles between two lat/lng points
 * using the Haversine formula.
 */
function distanceMiles(a, b) {
  const R = 3958.8; // Earth radius in miles
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const sinLat = Math.sin(dLat / 2);
  const sinLng = Math.sin(dLng / 2);
  const h =
    sinLat * sinLat +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * sinLng * sinLng;
  return 2 * R * Math.asin(Math.sqrt(h));
}

function toRad(deg) {
  return (deg * Math.PI) / 180;
}

// Multiplier applied to the base price depending on the vehicle's duty level.
const DUTY_LEVEL_MULTIPLIERS = {
  regular: 1.0,
  medium: 1.25,
  heavy_duty: 1.5,
};

/**
 * Calculate a quote for a towing/roadside job.
 * Returns { distanceMiles, priceCents, priceFormatted }.
 */
function calculateQuote({ serviceType, duty_level, pickup, dropoff }) {
  const baseCentsByService = {
    tow: 7500, // $75 tow
    roadside_assistance: 5000, // $50 roadside assistance
    winch_out: 6000, // $60 winch out
  };
  const baseCents = baseCentsByService[serviceType] ?? 5000;
  const perMileCents = 350; // $3.50 per mile

  const dutyMultiplier = DUTY_LEVEL_MULTIPLIERS[duty_level] ?? DUTY_LEVEL_MULTIPLIERS.regular;

  const miles = distanceMiles(pickup, dropoff);
  const priceCents = Math.round((baseCents + perMileCents * miles) * dutyMultiplier);

  return {
    distanceMiles: Math.round(miles * 100) / 100,
    priceCents,
    priceFormatted: `${(priceCents / 100).toFixed(2)}`,
  };
}

module.exports = { calculateQuote };
