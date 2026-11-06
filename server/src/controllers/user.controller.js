'use strict';

const { validationResult } = require('express-validator');
const User = require('../models/User');

// ---------------------------------------------------------------------------
// GET /api/users?search=  (search by name, email, OR 11-digit chatflowId)
// ---------------------------------------------------------------------------
async function searchUsers(req, res, next) {
  try {
    const { search } = req.query;

    if (!search || search.trim() === '') {
      return res.json({ success: true, users: [] });
    }

    const q = search.trim();
    const regex = new RegExp(q, 'i');

    // If query looks like an 11-digit number, also search by chatflowId exactly
    const isChatflowId = /^\d{11}$/.test(q);

    const orConditions = [{ name: regex }, { email: regex }];
    if (isChatflowId) {
      orConditions.push({ chatflowId: q });
    }

    const users = await User.find({
      _id: { $ne: req.user._id },
      isVerified: true,
      $or: orConditions,
    }).select('-password');

    res.json({ success: true, users });
  } catch (err) {
    next(err);
  }
}

// ---------------------------------------------------------------------------
// PUT /api/users/profile  (protected, multer handled in route)
// ---------------------------------------------------------------------------
async function updateProfile(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: errors.array()[0].msg });
    }

    const updates = {};

    if (req.body.name !== undefined) updates.name = req.body.name.trim();
    if (req.body.about !== undefined) updates.about = req.body.about.trim();

    if (req.file) {
      updates.avatar = `/uploads/${req.file.filename}`;
    }

    const user = await User.findByIdAndUpdate(req.user._id, updates, {
      new: true,
      runValidators: true,
    }).select('-password');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    res.json({ success: true, message: 'Profile updated successfully.', user });
  } catch (err) {
    next(err);
  }
}

module.exports = { searchUsers, updateProfile };
