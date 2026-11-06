'use strict';

const Conversation = require('../models/Conversation');

// ---------------------------------------------------------------------------
// GET /api/conversations   (protected)
// ---------------------------------------------------------------------------
async function getConversations(req, res, next) {
  try {
    const conversations = await Conversation.find({
      participants: req.user._id,
    })
      .populate('participants', 'name email avatar isOnline lastSeen about')
      .populate('lastMessage', 'text image createdAt sender status deletedForEveryone')
      .sort({ updatedAt: -1 });

    res.json({ success: true, conversations });
  } catch (err) {
    next(err);
  }
}

// ---------------------------------------------------------------------------
// POST /api/conversations/start   (protected)
// ---------------------------------------------------------------------------
async function startConversation(req, res, next) {
  try {
    const { receiverId } = req.body;

    if (!receiverId) {
      return res.status(400).json({ success: false, message: 'receiverId is required.' });
    }

    if (receiverId === String(req.user._id)) {
      return res.status(400).json({ success: false, message: 'Cannot start a conversation with yourself.' });
    }

    // Check if a conversation already exists between the two participants
    let conversation = await Conversation.findOne({
      participants: { $all: [req.user._id, receiverId], $size: 2 },
    })
      .populate('participants', 'name email avatar isOnline lastSeen about')
      .populate('lastMessage', 'text image createdAt sender status deletedForEveryone');

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [req.user._id, receiverId],
      });

      conversation = await Conversation.findById(conversation._id)
        .populate('participants', 'name email avatar isOnline lastSeen about')
        .populate('lastMessage', 'text image createdAt sender status deletedForEveryone');
    }

    res.status(200).json({ success: true, conversation });
  } catch (err) {
    next(err);
  }
}

module.exports = { getConversations, startConversation };
