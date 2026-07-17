# 🚀 ConnectHub - Real-Time Messaging Application

[![Stack](https://img.shields.io/badge/Stack-MERN%20%2B%20Socket.IO%20%2B%20Redis-blue.svg)](https://github.com/sakibisactive/ConnectHub)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

**ConnectHub** is a production-grade real-time messaging application designed with the MERN stack (MongoDB Atlas, Express.js, React.js, Node.js), Socket.IO WebSocket protocol, and Upstash/In-Memory Redis caching.

---

## 🌟 Key Features

- ⚡ **Real-Time Messaging**: Instant WebSocket bi-directional event delivery powered by Socket.IO.
- 💬 **1-on-1 & Group Chats**: Create individual conversations or group channels with custom avatars.
- 🟢 **Live Presence & Status**: Online, away, and offline presence with 5-second disconnect debouncing.
- ✍️ **Typing Indicators**: Real-time typing status with automatic 2-second debounce prevention.
- 📬 **Message Read Receipts**: Single checkmark (✓ Sent), double checkmark (✓✓ Delivered), and blue double checkmark (✓✓ Read).
- 🔄 **5-Second Undo Send**: Cancel any message within 4 seconds of clicking send.
- 😀 **Emoji Reactions**: React to messages with 👍, ❤️, 😂, 😮, 😢, 🔥 synced live across clients.
- 🔍 **In-Chat Message Search**: Search through conversation histories with matching text highlights.
- 🛡️ **Instructor & Admin Portal**: Master password-protected dashboard for real-time telemetry, broadcast announcements, and CSV data export.
- ⚡ **Redis Multi-Layer Caching**: Automated caching for conversations (10s TTL), user status (15s TTL), and message pagination (60s TTL).

---

## 🏗️ Project Architecture & Monorepo Layout

```
ConnectHub/
├── server/                    # Node.js + Express.js + Socket.IO Backend
│   ├── config/                # DB & Redis service configuration
│   ├── controllers/           # Auth, User, Conversation, Message, Admin controllers
│   ├── middleware/            # JWT authentication & rate limiting
│   ├── models/                # User, Conversation, Message, UserSession, Attachment schemas
│   ├── routes/                # Express API endpoint definitions
│   ├── services/              # Socket.IO event handler service
│   ├── seed/                  # Database seeder script
│   └── server.js              # Server entrypoint
├── client/                    # React (Vite) Frontend SPA
│   ├── src/
│   │   ├── components/        # Auth, Sidebar, Chat, Modals, Admin UI modules
│   │   ├── store/             # Redux Toolkit slices (auth, conversation, socket, ui)
│   │   ├── hooks/             # Custom hooks (useSocket, useAuth, useConversation, etc.)
│   │   ├── utils/             # Axios interceptor & Web Audio sound manager
│   │   └── App.jsx
│   └── index.html
└── CONNECT_HUB_INFO.md        # Technical credentials & MongoDB guide
```

---

## ⚡ Quick Start Guide

### 1. Installation
```bash
# Clone the repository
git clone https://github.com/sakibisactive/ConnectHub.git
cd ConnectHub

# Install monorepo dependencies
npm install && cd server && npm install && cd ../client && npm install && cd ..
```

### 2. Database Population
```bash
# Populate MongoDB Atlas with test users & sample messages
npm run seed
```

### 3. Run Development Server
```bash
# Concurrently launch Express API server and Vite React frontend
npm run dev
```

Frontend will run at `http://localhost:5173` and Backend API at `http://localhost:5000`.

---

## 📄 Documentation & API Guide
See [CONNECT_HUB_INFO.md](file:///home/shiku/ConnectHub/CONNECT_HUB_INFO.md) for full endpoint specifications, MongoDB setup details, and Vercel/Render deployment architecture.
