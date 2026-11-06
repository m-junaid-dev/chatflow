'use strict';

const { Router } = require('express');
const { body } = require('express-validator');

const auth = require('../middleware/auth');
const { uploadAvatar } = require('../middleware/upload');
const { searchUsers, updateProfile } = require('../controllers/user.controller');

const router = Router();

// All user routes require authentication
router.use(auth);

// GET /api/users?search=
router.get('/', searchUsers);

// PUT /api/users/profile
router.put(
  '/profile',
  uploadAvatar,
  [
    body('name')
      .optional()
      .trim()
      .notEmpty()
      .withMessage('Name cannot be empty.')
      .isLength({ max: 50 })
      .withMessage('Name cannot exceed 50 characters.'),
    body('about')
      .optional()
      .trim()
      .isLength({ max: 139 })
      .withMessage('About cannot exceed 139 characters.'),
  ],
  updateProfile
);

module.exports = router;
