const twilio = require('twilio');
require('dotenv').config({ quiet: true });

let cachedClient;

const getTwilioClient = () => {
  const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER } = process.env;

  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PHONE_NUMBER) {
    throw new Error('Twilio credentials are missing. Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER.');
  }

  if (!cachedClient) {
    cachedClient = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
  }

  return cachedClient;
};

const sendSMS = async (to, message) => {
  try {
    const result = await getTwilioClient().messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to
    });

    console.log(`[OK] SMS sent successfully to ${to}. SID: ${result.sid}`);
    return { success: true, sid: result.sid };
  } catch (error) {
    console.error('[ERROR] SMS sending failed:', error.message);
    return { success: false, error: error.message };
  }
};

module.exports = { sendSMS };
