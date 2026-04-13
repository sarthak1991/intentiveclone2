#!/usr/bin/env node

/**
 * Create Admin User Script
 * Usage: node scripts/create-admin.js <email> <password> <name>
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { User } = require('../src/models/User');
const { connectDB } = require('../src/lib/db');

async function createAdmin() {
  const args = process.argv.slice(2);

  if (args.length < 3) {
    console.log('Usage: node scripts/create-admin.js <email> <password> <name>');
    console.log('Example: node scripts/create-admin.js admin@example.com MyPassword123 "Admin User"');
    process.exit(1);
  }

  const [email, password, name] = args;

  try {
    await connectDB();

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log('User with this email already exists. Updating to admin...');

      // Update existing user to admin
      existingUser.role = 'admin';
      existingUser.isOnboarded = true;
      existingUser.sessionsRemaining = 9999;
      existingUser.subscriptionTier = 'monthly';
      await existingUser.save();

      console.log('✅ User updated to admin successfully');
      console.log('Email:', existingUser.email);
      console.log('Name:', existingUser.name);
      console.log('Role:', existingUser.role);
    } else {
      // Hash password
      const hashedPassword = await bcrypt.hash(password, 12);

      // Create admin user
      const user = await User.create({
        email,
        password: hashedPassword,
        name,
        role: 'admin',
        isOnboarded: true,
        sessionsRemaining: 9999,
        subscriptionTier: 'monthly'
      });

      console.log('✅ Admin user created successfully');
      console.log('Email:', user.email);
      console.log('Name:', user.name);
      console.log('Role:', user.role);
      console.log('ID:', user._id.toString());
    }

    mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    mongoose.connection.close();
    process.exit(1);
  }
}

createAdmin();
