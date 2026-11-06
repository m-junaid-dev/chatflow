'use strict';

const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
// Extension comes from the validated MIME type, never from the client-supplied filename.
const EXT_BY_MIME = { 'image/jpeg': '.jpg', 'image/jpg': '.jpg', 'image/png': '.png', 'image/webp': '.webp' };

/** Multer disk storage — saves files to the uploads/ folder with a UUID name. */
const storage = multer.diskStorage({
  destination: function (_req, _file, cb) {
    cb(null, path.join(__dirname, '../../uploads'));
  },
  filename: function (_req, file, cb) {
    cb(null, `${uuidv4()}${EXT_BY_MIME[file.mimetype] || '.jpg'}`);
  },
});

/** File filter that only accepts jpg, jpeg, png, and webp images. */
function fileFilter(_req, file, cb) {
  if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      Object.assign(new Error('Only jpg, jpeg, png, and webp files are allowed.'), {
        statusCode: 400,
      }),
      false
    );
  }
}

const upload = multer({ storage, fileFilter, limits: { fileSize: MAX_FILE_SIZE } });

/** Single file upload for avatar updates (field name: 'avatar'). */
const uploadAvatar = upload.single('avatar');

/** Single file upload for chat images (field name: 'image'). */
const uploadImage = upload.single('image');

module.exports = { uploadAvatar, uploadImage };
