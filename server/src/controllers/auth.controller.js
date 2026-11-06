'use strict';

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');

const User = require('../models/User');
const Otp = require('../models/Otp');
const { generate, verify, isDemo, allowDemoAccounts, emailConfigured } = require('../utils/otp');
const { sendOtpEmail } = require('../utils/sendEmail');

/** Helper: sign a JWT for the given user id (7 day expiry). */
function signToken(userId) {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
}

/**
 * Generate a unique 11-digit ChatFlow ID.
 * Format: 11 random digits, guaranteed unique in DB.
 */
async function generateChatflowId() {
  let id;
  let exists = true;
  while (exists) {
    // 11 digits: first digit 1-9 to avoid leading zero
    const first = Math.floor(Math.random() * 9) + 1;
    const rest = Math.floor(Math.random() * 1e10).toString().padStart(10, '0');
    id = `${first}${rest}`;
    exists = await User.findOne({ chatflowId: id });
  }
  return id;
}

/** True when this user's OTPs should be shown on screen instead of emailed. */
function useDemoFor(user) {
  return !!(user && user.isDemoAccount && allowDemoAccounts());
}

/**
 * Helper: build and send OTP.
 * By default the OTP is EMAILED. It is returned on screen only when
 * `demoAccount` is true (the user explicitly created a demo account) or when the
 * server has no email credentials configured at all (isDemo()).
 * The client can never force demo mode per request.
 */
async function createAndSendOtp(email, name, purpose, demoAccount = false) {
  const { raw, hashed } = await generate();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

  await Otp.create({ email, otpHash: hashed, purpose, expiresAt });

  const demoMode = demoAccount || isDemo();

  if (demoMode) {
    console.log(`[DEMO OTP] email=${email} purpose=${purpose} otp=${raw}`);
    return { raw, isDemo: true };
  }

  await sendOtpEmail(email, name, raw, purpose);
  return { raw: null, isDemo: false };
}

// ---------------------------------------------------------------------------
// POST /api/auth/register
// ---------------------------------------------------------------------------
async function register(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: errors.array()[0].msg });
    }

    const { name, email, password, demoAccount: reqDemoAccount } = req.body;
    const demoAccount = reqDemoAccount === true || reqDemoAccount === 'true';

    if (demoAccount && !allowDemoAccounts()) {
      return res.status(403).json({ success: false, message: 'Demo accounts are disabled on this server.' });
    }

    const existing = await User.findOne({ email });
    if (existing && existing.isVerified) {
      return res.status(409).json({ success: false, message: 'Email is already registered.' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    if (existing) {
      // Unverified leftover from an earlier attempt: let the user start over
      // (e.g. to switch between email and demo mode).
      existing.name = name;
      existing.password = hashedPassword;
      existing.isDemoAccount = demoAccount;
      await existing.save();
    } else {
      await User.create({ name, email, password: hashedPassword, isDemoAccount: demoAccount });
    }

    // Clean up any stale verify OTPs for this email
    await Otp.deleteMany({ email, purpose: 'verify' });

    const { raw, isDemo: demo } = await createAndSendOtp(email, name, 'verify', demoAccount);

    const response = {
      success: true,
      message: demo
        ? 'Registered successfully. OTP shown on screen (demo).'
        : 'Registered successfully. Check your email for the OTP.',
    };
    if (demo) response.demoOtp = raw;

    res.status(201).json(response);
  } catch (err) {
    next(err);
  }
}

// ---------------------------------------------------------------------------
// POST /api/auth/verify-otp
// ---------------------------------------------------------------------------
async function verifyOtp(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: errors.array()[0].msg });
    }

    const { email, otp, purpose } = req.body;

    const otpRecord = await Otp.findOne({ email, purpose });
    if (!otpRecord) {
      return res.status(400).json({ success: false, message: 'OTP not found or already used.' });
    }

    if (otpRecord.attempts >= 5) {
      return res.status(429).json({ success: false, message: 'Too many failed attempts. Request a new OTP.' });
    }

    if (new Date() > otpRecord.expiresAt) {
      await Otp.deleteOne({ _id: otpRecord._id });
      return res.status(400).json({ success: false, message: 'OTP has expired. Request a new one.' });
    }

    const isValid = await verify(otp, otpRecord.otpHash);
    if (!isValid) {
      otpRecord.attempts += 1;
      await otpRecord.save();
      return res.status(400).json({ success: false, message: 'Invalid OTP.' });
    }

    // OTP is valid — clean up
    await Otp.deleteOne({ _id: otpRecord._id });

    if (purpose === 'verify') {
      // Generate unique 11-digit ChatFlow ID on first verification
      const chatflowId = await generateChatflowId();

      const user = await User.findOneAndUpdate(
        { email },
        { isVerified: true, chatflowId },
        { new: true }
      );
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found.' });
      }

      const token = signToken(user._id);
      return res.json({
        success: true,
        message: 'Email verified successfully.',
        token,
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          chatflowId: user.chatflowId,
          avatar: user.avatar,
          about: user.about,
          isOnline: user.isOnline,
          lastSeen: user.lastSeen,
          isVerified: user.isVerified,
        },
      });
    }

    // purpose === 'reset'
    res.json({ success: true, message: 'OTP verified. You may now reset your password.' });
  } catch (err) {
    next(err);
  }
}

// ---------------------------------------------------------------------------
// POST /api/auth/resend-otp
// ---------------------------------------------------------------------------
async function resendOtp(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: errors.array()[0].msg });
    }

    const { email, purpose } = req.body;

    // Never send OTP emails to addresses that have no account.
    const user = await User.findOne({ email });
    if (!user) {
      return res.json({ success: true, message: 'If that email is registered, a new OTP has been sent.' });
    }

    const existing = await Otp.findOne({ email, purpose });
    if (existing) {
      const secondsSinceLastSent = (Date.now() - existing.lastSentAt.getTime()) / 1000;
      if (secondsSinceLastSent < 60) {
        const waitSeconds = Math.ceil(60 - secondsSinceLastSent);
        return res.status(429).json({
          success: false,
          message: `Please wait ${waitSeconds}s before requesting another OTP.`,
        });
      }
      await Otp.deleteOne({ _id: existing._id });
    }

    const { raw, isDemo: demo } = await createAndSendOtp(email, user.name, purpose, useDemoFor(user));

    const response = {
      success: true,
      message: demo ? 'OTP resent (shown on screen, demo).' : 'OTP resent. Check your email.',
    };
    if (demo) response.demoOtp = raw;

    res.json(response);
  } catch (err) {
    next(err);
  }
}

// ---------------------------------------------------------------------------
// POST /api/auth/login
// ---------------------------------------------------------------------------
async function login(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: errors.array()[0].msg });
    }

    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    if (!user.isVerified) {
      return res.status(403).json({
        success: false,
        message: 'Account not verified. Please verify your email first.',
        requiresVerification: true,
        email: user.email,
      });
    }

    const token = signToken(user._id);

    res.json({
      success: true,
      message: 'Logged in successfully.',
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        chatflowId: user.chatflowId,
        avatar: user.avatar,
        about: user.about,
        isOnline: user.isOnline,
        lastSeen: user.lastSeen,
        isVerified: user.isVerified,
      },
    });
  } catch (err) {
    next(err);
  }
}

// ---------------------------------------------------------------------------
// POST /api/auth/forgot-password
// ---------------------------------------------------------------------------
async function forgotPassword(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: errors.array()[0].msg });
    }

    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.json({
        success: true,
        message: 'If that email is registered, you will receive an OTP shortly.',
      });
    }

    await Otp.deleteMany({ email, purpose: 'reset' });
    const { raw, isDemo: demo } = await createAndSendOtp(email, user.name, 'reset', useDemoFor(user));

    const response = {
      success: true,
      message: demo
        ? 'Password reset OTP shown on screen (demo account).'
        : 'Password reset OTP sent to your email.',
    };
    if (demo) response.demoOtp = raw;

    res.json(response);
  } catch (err) {
    next(err);
  }
}

// ---------------------------------------------------------------------------
// POST /api/auth/reset-password
// ---------------------------------------------------------------------------
async function resetPassword(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: errors.array()[0].msg });
    }

    const { email, otp, newPassword } = req.body;

    const otpRecord = await Otp.findOne({ email, purpose: 'reset' });
    if (!otpRecord) {
      return res.status(400).json({ success: false, message: 'OTP not found or already used.' });
    }

    if (otpRecord.attempts >= 5) {
      return res.status(429).json({ success: false, message: 'Too many failed attempts. Request a new OTP.' });
    }

    if (new Date() > otpRecord.expiresAt) {
      await Otp.deleteOne({ _id: otpRecord._id });
      return res.status(400).json({ success: false, message: 'OTP has expired. Request a new one.' });
    }

    const isValid = await verify(otp, otpRecord.otpHash);
    if (!isValid) {
      otpRecord.attempts += 1;
      await otpRecord.save();
      return res.status(400).json({ success: false, message: 'Invalid OTP.' });
    }

    await Otp.deleteOne({ _id: otpRecord._id });

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    const user = await User.findOneAndUpdate({ email }, { password: hashedPassword });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    res.json({ success: true, message: 'Password reset successfully. You may now log in.' });
  } catch (err) {
    next(err);
  }
}

// ---------------------------------------------------------------------------
// GET /api/auth/config  (public) — tells the UI which signup options exist
// ---------------------------------------------------------------------------
function getConfig(_req, res) {
  res.json({
    success: true,
    demoAccountsEnabled: allowDemoAccounts(),
    emailConfigured: emailConfigured(),
  });
}

// ---------------------------------------------------------------------------
// GET /api/auth/me  (protected)
// ---------------------------------------------------------------------------
async function getMe(req, res, next) {
  try {
    res.json({ success: true, user: req.user });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  register,
  verifyOtp,
  resendOtp,
  login,
  forgotPassword,
  resetPassword,
  getConfig,
  getMe,
};
