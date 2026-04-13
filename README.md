# FocusFlow - ADHD Focus Rooms

A web-based focus accountability platform for people with ADHD and focus challenges. Users join 45-minute video-based Pomodoro sessions (focus rooms) where they submit goals at the start, receive encouragement from room captains, and build momentum through structured accountability.

## Quick Start

### Prerequisites

- **Node.js** 22.x LTS
- **MongoDB** 7.0+ (running locally or via Docker)

### 1. Clone the Repository

```bash
git clone https://github.com/sarthak1991/intetiveclone.git
cd intetiveclone
```

### 2. Install Dependencies

```bash
# Install main dependencies
npm install

# Install socket server dependencies
cd server && npm install && cd ..
```

### 3. Start MongoDB

**Option A: Using Docker (Recommended)**
```bash
docker run -d --name mongodb -p 27017:27017 mongo:7.0
```

**Option B: Local MongoDB**
Make sure MongoDB is running on port 27017.

### 4. Environment Setup

Environment files are already included. The default configuration works for local development:

**`.env.local`** (Next.js - already configured)
```env
MONGODB_URI=mongodb://localhost:27017/focusflow
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=3TQHWMym5VCpZ7IrnOU6AFZOTCx3pYlXFbxD8FTdFg=
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SOCKET_URL=http://localhost:3001
```

**`server/.env`** (Socket.IO server - already configured)
```env
PORT=3001
SOCKET_PORT=3001
MONGODB_URI=mongodb://localhost:27017/focusflow
NEXTAUTH_SECRET=3TQHWMym5VCpZ7IrnOU6AFZOTCx3pYlXFbxD8FTdFg=
NEXT_PUBLIC_APP_URL=http://localhost:3000
PUBLIC_IP=localhost
```

### 5. Run the Application

You need **2 terminals** running simultaneously:

**Terminal 1: Start Socket.IO Server**
```bash
cd server
npm start
```
Socket server runs on port 3001.

**Terminal 2: Start Next.js Dev Server**
```bash
npm run dev
```
Next.js runs on port 3000.

### 6. Access the Application

Open your browser:
```
http://localhost:3000
```

## Create Admin User

To create an admin user, run:

```bash
node scripts/create-admin.js
```

Follow the prompts to create an admin account.

## Access from Other Devices on Same Network

To access the app from other devices on your local network:

1. **Find your server's IP address:**
   ```bash
   # On macOS
   ipconfig getifaddr en0
   
   # On Linux
   hostname -I | awk '{print $1}'
   ```

2. **Update environment files:**
   - Replace `localhost` with your IP address (e.g., `192.168.1.10`)
   - Update `.env.local`: `NEXTAUTH_URL`, `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_SOCKET_URL`
   - Update `server/.env`: `NEXT_PUBLIC_APP_URL`, `PUBLIC_IP`

3. **Restart both servers**

4. **Access from other device:**
   ```
   http://YOUR_IP_ADDRESS:3000
   ```

## Project Structure

```
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── (auth)/             # Authentication pages
│   │   ├── admin/              # Admin dashboard
│   │   ├── api/                # API routes
│   │   └── room/               # Room pages
│   ├── components/             # React components
│   ├── hooks/                  # Custom React hooks
│   ├── lib/                    # Utility functions
│   ├── models/                 # Mongoose models
│   └── store/                  # Zustand state management
├── server/
│   ├── socket-server.ts        # Socket.IO server
│   ├── webrtc-server.ts        # WebRTC SFU (mediasoup)
│   ├── presence.ts             # Room presence tracking
│   └── logger.ts               # Logging utilities
└── scripts/
    └── create-admin.js         # Admin user creation script
```

## Features

### User Features
- **Authentication**: Email/Password, Magic Link, Google OAuth
- **Onboarding**: 4-step guided onboarding flow
- **Room Browsing**: View scheduled focus rooms
- **Room Registration**: Join upcoming sessions
- **Video Rooms**: Real-time video with WebRTC
- **Live Chat**: Text chat during sessions
- **Presence Tracking**: See who's in the room
- **Attendance Tracking**: Automatic attendance marking

### Admin Features
- **Room Management**: Create, edit, cancel rooms
- **Captain Assignment**: Assign room captains
- **No-Show Handling**: Mark no-shows and manage waitlists
- **Interest Tags**: Create and manage room interest tags
- **User Management**: View and manage users

## Tech Stack

- **Frontend**: Next.js 16, React 19, TypeScript 5, Tailwind CSS
- **Backend**: Node.js 22, Next.js API Routes, Socket.IO 4.8
- **Database**: MongoDB 7 with Mongoose 8
- **Authentication**: NextAuth.js 4
- **WebRTC**: mediasoup 3.19 (SFU)
- **State Management**: Zustand 4
- **UI Components**: shadcn/ui (Radix UI + Tailwind)

## Troubleshooting

### MongoDB Connection Error
```bash
# Check if MongoDB is running
docker ps | grep mongodb

# Start MongoDB if not running
docker start mongodb
```

### Socket.IO Connection Error
- Make sure socket server is running on port 3001
- Check that `NEXTAUTH_SECRET` matches in both `.env.local` and `server/.env`
- Verify `NEXT_PUBLIC_SOCKET_URL` points to the correct address

### Video Not Working
- Check that mediasoup dependencies are installed: `cd server && npm install`
- Verify TURN/STUN server configuration
- Check browser console for WebRTC errors

### Build Errors
```bash
# Clean and rebuild
rm -rf .next node_modules
npm install
npm run build
```

## Deployment Notes

For production deployment:

1. Update `NEXTAUTH_URL` to your production domain
2. Generate a new secure `NEXTAUTH_SECRET`
3. Use MongoDB Atlas or a hosted MongoDB instance
4. Set up a TURN server for NAT traversal
5. Use PM2 or similar for process management
6. Configure nginx as a reverse proxy
7. Set up SSL certificates with Let's Encrypt

## License

MIT

---

Built with ❤️ for the ADHD community
# intentiveclone2
