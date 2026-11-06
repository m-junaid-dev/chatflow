'use strict';

const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Message = require('../models/Message');
const Conversation = require('../models/Conversation');

/**
 * In-memory map of userId → Set<socketId>.
 */
const userSockets = new Map();

function isUserOnline(userId) {
  const sockets = userSockets.get(String(userId));
  return !!(sockets && sockets.size > 0);
}

/**
 * Populate a conversation fully (participants + lastMessage).
 */
async function populateConversation(convId) {
  return Conversation.findById(convId)
    .populate('participants', 'name email avatar isOnline lastSeen about chatflowId')
    .populate({
      path: 'lastMessage',
      select: 'text image createdAt sender status deletedForEveryone',
    });
}

function initSocket(io) {
  // ── Auth middleware ──────────────────────────────────────────────────────
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error('Authentication error: no token provided.'));

      let decoded;
      try {
        decoded = jwt.verify(token, process.env.JWT_SECRET);
      } catch {
        return next(new Error('Authentication error: invalid or expired token.'));
      }

      const user = await User.findById(decoded.id);
      if (!user) return next(new Error('Authentication error: user not found.'));

      socket.user = user;
      next();
    } catch (err) {
      next(new Error('Authentication error: ' + err.message));
    }
  });

  // ── Connection ───────────────────────────────────────────────────────────
  io.on('connection', async (socket) => {
    const userId = String(socket.user._id);
    console.log(`[Socket] Connected: ${socket.user.name} (${userId}) socketId=${socket.id}`);

    // Track socket
    if (!userSockets.has(userId)) userSockets.set(userId, new Set());
    userSockets.get(userId).add(socket.id);

    // Mark online
    await User.findByIdAndUpdate(userId, { isOnline: true });

    // Join personal room
    socket.join(userId);

    // Mark pending 'sent' messages as 'delivered'
    try {
      const pendingMessages = await Message.find({ receiver: userId, status: 'sent' });

      if (pendingMessages.length > 0) {
        const updatedIds = pendingMessages.map((m) => m._id);
        await Message.updateMany({ _id: { $in: updatedIds } }, { status: 'delivered' });

        const senderMap = new Map();
        for (const msg of pendingMessages) {
          const sid = String(msg.sender);
          if (!senderMap.has(sid)) senderMap.set(sid, []);
          senderMap.get(sid).push(String(msg._id));
        }

        for (const [senderId, messageIds] of senderMap.entries()) {
          io.to(senderId).emit('message:delivered', { messageIds, deliveredTo: userId });
        }
      }
    } catch (err) {
      console.error('[Socket] Error on connect delivery:', err.message);
    }

    // Broadcast online status
    io.emit('user:online', { userId, isOnline: true });

    // ── message:send ─────────────────────────────────────────────────────
    socket.on('message:send', async (payload) => {
      try {
        const { receiverId, text, image, replyTo, tempId } = payload || {};

        if (!receiverId) return socket.emit('error', { message: 'receiverId is required.' });
        if (!text && !image) return socket.emit('error', { message: 'Message must have text or an image.' });

        // Find or create conversation
        let conversation = await Conversation.findOne({
          participants: { $all: [userId, receiverId], $size: 2 },
        });

        const isNewConversation = !conversation;

        if (!conversation) {
          conversation = await Conversation.create({ participants: [userId, receiverId] });
        }

        const receiverOnline = isUserOnline(receiverId);
        const status = receiverOnline ? 'delivered' : 'sent';

        // Create message
        const message = await Message.create({
          conversationId: conversation._id,
          sender: userId,
          receiver: receiverId,
          text: text || null,
          image: image || null,
          replyTo: replyTo || null,
          status,
        });

        // Populate sender + replyTo
        await message.populate('sender', 'name avatar chatflowId');
        if (replyTo) {
          await message.populate({
            path: 'replyTo',
            select: 'text image sender',
            populate: { path: 'sender', select: 'name' },
          });
        }

        // Update conversation metadata
        const unreadKey = receiverId;
        const currentUnread = conversation.unreadCount.get(unreadKey) || 0;
        conversation.lastMessage = message._id;
        conversation.updatedAt = new Date();
        conversation.unreadCount.set(unreadKey, currentUnread + 1);
        await conversation.save();

        // Populate full conversation for broadcasting (needed for sidebar update)
        const populatedConv = await populateConversation(conversation._id);

        // Emit message:new to receiver
        io.to(receiverId).emit('message:new', {
          message,
          conversation: populatedConv,
          isNewConversation,
        });

        // Emit message:sent back to sender (for dedup + sidebar update)
        socket.emit('message:sent', {
          tempId,
          message,
          conversation: populatedConv,
          isNewConversation,
        });

      } catch (err) {
        console.error('[Socket] message:send error:', err.message);
        socket.emit('error', { message: 'Failed to send message.' });
      }
    });

    // ── typing:start ──────────────────────────────────────────────────────
    socket.on('typing:start', ({ receiverId } = {}) => {
      if (!receiverId) return;
      io.to(receiverId).emit('typing', { senderId: userId, isTyping: true });
    });

    // ── typing:stop ───────────────────────────────────────────────────────
    socket.on('typing:stop', ({ receiverId } = {}) => {
      if (!receiverId) return;
      io.to(receiverId).emit('typing', { senderId: userId, isTyping: false });
    });

    // ── message:read ──────────────────────────────────────────────────────
    socket.on('message:read', async (payload) => {
      try {
        const { conversationId, senderId } = payload || {};
        if (!conversationId || !senderId) return;

        await Message.updateMany(
          { conversationId, sender: senderId, receiver: userId, status: { $ne: 'read' } },
          { status: 'read' }
        );

        await Conversation.findByIdAndUpdate(conversationId, {
          $set: { [`unreadCount.${userId}`]: 0 },
        });

        io.to(senderId).emit('message:read', { conversationId, readBy: userId });
      } catch (err) {
        console.error('[Socket] message:read error:', err.message);
      }
    });

    // ── message:delete ────────────────────────────────────────────────────
    socket.on('message:delete', async (payload) => {
      try {
        const { messageId, mode } = payload || {};
        if (!messageId || !['me', 'everyone'].includes(mode)) {
          return socket.emit('error', { message: 'messageId and valid mode are required.' });
        }

        const message = await Message.findById(messageId);
        if (!message) return socket.emit('error', { message: 'Message not found.' });

        if (mode === 'me') {
          if (!message.deletedFor.map(String).includes(userId)) {
            message.deletedFor.push(socket.user._id);
            await message.save();
          }
        } else {
          if (String(message.sender) !== userId) {
            return socket.emit('error', { message: 'Only the sender can delete for everyone.' });
          }
          message.deletedForEveryone = true;
          await message.save();
        }

        const senderId = String(message.sender);
        const receiverId = String(message.receiver);
        io.to(senderId).emit('message:deleted', { messageId, mode });
        io.to(receiverId).emit('message:deleted', { messageId, mode });
      } catch (err) {
        console.error('[Socket] message:delete error:', err.message);
        socket.emit('error', { message: 'Failed to delete message.' });
      }
    });

    // ── Disconnect ────────────────────────────────────────────────────────
    socket.on('disconnect', async () => {
      console.log(`[Socket] Disconnected: ${socket.user.name} (${userId}) socketId=${socket.id}`);

      const sockets = userSockets.get(userId);
      if (sockets) {
        sockets.delete(socket.id);
        if (sockets.size === 0) userSockets.delete(userId);
      }

      if (!isUserOnline(userId)) {
        const lastSeen = new Date();
        await User.findByIdAndUpdate(userId, { isOnline: false, lastSeen });
        io.emit('user:offline', { userId, lastSeen });
      }
    });
  });
}

module.exports = { initSocket, userSockets, isUserOnline };
