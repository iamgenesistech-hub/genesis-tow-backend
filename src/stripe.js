const Stripe = require('stripe');

if (!process.env.STRIPE_SECRET_KEY) {
  console.warn('STRIPE_SECRET_KEY is not set — Stripe calls will fail.');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-06-20',
});

/**
 * Creates a Stripe PaymentIntent for a booking and returns the client
 * secret the frontend needs to confirm payment.
 *
 * @param {number} amountCents - amount to charge, in cents (must be > 0)
 * @param {string} email - customer email, attached to the payment intent
 * @param {string} name - customer name, attached to the payment intent
 * @returns {Promise<{clientSecret: string, paymentIntentId: string}>}
 */
async function createPaymentIntent(amountCents, email, name) {
  if (!amountCents || amountCents <= 0) {
    throw new Error('amountCents must be a positive integer');
  }

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amountCents),
      currency: 'usd',
      receipt_email: email || undefined,
      metadata: {
        customer_name: name || '',
        customer_email: email || '',
      },
    });

    return {
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    };
  } catch (err) {
    console.error('createPaymentIntent error:', err);
    throw new Error(`Failed to create Stripe payment intent: ${err.message}`);
  }
}

module.exports = { stripe, createPaymentIntent };
