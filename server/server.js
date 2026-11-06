'use strict';

require('dotenv').config();

const http = require('http');
const express = require('express');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs');

const connectDB = require('./src/config/db');
const errorHandler = require('./src/middleware/error');

const authRoutes = require('./src/routes/auth.routes');
const userRoutes = require('./src/routes/user.routes');
const conversationRoutes = require('./src/routes/conversation.routes');
const messageRoutes = require('./src/routes/message.routes');

const { initSocket } = require('./src/socket/index');

// ---------------------------------------------------------------------------
// Bootstrap
// ---------------------------------------------------------------------------
(async () => {
  // Connect to MongoDB
  await connectDB();

  const app = express();

  // Behind Render/Railway/Vercel proxies: use the real client IP (needed for rate limiting).
  app.set('trust proxy', 1);

  // -------------------------------------------------------------------------
  // Security & utility middleware
  // -------------------------------------------------------------------------
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' }, // allow /uploads to be served cross-origin
      // Works on plain-HTTP hosts too: no forced https upgrade / HSTS (the hosting
      // platform's TLS proxy, if any, takes care of HTTPS).
      hsts: false,
      contentSecurityPolicy: {
        useDefaults: true,
        directives: {
          'upgrade-insecure-requests': null,
          'img-src': ["'self'", 'data:', 'blob:', 'https:'],
          'media-src': ["'self'", 'data:', 'blob:'],
          'connect-src': ["'self'", 'ws:', 'wss:'],
        },
      },
    })
  );

  app.use(
    cors({
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      credentials: true,
    })
  );

  app.use(morgan('dev'));

  // -------------------------------------------------------------------------
  // Body parsers
  // -------------------------------------------------------------------------
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // -------------------------------------------------------------------------
  // Rate limiting for auth routes (100 requests per 15 minutes)
  // -------------------------------------------------------------------------
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      message: 'Too many requests from this IP. Please try again after 15 minutes.',
    },
  });

  // -------------------------------------------------------------------------
  // Static file serving for uploaded images
  // -------------------------------------------------------------------------
  // Make sure the uploads folder exists (it is not shipped in the deploy zip)
  fs.mkdirSync(path.join(__dirname, 'uploads'), { recursive: true });

  app.use(
    '/uploads',
    express.static(path.join(__dirname, 'uploads'), {
      maxAge: '7d',
      etag: true,
    })
  );

  // -------------------------------------------------------------------------
  // API Routes
  // -------------------------------------------------------------------------
  app.use('/api/auth', authLimiter, authRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/conversations', conversationRoutes);
  app.use('/api/messages', messageRoutes);

  // Health check
  app.get('/api/health', (_req, res) => {
    res.json({ success: true, status: 'ok', timestamp: new Date().toISOString() });
  });

  // 404 for unknown API routes
  app.use('/api/*', (_req, res) => {
    res.status(404).json({ success: false, message: 'API route not found.' });
  });

  // -------------------------------------------------------------------------
  // Single-server mode: serve the built React app from ./public (if present).
  // Lets one Node process host API + WebSocket + frontend (e.g. on a 1-server plan).
  // -------------------------------------------------------------------------
  const publicDir = path.join(__dirname, 'public');
  if (fs.existsSync(path.join(publicDir, 'index.html'))) {
    app.use(express.static(publicDir, { maxAge: '1h', index: false }));
    // SPA fallback: any non-API GET returns index.html (React Router handles the path)
    app.get('*', (req, res, next) => {
      if (/^\/(api|uploads|socket\.io)(\/|$)/.test(req.path)) return next();
      res.sendFile(path.join(publicDir, 'index.html'));
    });
    console.log('[Server] Serving frontend from ./public');
  }

  // -------------------------------------------------------------------------
  // Centralized error handler (must be last)
  // -------------------------------------------------------------------------
  app.use(errorHandler);

  // -------------------------------------------------------------------------
  // HTTP Server + Socket.IO
  // -------------------------------------------------------------------------
  const server = http.createServer(app);

  const io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      methods: ['GET', 'POST'],
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  initSocket(io);

  // -------------------------------------------------------------------------
  // Start listening
  // -------------------------------------------------------------------------
  const PORT = process.env.PORT || 5000;
  server.listen(PORT, () => {
    console.log(`[Server] ChatFlow API running on http://localhost:${PORT}`);
    console.log(`[Server] Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`[Server] Demo mode: ${process.env.DEMO_MODE === 'true' || !process.env.EMAIL_USER ? 'ON' : 'OFF'}`);
  });

  // -------------------------------------------------------------------------
  // Graceful shutdown
  // -------------------------------------------------------------------------
  function shutdown(signal) {
    console.log(`\n[Server] Received ${signal}. Shutting down gracefully...`);
    server.close(() => {
      console.log('[Server] HTTP server closed.');
      process.exit(0);
    });
  }

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
})();
