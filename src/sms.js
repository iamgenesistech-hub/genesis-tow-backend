// SMS integration using Twilio. Falls back to console logging when
// Twilio credentials are not configured (e.g. local development)
// so the rest of the app keeps working without a Twilio account.

let twilioClient = null;
let fromNumber = null;

/**
 * Initializes the Twilio client using the given credentials.
 * Call this once on app startup.
 */
function initSmsService({ accountSid, authToken, phoneNumber } = {}) {
  fromNumber = phoneNumber || null;

  if (!accountSid || !authToken || !phoneNumber) {
    console.warn(
      'SMS service not fully configured (missing TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, ' +
        'or TWILIO_PHONE_NUMBER). SMS messages will be logged instead of sent.'
    );
    return;
  }

  try {
    const twilio = require('twilio');
    twilioClient = twilio(accountSid, authToken);
    console.log('SMS service initialized with Twilio.');
  } catch (err) {
    console.error('Failed to initialize Twilio client:', err.message);
    twilioClient = null;
  }
}

/**
 * Sends an SMS message to the given phone number.
 * @param {string} phone - E.164 formatted phone number of the recipient.
 * @param {string} customerName - Name of the customer (used for logging).
 * @param {string} message - The message body to send.
 */
async function sendSms(phone, customerName, message) {
  if (!phone) {
    console.warn(`Skipping SMS to ${customerName || 'unknown customer'}: no phone number on file.`);
    return { skipped: true };
  }

  if (!twilioClient || !fromNumber) {
    console.log(`[SMS mock] To: ${phone} (${customerName || 'customer'}) — "${message}"`);
    return { skipped: true };
  }

  try {
    const result = await twilioClient.messages.create({
      body: message,
      from: fromNumber,
      to: phone,
    });
    console.log(`SMS sent to ${phone} (sid: ${result.sid})`);
    return result;
  } catch (err) {
    console.error(`Failed to send SMS to ${phone}:`, err.message);
    throw err;
  }
}

/**
 * Sends the standard "service completed" SMS to a customer.
 */
async function sendServiceCompletedSms(phone, customerName) {
  const message = 'Your tow service has been completed. Thank you for using Genesis Tow!';
  return sendSms(phone, customerName, message);
}

module.exports = { initSmsService, sendSms, sendServiceCompletedSms };
