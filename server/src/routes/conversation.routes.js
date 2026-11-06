'use strict';

const { Router } = require('express');
const auth = require('../middleware/auth');
const { getConversations, startConversation } = require('../controllers/conversation.controller');

const router = Router();

// All conversation routes require authentication
router.use(auth);

// GET /api/conversations
router.get('/', getConversations);

// POST /api/conversations/start
router.post('/start', startConversation);

module.exports = router;
