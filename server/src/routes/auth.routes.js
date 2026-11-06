'use strict';

const { Router } = require('express');
const { body } = require('express-validator');

const {
  register,
  verifyOtp,
  resendOtp,
  login,
  forgotPassword,
  resetPassword,
  getConfig,
  getMe,
} = require('../controllers/auth.controller');

const auth = require('../middleware/auth');

const router = Router();

// POST /api/auth/register
router.post(
  '/register',
  [
    body('name').trim().notEmpty().withMessage('Name is required.').isLength({ max: 50 }).withMessage('Name cannot exceed 50 characters.'),
    body('email').isEmail().withMessage('A valid email is required.').normalizeEmail(),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters.'),
  ],
  register
);

// POST /api/auth/verify-otp
router.post(
  '/verify-otp',
  [
    body('email').isEmail().withMessage('A valid email is required.').normalizeEmail(),
    body('otp').trim().notEmpty().withMessage('OTP is required.').isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits.'),
    body('purpose').isIn(['verify', 'reset']).withMessage('purpose must be "verify" or "reset".'),
  ],
  verifyOtp
);

// POST /api/auth/resend-otp
router.post(
  '/resend-otp',
  [
    body('email').isEmail().withMessage('A valid email is required.').normalizeEmail(),
    body('purpose').isIn(['verify', 'reset']).withMessage('purpose must be "verify" or "reset".'),
  ],
  resendOtp
);

// POST /api/auth/login
router.post(
  '/login',
  [
    body('email').isEmail().withMessage('A valid email is required.').normalizeEmail(),
    body('password').notEmpty().withMessage('Password is required.'),
  ],
  login
);

// POST /api/auth/forgot-password
router.post(
  '/forgot-password',
  [
    body('email').isEmail().withMessage('A valid email is required.').normalizeEmail(),
  ],
  forgotPassword
);

// POST /api/auth/reset-password
router.post(
  '/reset-password',
  [
    body('email').isEmail().withMessage('A valid email is required.').normalizeEmail(),
    body('otp').trim().notEmpty().withMessage('OTP is required.').isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits.'),
    body('newPassword').isLength({ min: 8 }).withMessage('New password must be at least 8 characters.'),
  ],
  resetPassword
);

// GET /api/auth/config   (public)
router.get('/config', getConfig);

// GET /api/auth/me   (protected)
router.get('/me', auth, getMe);

module.exports = router;
