'use strict';

/**
 * Centralized Express error-handling middleware.
 * Handles Mongoose ValidationError, CastError (bad ObjectId → 404),
 * and duplicate key errors (409). All others fall through as 500.
 */
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal server error.';

  // Mongoose validation error (e.g. required field missing)
  if (err.name === 'ValidationError') {
    statusCode = 400;
    const messages = Object.values(err.errors).map((e) => e.message);
    message = messages.join('. ');
  }

  // Mongoose bad ObjectId cast (document not found by malformed id)
  if (err.name === 'CastError') {
    statusCode = 404;
    message = `Resource not found.`;
  }

  // MongoDB duplicate key (e.g. unique email)
  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    message = `A record with that ${field} already exists.`;
  }

  // JWT errors — handled in auth middleware but kept here as safety net
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token.';
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired.';
  }

  if (process.env.NODE_ENV !== 'production') {
    console.error(`[ERROR] ${statusCode} - ${message}`);
    if (statusCode === 500) console.error(err.stack);
  }

  res.status(statusCode).json({ success: false, message });
}

module.exports = errorHandler;
