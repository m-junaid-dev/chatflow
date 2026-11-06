'use strict';

const bcrypt = require('bcryptjs');
const crypto = require('crypto');

/**
 * Determines whether the app is running in demo / email-less mode.
 * Demo mode is active when DEMO_MODE=true OR when email credentials are absent.
 */
function isDemo() {
  return (
    process.env.DEMO_MODE === 'true' ||
    !process.env.EMAIL_USER ||
    !process.env.EMAIL_PASS
  );
}

/**
 * Whether users may create "demo accounts" (OTP shown on screen instead of emailed).
 * Only accounts that were explicitly created as demo accounts get on-screen OTPs;
 * every other account always receives its OTP by email.
 * SECURITY: anyone can read the OTP of a demo account (incl. via forgot-password),
 * so demo accounts must only be used for testing, never with a real email address.
 * Set ALLOW_DEMO_ACCOUNTS=false on a real public deployment.
 */
function allowDemoAccounts() {
  return process.env.ALLOW_DEMO_ACCOUNTS === 'true';
}

/** True when real email delivery is configured on the server. */
function emailConfigured() {
  return !!(process.env.EMAIL_USER && process.env.EMAIL_PASS);
}

/**
 * Generate a cryptographically random 6-digit OTP and its bcrypt hash.
 * @returns {{ raw: string, hashed: string }}
 */
async function generate() {
  const raw = String(crypto.randomInt(100000, 1000000));
  const hashed = await bcrypt.hash(raw, 12);
  return { raw, hashed };
}

/**
 * Verify a raw OTP against a stored bcrypt hash.
 * @param {string} raw - Plain-text OTP entered by the user.
 * @param {string} hashed - Bcrypt hash stored in the database.
 * @returns {Promise<boolean>}
 */
async function verify(raw, hashed) {
  return bcrypt.compare(raw, hashed);
}

module.exports = { generate, verify, isDemo, allowDemoAccounts, emailConfigured };
