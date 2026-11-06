'use strict';

const nodemailer = require('nodemailer');

/**
 * Nodemailer transporter configured for Gmail SMTP.
 * Credentials are read from EMAIL_USER and EMAIL_PASS environment variables.
 */
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

module.exports = transporter;
