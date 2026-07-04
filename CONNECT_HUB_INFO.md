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

## 🗄️ MongoDB Setup & Permanent Connection URI

```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb+srv://shahriarsakib1205_db_user:oSjwNqTC25MiSj4p@cluster0.kfonus1.mongodb.net/connecthub?retryWrites=true&w=majority&appName=Cluster0
```

### How to Populate Database:
Run the seeder script anytime from your terminal:
```bash
# Populate MongoDB Atlas with 4 test users, conversations, and message history
npm run seed
```

---

## 📱 Feature Summary

### 1. **12-Hour Automatic Message Expiry**
- All messages feature a MongoDB TTL Index (`expires: 43200`) and backend filter.
- Messages are automatically purged 12 hours after being sent.

### 2. **Email OTP Verification & 1 Account per Email**
- **Strict 1 Account per Email**: Validates email uniqueness before sending OTP. Notifies users immediately if the email is already registered.
- **6-Digit Email OTP**: Registration requires entering a 6-digit OTP verification code.

### 3. **Search Users by Email Address**
- User search bar accepts full or partial email addresses (e.g. `sarah@connecthub.com`) or usernames.

### 4. **Updated Receipt Icons & Seen Circle Badge**
- **Receiver Offline**: 1 tick (✓)
- **Receiver Online**: 2 ticks (✓✓)
- **Message Seen / Read**: Small avatar circle badge displayed at the bottom-right corner of the message bubble!

### 5. **Real-Time WebSocket Messaging (Socket.IO)**
- **Typing Indicators**: Real-time debounced typing feedback ("*User is typing...*").
- **Presence Tracking**: Live online / away / offline status indicators.
- **5-Second Undo Send**: 4-second banner allowing users to cancel a message before dispatch.
- **Emoji Reactions**: React to messages with 👍, ❤️, 😂, 😮, 😢, 🔥.

---

## 📡 API Endpoints Reference Table

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/auth/send-otp` | Validate 1 account per email rule & send 6-digit OTP |
| `POST` | `/api/auth/register` | Verify OTP code & complete account registration |
| `POST` | `/api/auth/login` | Validate credentials, issue JWT cookie |
| `POST` | `/api/auth/logout` | Clear cookie, update user status to offline |
| `GET` | `/api/users` | Search registered users by email address or username |
| `GET` | `/api/users/:userId/status` | Get online status and lastSeen |
| `GET` | `/api/conversations` | List user conversations with last message & unread count |
| `POST` | `/api/conversations` | Create new 1-on-1 or group conversation |
| `GET` | `/api/conversations/:id/messages` | Fetch paginated chat history (max 12h age) |
| `POST` | `/api/conversations/:id/messages` | Send message & emit Socket.IO event |
| `PUT` | `/api/messages/:id/read` | Mark message as read & send receipt |
| `POST` | `/api/admin/verify` | Authenticate instructor master password |
| `GET` | `/api/admin/analytics` | Fetch system metrics telemetry |
| `POST` | `/api/admin/broadcast` | Send announcement to all Socket.IO clients |
| `GET` | `/api/admin/export` | Download message history as CSV file |
