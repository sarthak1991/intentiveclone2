# 🔧 Authentication Fix - MongoDB Adapter

## Problem Solved ✅

**Error:** `E-mail login requires an adapter`  
**Cause:** NextAuth.js requires a database adapter to persist user accounts and sessions  
**Solution:** Added MongoDB adapter to NextAuth configuration

---

## What Was Fixed

### 1. Installed MongoDB Adapter
```bash
npm install @auth/mongodb-adapter
```

### 2. Updated NextAuth Configuration
**File:** `src/app/api/auth/[...nextauth]/route.ts`

**Changes:**
- Added `MongoClient` import
- Added adapter configuration to `authOptions`:
  ```typescript
  adapter: (() => {
    const client = new MongoClient(process.env.MONGODB_URI!)
    const clientPromise = client.connect()
    return require('@auth/mongodb-adapter').default(clientPromise)
  })(),
  ```

---

## How to Test

### Step 1: Verify Server is Running
```bash
# Check Next.js is running
lsof -ti:3000

# Should return a PID (e.g., 47228)
```

### Step 2: Open the Application
Go to: **http://localhost:3000**

### Step 3: Log In
1. Click **"Log In"** button
2. Enter credentials:
   - **Email:** `user@test.com`
   - **Password:** `Password123!`
3. Click **"Log In"**

### Expected Result:
✅ **SUCCESS** - You should be logged in and redirected to the rooms page

### If Still Seeing Errors:
1. **Hard refresh** the browser (Ctrl+Shift+R or Cmd+Shift+R)
2. **Check browser console** for errors
3. **Check server logs:**
   ```bash
   # View Next.js logs
   lsof -ti:3000 | xargs ps -p
   
   # Or check the .next directory
   ls -la .next/
   ```

---

## Technical Details

### What the Adapter Does

The MongoDB adapter:
- ✅ Persists user accounts to MongoDB
- ✅ Stores sessions in the database
- ✅ Handles verification tokens for magic links
- ✅ Manages account linking (OAuth + credentials)
- ✅ Enables session persistence across server restarts

### Database Collections Created

When you first log in, NextAuth will create these collections in MongoDB:
- `users` - User accounts
- `accounts` - Linked authentication providers
- `sessions` - Active user sessions
- `verification_tokens` - Email verification tokens

---

## Troubleshooting

### Error: "Cannot connect to MongoDB"
**Solution:**
```bash
# Start MongoDB
docker-compose -f .docker/mongodb/docker-compose.yml up -d

# Verify it's running
docker-compose -f .docker/mongodb/docker-compose.yml ps
```

### Error: "Invalid credentials"
**Solution:**
- Verify email: `user@test.com` or `admin@test.com`
- Verify password: `Password123!` (with capital P and !)
- Check user exists in database:
  ```bash
  # Connect to MongoDB
  mongosh mongodb://localhost:27017/focusflow
  
  # List users
  db.users.find({}, {email: 1, name: 1})
  ```

### Error: "Adapter not found"
**Solution:**
- Verify `@auth/mongodb-adapter` is installed:
  ```bash
  npm list @auth/mongodb-adapter
  ```
- Reinstall if needed:
  ```bash
  npm install @auth/mongodb-adapter
  ```

---

## Verification Checklist

- [ ] Server running on port 3000
- [ ] MongoDB running on port 27017
- [ ] `@auth/mongodb-adapter` installed
- [ ] Adapter configured in `src/app/api/auth/[...nextauth]/route.ts`
- [ ] `MONGODB_URI` set in `.env.local`
- [ ] Test users exist in database

---

## Test Accounts

Both accounts use the same password:

**Regular User:**
- Email: `user@test.com`
- Password: `Password123!`

**Admin User:**
- Email: `admin@test.com`
- Password: `Password123!`

---

## What's Next

After logging in successfully:
1. ✅ Browse the 8 daily focus rooms
2. ✅ Switch between list/calendar views
3. ✅ Register for rooms (when within 30-min window)
4. ✅ Access admin panel (admin account only)

---

**Fixed at:** 2026-04-07 12:22 AM IST  
**Status:** ✅ Authentication should now work properly

**Happy testing!** 🚀
