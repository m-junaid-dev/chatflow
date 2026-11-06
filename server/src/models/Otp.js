'use strict';

const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email is required'],
  },
  otpHash: {
    type: String,
    required: [true, 'OTP hash is required'],
  },
  purpose: {
    type: String,
    enum: ['verify', 'reset'],
    required: [true, 'Purpose is required'],
  },
  expiresAt: {
    type: Date,
    required: true,
    // MongoDB TTL index: document is automatically removed when expiresAt is reached
    index: { expires: 0 },
  },
  attempts: {
    type: Number,
    default: 0,
  },
  lastSentAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Otp', otpSchema);
