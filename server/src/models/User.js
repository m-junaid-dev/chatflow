'use strict';

const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [50, 'Name cannot exceed 50 characters'],
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [8, 'Password must be at least 8 characters'],
    select: false,
  },
  // Unique 11-digit ChatFlow ID assigned after email verification
  chatflowId: {
    type: String,
    unique: true,
    sparse: true, // null until verified
    default: null,
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  // Demo accounts get their OTP shown on screen instead of by email (testing only)
  isDemoAccount: {
    type: Boolean,
    default: false,
  },
  avatar: {
    type: String,
    default: null,
  },
  about: {
    type: String,
    default: 'Hey there! I am using ChatFlow.',
    maxlength: [139, 'About cannot exceed 139 characters'],
  },
  isOnline: {
    type: Boolean,
    default: false,
  },
  lastSeen: {
    type: Date,
    default: Date.now,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('User', userSchema);
