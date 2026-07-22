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

// Flat fee charged when a customer opts in to the insurance add-on.
const INSURANCE_FEE_CENTS = 1200; // $12 flat fee

// Per-mile rate for en-route (driver traveling to customer)
const ENROUTE_PER_MILE_CENTS = 250; // $2.50 per mile

// Per-mile rate for tow distance (pickup to dropoff)
const TOW_PER_MILE_CENTS = 350; // $3.50 per mile

// Base fees by service type
const BASE_CENTS_BY_SERVICE = {
  tow: 7500,                // $75 hook-up/tow base
  roadside_assistance: 5000, // $50 roadside
  winch_out: 6000,          // $60 winch-out base (varies by difficulty)
};

// Winch-out difficulty surcharges
const WINCH_DIFFICULTY_SURCHARGE = {
  easy: 0,        // flat ground, paved
  moderate: 3000, // +$30 (ditch, soft ground)
  hard: 6000,     // +$60 (steep incline, mud, off-road)
  extreme: 10000, // +$100 (deep water, heavy debris, etc.)
};

/**
 * Calculate a quote for a single service.
 * Now includes en-route miles (driver → customer) as a separate line item.
 */
function calculateQuote({
  serviceType,
  duty_level,
  pickup,
  dropoff,
  driverLocation,
  add_insurance,
  winch_difficulty,
}) {
  const baseCents = BASE_CENTS_BY_SERVICE[serviceType] ?? 5000;
  const dutyMultiplier = DUTY_LEVEL_MULTIPLIERS[duty_level] ?? DUTY_LEVEL_MULTIPLIERS.regular;

  // Tow/service distance (pickup → dropoff)
  const towMiles = distanceMiles(pickup, dropoff);

  // En-route distance (driver → pickup)
  let enRouteMiles = 0;
  let enRouteCents = 0;
  if (driverLocation && driverLocation.lat && driverLocation.lng) {
    enRouteMiles = distanceMiles(driverLocation, pickup);
    enRouteCents = Math.round(ENROUTE_PER_MILE_CENTS * enRouteMiles);
  }

  // Winch-out difficulty surcharge
  let winchSurchargeCents = 0;
  if (serviceType === 'winch_out' && winch_difficulty) {
    winchSurchargeCents = WINCH_DIFFICULTY_SURCHARGE[winch_difficulty] ?? 0;
  }

  const insuranceFeeCents = add_insurance ? INSURANCE_FEE_CENTS : 0;

  // Total: (base + tow miles + winch surcharge) * duty multiplier + en-route + insurance
  const serviceCents = Math.round(
    (baseCents + TOW_PER_MILE_CENTS * towMiles + winchSurchargeCents) * dutyMultiplier
  );
  const priceCents = serviceCents + enRouteCents + insuranceFeeCents;

  return {
    towMiles: Math.round(towMiles * 100) / 100,
    enRouteMiles: Math.round(enRouteMiles * 100) / 100,
    enRouteCents,
    serviceCents,
    winchSurchargeCents,
    priceCents,
    priceFormatted: `${(priceCents / 100).toFixed(2)}`,
    insuranceFeeCents,
  };
}

/**
 * Calculate a combined quote when customer needs both winch-out AND tow.
 * Returns two separate line items plus a combined total.
 */
function calculateCombinedQuote({
  duty_level,
  pickup,
  dropoff,
  driverLocation,
  add_insurance,
  winch_difficulty,
}) {
  const winchQuote = calculateQuote({
    serviceType: 'winch_out',
    duty_level,
    pickup,
    dropoff: pickup, // winch-out is at the same location (no tow distance)
    driverLocation,
    add_insurance: false, // insurance applied once on total
    winch_difficulty,
  });

  const towQuote = calculateQuote({
    serviceType: 'tow',
    duty_level,
    pickup,
    dropoff,
    driverLocation: null, // driver is already at pickup after winch-out
    add_insurance: false,
  });

  const insuranceFeeCents = add_insurance ? INSURANCE_FEE_CENTS : 0;
  const totalCents = winchQuote.priceCents + towQuote.priceCents + insuranceFeeCents;

  return {
    winchOut: winchQuote,
    tow: towQuote,
    enRouteMiles: winchQuote.enRouteMiles,
    enRouteCents: winchQuote.enRouteCents,
    insuranceFeeCents,
    totalCents,
    totalFormatted: `${(totalCents / 100).toFixed(2)}`,
  };
}

module.exports = { calculateQuote, calculateCombinedQuote, distanceMiles };
