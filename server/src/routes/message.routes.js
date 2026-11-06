'use strict';

const { Router } = require('express');
const auth = require('../middleware/auth');
const { uploadImage } = require('../middleware/upload');
const { getMessages, uploadImage: uploadImageCtrl, deleteMessage } = require('../controllers/message.controller');

const router = Router();

// All message routes require authentication
router.use(auth);

// POST /api/messages/upload   — upload a chat image (must be before /:userId to avoid param capture)
router.post('/upload', uploadImage, uploadImageCtrl);

// GET /api/messages/:userId   — paginated message history
router.get('/:userId', getMessages);

// DELETE /api/messages/:id?mode=me|everyone
router.delete('/:id', deleteMessage);

module.exports = router;
