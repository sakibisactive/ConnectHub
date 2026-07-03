# 🌐 ConnectHub - Complete Project Details & Guide

ConnectHub is a full-stack real-time messaging web application built with the MERN stack (**MongoDB**, **Express.js**, **React.js**, **Node.js**), **Socket.IO** for instant WebSocket communication, **Redis** caching for high performance, and state management powered by **Redux Toolkit**.

---

## 🔑 Demo Login Credentials & Accounts

The database seeder pre-populates four test accounts. You can also click the quick demo buttons on the landing page!

| Username | Email Address | Password | Role / Details | Initial Status |
| :--- | :--- | :--- | :--- | :--- |
| **`alex_dev`** | `alex@connecthub.com` | `password123` | Software Engineer | 🟢 Online |
| **`sarah_design`** | `sarah@connecthub.com` | `password123` | UI/UX Designer | 🟢 Online |
| **`john_admin`** | `john@connecthub.com` | `password123` | System Administrator | 🟡 Away |
| **`emily_tech`** | `emily@connecthub.com` | `password123` | Technical Lead | ⚪ Offline |

### 🛡️ Instructor & Admin Master Password
- **Master Admin Password**: `connecthub_admin_2026`
- **Access Location**: Click the **Shield Icon (🛡️)** in the sidebar header to open the Instructor & Admin Telemetry Portal.

---

## 🗄️ MongoDB Setup Instructions

```
# MongoDB Atlas Connection URI Space
MONGO_URI=mongodb+srv://shahriarsakib1205_db_user:oSjwNqTC25MiSj4p@cluster0.4bvn9ac.mongodb.net/connecthub?retryWrites=true&w=majority&appName=Cluster0
```

### How to Populate Database:
Once your MongoDB Atlas cluster network access is active, run the seeder script from your terminal:
```bash
# Populate MongoDB Atlas with 4 test users, conversations, and message history
npm run seed
```

---

## 📱 Website & Feature Summary

### 1. **Authentication & Security**
- **Tabbed Login & Registration Page**: The default landing screen for unauthenticated users.
- **Security**: Passwords hashed using `bcryptjs` with salt rounds of 10. HTTP-only JWT cookies set with `sameSite=strict`.
- **Input Sanitization & Rate Limiting**: Max 300 requests per 15 minutes via `express-rate-limit`.

### 2. **Real-Time WebSocket Messaging (Socket.IO)**
- **Instant Delivery**: Sub-millisecond message delivery across active room channels.
- **Typing Indicators**: Real-time debounced typing feedback ("*User is typing...*").
- **Presence Tracking**: Live online / away / offline indicators broadcast with network fluctuation debouncing (5-second recovery window).
- **Read Receipts**: Single checkmark (✓ Sent), double checkmark (✓✓ Delivered), and blue double checkmark (✓✓ Read).
- **5-Second Undo Send**: 4-second banner allowing users to cancel a message before dispatch.
- **Emoji Reactions**: Popover on hover to react to messages with 👍, ❤️, 😂, 😮, 😢, 🔥.

### 3. **Redis Multi-Layer Caching Strategy**
- **Conversation List Cache**: `conversations:${userId}` (10s TTL).
- **User Status Cache**: `user:status:${userId}` (15s TTL).
- **Message History Cache**: `messages:${conversationId}:${page}` (60s TTL).
- **Socket Map Storage**: `userSocketMap` tracked in Redis with memory fallback for 100% standalone availability.

### 4. **Instructor & Admin Master Portal**
- Accessible via master password (`connecthub_admin_2026`).
- Real-time analytics: Active online users, total messages sent today, average response time.
- System-Wide Broadcasts: Emit instant banner notifications to all connected WebSocket clients.
- Audit Log Export: One-click CSV export of chat history.

### 5. **PWA & Audio Features**
- Web Audio API sound synthesizer for gentle incoming message chimes.
- PWA Service Worker (`sw.js`) and Web Manifest (`manifest.json`).

---

## 🚀 Deployment Guide

### Backend Deployment (Render / Railway)
1. Environment Variables required:
   - `PORT=5000`
   - `MONGO_URI`
   - `REDIS_URL`
   - `JWT_SECRET`
   - `CORS_ORIGIN` (Your Vercel frontend domain)
2. Deploy as a persistent Web Service.

### Frontend Deployment (Vercel)
1. Connect GitHub repository `https://github.com/sakibisactive/ConnectHub.git`.
2. Framework Preset: **Vite**.
3. Build Command: `npm run build` inside `client/`.

---

## 📡 API Endpoints Reference Table

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Register new user, hash password, set JWT cookie |
| `POST` | `/api/auth/login` | Validate credentials, issue JWT cookie |
| `POST` | `/api/auth/logout` | Clear cookie, update user status to offline |
| `GET` | `/api/users` | List registered users with search filter |
| `GET` | `/api/users/:userId/status` | Get online status and lastSeen |
| `GET` | `/api/conversations` | List user conversations with last message & unread count |
| `POST` | `/api/conversations` | Create new 1-on-1 or group conversation |
| `GET` | `/api/conversations/:id/messages` | Fetch paginated chat history |
| `POST` | `/api/conversations/:id/messages` | Send message & emit Socket.IO event |
| `PUT` | `/api/messages/:id/read` | Mark message as read & send receipt |
| `POST` | `/api/admin/verify` | Authenticate instructor master password |
| `GET` | `/api/admin/analytics` | Fetch system metrics telemetry |
| `POST` | `/api/admin/broadcast` | Send announcement to all Socket.IO clients |
| `GET` | `/api/admin/export` | Download message history as CSV file |
