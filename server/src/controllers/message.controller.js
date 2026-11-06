'use strict';

const mongoose = require('mongoose');
const Message = require('../models/Message');
const Conversation = require('../models/Conversation');

// ---------------------------------------------------------------------------
// GET /api/messages/:userId   (protected, paginated)
// ---------------------------------------------------------------------------
async function getMessages(req, res, next) {
  try {
    const { userId } = req.params;
    const currentUserId = req.user._id;

    // Parse pagination params
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, parseInt(req.query.limit, 10) || 30);
    const skip = (page - 1) * limit;

    // Find or create conversation
    let conversation = await Conversation.findOne({
      participants: { $all: [currentUserId, userId], $size: 2 },
    });

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [currentUserId, userId],
      });
    }

    // Fetch paginated messages, excluding those deleted for the current user
    const messages = await Message.find({
      conversationId: conversation._id,
      deletedFor: { $nin: [currentUserId] },
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('sender', 'name avatar')
      .populate({
        path: 'replyTo',
        select: 'text image sender',
        populate: { path: 'sender', select: 'name' },
      });

    const total = await Message.countDocuments({
      conversationId: conversation._id,
      deletedFor: { $nin: [currentUserId] },
    });

    res.json({
      success: true,
      conversationId: conversation._id,
      messages: messages.reverse(), // return oldest-first
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: skip + messages.length < total,
      },
    });
  } catch (err) {
    next(err);
  }
}

// ---------------------------------------------------------------------------
// POST /api/messages/upload   (protected, multer handled in route)
// ---------------------------------------------------------------------------
async function uploadImage(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded.' });
    }

    const imageUrl = `/uploads/${req.file.filename}`;
    res.json({ success: true, imageUrl });
  } catch (err) {
    next(err);
  }
}

// ---------------------------------------------------------------------------
// DELETE /api/messages/:id?mode=me|everyone   (protected)
// ---------------------------------------------------------------------------
async function deleteMessage(req, res, next) {
  try {
    const { id } = req.params;
    const { mode } = req.query;
    const currentUserId = String(req.user._id);

    if (!['me', 'everyone'].includes(mode)) {
      return res.status(400).json({ success: false, message: 'mode must be "me" or "everyone".' });
    }

    const message = await Message.findById(id);
    if (!message) {
      return res.status(404).json({ success: false, message: 'Message not found.' });
    }

    if (mode === 'me') {
      // Add current user to deletedFor if not already there
      if (!message.deletedFor.map(String).includes(currentUserId)) {
        message.deletedFor.push(req.user._id);
        await message.save();
      }
    } else {
      // mode === 'everyone' — only the sender can do this
      if (String(message.sender) !== currentUserId) {
        return res.status(403).json({ success: false, message: 'Only the sender can delete for everyone.' });
      }
      message.deletedForEveryone = true;
      await message.save();
    }

    res.json({ success: true, message: 'Message deleted.', id });
  } catch (err) {
    next(err);
  }
}

module.exports = { getMessages, uploadImage, deleteMessage };
