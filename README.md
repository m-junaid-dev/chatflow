# 💬 ChatFlow — WhatsApp-Style Real-Time Chat App

A production-quality, full-stack real-time messaging application built with React 18, Node.js, Socket.IO, and MongoDB. Features email OTP authentication, real-time messaging, delivery/read receipts, typing indicators, image sharing, dark mode, and more.

---

## ✨ Feature List

### Authentication
- 📧 Email OTP verification (6-digit, 5-min expiry, hashed storage)
- 🔐 JWT authentication (7-day expiry)
- 🔑 Forgot/Reset password via OTP
- 🛡️ bcrypt password hashing, rate limiting, input validation
- 📧 OTP is emailed by default; optional **demo account** (checkbox on Register) shows the OTP on screen for testing

### Messaging
- ⚡ Real-time one-to-one messaging via Socket.IO
- 📜 Infinite-scroll message history (30 per page, upward scroll)
- ✅ Delivery receipts: sent → delivered → read (WhatsApp-style ticks)
- 💬 Typing indicators with auto-stop after 1.5s
- 🟢 Online/offline status with "last seen" timestamps
- 🔢 Unread message badge per conversation

### Premium Features
- 💬 Reply to messages (quoted preview in bubble)
- 🗑️ Delete for Me / Delete for Everyone
- 😀 Emoji picker
- 🖼️ Image sharing (up to 5 MB, jpg/png/webp, preview before send)
- 📅 Date separators (Today, Yesterday, date)
- 👤 Profile: avatar upload, name, About text
- 🌙 Dark / Light mode toggle (persisted)
- 🔔 Notification sound + browser notifications (background tab)
- 🎨 Message grouping, bubble animations, tick color transitions

### UI/UX
- 📱 Fully responsive (mobile, tablet, desktop)
- 🎨 Modern teal-to-emerald gradient, glassmorphism, Inter font
- 🖼️ Subtle doodle-pattern chat wallpaper
- 💀 Skeleton loaders, empty states, toast notifications
- ♿ Accessible: focus states, aria-labels, keyboard navigation

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, Tailwind CSS, Framer Motion |
| State | Zustand |
| Real-time | Socket.IO (client + server) |
| HTTP | Axios |
| Backend | Node.js, Express.js |
| Database | MongoDB + Mongoose |
| Auth | JWT, bcryptjs |
| Email | Nodemailer (Gmail SMTP) |
| File Upload | Multer |
| Security | helmet, cors, express-rate-limit, express-validator |

---

## 📁 Folder Structure

```
chat-app/
├── package.json              # Root: runs both server + client
├── .gitignore
├── README.md
│
├── server/                   # Node.js backend
│   ├── server.js             # Entry point
│   ├── package.json
│   ├── .env.example
│   ├── uploads/              # Uploaded images (gitignored)
│   └── src/
│       ├── config/
│       │   ├── db.js         # MongoDB connection
│       │   └── mail.js       # Nodemailer transporter
│       ├── models/
│       │   ├── User.js
│       │   ├── Otp.js
│       │   ├── Conversation.js
│       │   └── Message.js
│       ├── middleware/
│       │   ├── auth.js       # JWT verification
│       │   ├── error.js      # Centralized error handler
│       │   └── upload.js     # Multer config
│       ├── routes/
│       │   ├── auth.routes.js
│       │   ├── user.routes.js
│       │   ├── conversation.routes.js
│       │   └── message.routes.js
│       ├── controllers/
│       │   ├── auth.controller.js
│       │   ├── user.controller.js
│       │   ├── conversation.controller.js
│       │   └── message.controller.js
│       ├── socket/
│       │   └── index.js      # Socket.IO event handlers
│       └── utils/
│           ├── otp.js        # OTP generation & verification
│           └── sendEmail.js  # Email sending with HTML template
│
└── client/                   # React frontend
    ├── index.html
    ├── package.json
    ├── vite.config.js
    ├── tailwind.config.js
    ├── postcss.config.js
    ├── .env.example
    └── src/
        ├── main.jsx
        ├── App.jsx
        ├── index.css
        ├── lib/
        │   ├── api.js        # Axios instance
        │   └── socket.js     # Socket.IO client
        ├── store/
        │   ├── authStore.js  # Auth state (Zustand)
        │   ├── chatStore.js  # Chat state (Zustand)
        │   └── themeStore.js # Theme state (Zustand)
        ├── pages/
        │   ├── Login.jsx
        │   ├── Register.jsx
        │   ├── VerifyOtp.jsx
        │   ├── ForgotPassword.jsx
        │   └── Chat.jsx
        └── components/
            ├── Sidebar.jsx
            ├── ChatList.jsx
            ├── ChatWindow.jsx
            ├── MessageBubble.jsx
            ├── Composer.jsx
            ├── TypingDots.jsx
            ├── Avatar.jsx
            ├── OtpInput.jsx
            ├── ProfileDrawer.jsx
            ├── EmojiPopover.jsx
            ├── ImagePreview.jsx
            ├── SkeletonLoader.jsx
            ├── Toast.jsx
            └── DateSeparator.jsx
```

---

## 📋 Prerequisites

- **Node.js** v18+ ([nodejs.org](https://nodejs.org))
- **npm** v9+
- **MongoDB** — local install or [MongoDB Atlas](https://www.mongodb.com/atlas) (free tier)
- **Gmail account** with an App Password (for OTP emails) — or just use `DEMO_MODE=true`

---

## 🚀 Local Setup (Step by Step)

### 1. Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/chatflow.git
cd chatflow
```

### 2. Install All Dependencies

```bash
# Install root scripts tool
npm install

# Install server dependencies
cd server && npm install && cd ..

# Install client dependencies
cd client && npm install && cd ..

# Or all at once from root:
npm run install:all
```

### 3. Configure the Backend

```bash
cd server
cp .env.example .env
```

Edit `server/.env`:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/chatflow
JWT_SECRET=your_super_secret_jwt_key_minimum_32_chars
CLIENT_URL=http://localhost:5173
EMAIL_USER=your_gmail@gmail.com
EMAIL_PASS=your_16_char_app_password
DEMO_MODE=true
```

> **Tip:** For quick demo, set `DEMO_MODE=true` — OTPs will appear in the server console and in the UI banner. No email setup needed.

### 4. Configure the Frontend

```bash
cd client
cp .env.example .env
```

Edit `client/.env`:

```env
# Local development: leave both empty (the Vite proxy handles it, phone access works too)
# Production only:
# VITE_API_URL=https://your-backend.example.com/api
# VITE_SOCKET_URL=https://your-backend.example.com
```

### 5. Start MongoDB (if using local)

```bash
mongod --dbpath /data/db
# or on Windows:
mongod
```

### 6. Run the App

```bash
# From root directory — runs both server and client:
npm run dev

# Or separately:
npm run dev:server   # Backend on http://localhost:5000
npm run dev:client   # Frontend on http://localhost:5173
```

Open **http://localhost:5173** in your browser. 🎉

---

## 🔑 Environment Variables Explained

### Server (`server/.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `PORT` | No | Server port (default: 5000) |
| `MONGODB_URI` | **Yes** | MongoDB connection string |
| `JWT_SECRET` | **Yes** | Secret key for JWT signing (min 32 chars) |
| `CLIENT_URL` | **Yes** | Frontend URL for CORS (e.g., http://localhost:5173) |
| `EMAIL_USER` | No* | Gmail address for sending OTPs |
| `EMAIL_PASS` | No* | Gmail App Password (16 chars, no spaces) |
| `DEMO_MODE` | No | Server-wide demo: `true` = never send email, OTP on screen for everyone. Keep `false` normally. |
| `ALLOW_DEMO_ACCOUNTS` | No | `true` shows a **"Set up as demo account"** option on Register. Only demo accounts get their OTP on screen; all other accounts get it by **email**. Anyone can read a demo account's OTP, so set `false` on public deployments. |

*Not required if `DEMO_MODE=true`

### Client (`client/.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_API_URL` | Production only | Backend API URL (leave empty locally) |
| `VITE_SOCKET_URL` | Production only | Backend Socket.IO URL (leave empty locally) |

---

## 📧 Gmail App Password Setup

1. Go to [myaccount.google.com](https://myaccount.google.com)
2. **Security** → **2-Step Verification** (enable it if not already)
3. **Security** → **App passwords**
4. Select app: **Mail**, device: **Other** (type "ChatFlow")
5. Click **Generate** → copy the 16-character password
6. Paste into `EMAIL_PASS` in your `.env` (no spaces)

---

## 📡 API Documentation

### Auth Endpoints (`/api/auth`)

| Method | Endpoint | Body | Auth | Description |
|--------|----------|------|------|-------------|
| POST | `/register` | `{name, email, password}` | No | Register user, send OTP |
| POST | `/verify-otp` | `{email, otp, purpose}` | No | Verify OTP, get JWT |
| POST | `/resend-otp` | `{email, purpose}` | No | Resend OTP (60s cooldown) |
| POST | `/login` | `{email, password}` | No | Login, get JWT |
| POST | `/forgot-password` | `{email}` | No | Send reset OTP |
| POST | `/reset-password` | `{email, otp, newPassword}` | No | Reset password |
| GET | `/me` | — | **Yes** | Get current user |

### User Endpoints (`/api/users`)

| Method | Endpoint | Query/Body | Auth | Description |
|--------|----------|------------|------|-------------|
| GET | `/` | `?search=query` | **Yes** | Search users by name/email |
| PUT | `/profile` | `{name, about, avatar(file)}` | **Yes** | Update profile |

### Conversation Endpoints (`/api/conversations`)

| Method | Endpoint | Body | Auth | Description |
|--------|----------|------|------|-------------|
| GET | `/` | — | **Yes** | Get all conversations |
| POST | `/start` | `{receiverId}` | **Yes** | Start/get conversation |

### Message Endpoints (`/api/messages`)

| Method | Endpoint | Query/Body | Auth | Description |
|--------|----------|------------|------|-------------|
| GET | `/:userId` | `?page=1&limit=30` | **Yes** | Get messages with user |
| POST | `/upload` | `image(file)` | **Yes** | Upload image |
| DELETE | `/:id` | `?mode=me\|everyone` | **Yes** | Delete message |

---

## ⚡ Socket.IO Events

### Client → Server

| Event | Payload | Description |
|-------|---------|-------------|
| `message:send` | `{receiverId, text, image, replyTo, tempId}` | Send a message |
| `typing:start` | `{receiverId}` | User started typing |
| `typing:stop` | `{receiverId}` | User stopped typing |
| `message:read` | `{conversationId, senderId}` | Mark messages as read |
| `message:delete` | `{messageId, mode}` | Delete a message |

### Server → Client

| Event | Payload | Description |
|-------|---------|-------------|
| `message:new` | `{message}` | New message received |
| `message:sent` | `{tempId, message}` | Confirm sent (to sender) |
| `message:delivered` | `{messageId, status}` | Message delivered |
| `message:read` | `{conversationId, readBy}` | Messages marked read |
| `message:deleted` | `{messageId, deletedForEveryone}` | Message deleted |
| `typing` | `{senderId, isTyping}` | Typing status change |
| `user:online` | `{userId}` | User came online |
| `user:offline` | `{userId, lastSeen}` | User went offline |

---

## 🖼️ Screenshots

> _Add screenshots here after running the app_

| Auth | Chat | Mobile |
|------|------|--------|
| Login page | Main chat | Mobile view |
| OTP verify | Dark mode | Profile drawer |

---

## 🌐 Deployment Guide

### Database: MongoDB Atlas (Free)

1. Create account at [mongodb.com/atlas](https://mongodb.com/atlas)
2. Create a free M0 cluster
3. **Database Access**: create a user with password
4. **Network Access**: Add `0.0.0.0/0` (allow all)
5. Click **Connect** → **Connect your application** → copy URI
6. Replace `MONGODB_URI` with Atlas URI (include username/password)

### Backend: Render (Free Tier)

1. Push code to GitHub
2. Go to [render.com](https://render.com) → **New Web Service**
3. Connect your GitHub repo
4. Settings:
   - **Root Directory**: `server`
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
5. Add environment variables (all from `server/.env`)
6. Deploy! (Note: WebSockets work on Render)
7. Copy your Render URL (e.g., `https://chatflow-api.onrender.com`)

> ⚠️ **Railway** is an alternative: faster cold starts, WebSocket support, $5 free credit/month.

### Frontend: Vercel (Free)

1. Go to [vercel.com](https://vercel.com) → **Add New Project**
2. Import your GitHub repo
3. Settings:
   - **Framework Preset**: Vite
   - **Root Directory**: `client`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. **Environment Variables**:
   ```
   VITE_API_URL=https://chatflow-api.onrender.com/api
   VITE_SOCKET_URL=https://chatflow-api.onrender.com
   ```
5. Deploy!

> 💡 **Netlify** alternative: same settings, set publish directory to `client/dist`.

---

## 🎬 Demo Script (Two-Browser Test)

### Setup
1. Open **Browser A** (e.g., Chrome) and **Browser B** (e.g., Firefox or incognito)
2. Both navigate to `http://localhost:5173`

### Step-by-Step Demo

#### 1. Registration & OTP (Browser A)
1. Click **Sign up** → fill in name, email (e.g., `alice@test.com`), password
2. Submit → OTP screen appears
3. If `DEMO_MODE=true`: OTP shown in yellow banner → enter it
4. Or check server console for OTP
5. Enter OTP in 6 boxes → success animation → chat opens

#### 2. Register Second User (Browser B)
1. Register `bob@test.com`
2. Verify OTP same way

#### 3. Start a Conversation
- **Browser A (Alice)**: Search "Bob" in sidebar search bar → click → "Start Chat"
- Conversation opens

#### 4. Real-Time Messaging
- Alice types "Hello Bob!" and hits Enter
- Bob sees the message appear instantly in Browser B
- Single grey tick on Alice's side → turns double grey (delivered) when Bob is online

#### 5. Typing Indicator
- Bob starts typing in the reply box
- Alice sees "typing..." in the chat header
- After Bob stops, it disappears

#### 6. Read Receipts
- Bob opens Alice's message (opens the conversation)
- Alice's ticks turn **blue** — read!

#### 7. Online Status
- Close Browser B (Bob goes offline)
- Alice sees Bob's status change to "last seen just now"

#### 8. Reply to a Message
- Right-click / long-press a message → **Reply**
- Quoted preview appears above composer
- Send reply — shows as thread-style quoted bubble

#### 9. Delete a Message
- Right-click your own message → **Delete for Everyone**
- Both browsers show "This message was deleted"

#### 10. Image Sharing
- Click the 📎 image button in composer
- Select a jpg/png (max 5MB) → preview appears
- Send → image shows in chat → click to enlarge

#### 11. Emoji Picker
- Click the 😊 button → emoji picker opens
- Click an emoji → appears in composer

#### 12. Dark Mode
- Click the moon/sun icon in sidebar header
- Entire app switches theme, saved for next visit

#### 13. Profile
- Click your avatar → **Profile**
- Edit name, About text, upload avatar photo

#### 14. Background Notifications
- Switch to a different browser tab
- Bob sends a message to Alice
- Browser notification appears + notification sound plays

---

## 🔧 Troubleshooting

| Problem | Solution |
|---------|----------|
| `ECONNREFUSED` on MongoDB | Start MongoDB: `mongod` or check Atlas IP whitelist |
| OTP not received by email | Set `DEMO_MODE=true` and check server console |
| CORS errors | Ensure `CLIENT_URL` in server `.env` matches frontend URL exactly |
| Socket not connecting | Locally keep `VITE_SOCKET_URL` empty; in production check it points to the backend |
| Works on laptop but not on phone | Phone must be on the same Wi-Fi; open `http://<laptop-IPv4>:5173` (not localhost); allow Node.js through Windows Firewall (Private networks) |
| Images not loading | Check `uploads/` folder exists and server static file route |
| Rate limit errors | Wait 15 minutes or restart server (limit resets) |
| JWT expired | Logout and login again |
| Port already in use | Change `PORT` in server `.env` or kill the process |

---

## 📝 GitHub Setup

```bash
# Initialize repo
cd chat-app
git init
git add .
git commit -m "feat: initial ChatFlow implementation"

# Create repo on GitHub (github.com/new) then:
git remote add origin https://github.com/YOUR_USERNAME/chatflow.git
git branch -M main
git push -u origin main
```

> 🔒 Never commit `.env` files. They're in `.gitignore`.

---

## 🏗️ Assumptions & Notes

1. **MongoDB**: Assumed local MongoDB for dev; Atlas URI can be swapped in `.env`
2. **Gmail SMTP**: App Password required (not regular password) due to Google security
3. **Image storage**: Files saved to `server/uploads/` — for production use AWS S3 or Cloudinary
4. **Demo Mode**: When `DEMO_MODE=true`, OTP appears in server logs AND in API response as `demoOtp`, displayed in a UI banner
5. **Single device sessions**: JWT stored in localStorage; multiple tabs share the same socket connection pool
6. **Message pagination**: 30 messages per page, oldest load first, newer messages at bottom
7. **Notification sound**: Browser requires user interaction before playing audio; first click anywhere enables it
8. **Rate limiting**: 100 requests per 15 minutes on auth routes; adjust in `server.js`

---

## 📄 License

MIT © 2024 ChatFlow

---

*Built with ❤️ using React, Node.js, Socket.IO, and MongoDB*
