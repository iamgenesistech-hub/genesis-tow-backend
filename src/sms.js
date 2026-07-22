// Minimal SMS sending helper.
//
// There's no SMS provider wired up yet (no Twilio credentials/config in this
// service), so this logs the message it would send. Swap the body of
// `sendSms` for a real provider call (e.g. Twilio's REST API) when one is
// available — the call sites elsewhere in the codebase don't need to change.

async function sendSms(to, message) {
  if (!to) {
    console.warn('sendSms called with no destination phone number, skipping:', message);
    return;
  }

  console.log(`[SMS] -> ${to}: ${message}`);
}

module.exports = { sendSms };
