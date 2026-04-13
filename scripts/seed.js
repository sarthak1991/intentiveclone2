/**
 * Seed script to create dummy users for testing
 *
 * Creates:
 * - 1 regular user: user@test.com / password123
 * - 1 admin user: admin@test.com / admin123
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Import the models
const User = require('../src/models/User');

async function seed() {
  try {
    console.log('🌱 Starting seed...');

    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/focusflow');
    console.log('✅ Connected to database');

    // Check if users already exist
    const existingUser = await User.findOne({ email: 'user@test.com' });
    const existingAdmin = await User.findOne({ email: 'admin@test.com' });

    if (existingUser && existingAdmin) {
      console.log('⚠️  Seed users already exist, skipping...');
      console.log('\n📝 Test Credentials:');
      console.log('Regular User: user@test.com / password123');
      console.log('Admin User: admin@test.com / admin123');
      await mongoose.disconnect();
      return;
    }

    // Create regular user
    const hashedPassword = await bcrypt.hash('password123', 10);
    const user = await User.create({
      email: 'user@test.com',
      password: hashedPassword,
      name: 'Test User',
      photoUrl: null,
      timezone: 'Asia/Kolkata',
      interests: ['Software Development', 'Productivity'],
      isOnboarded: true,
      role: 'user',
      emailVerified: new Date(),
    });
    console.log('✅ Created regular user: user@test.com');

    // Create admin user
    const adminPassword = await bcrypt.hash('admin123', 10);
    const admin = await User.create({
      email: 'admin@test.com',
      password: adminPassword,
      name: 'Admin User',
      photoUrl: null,
      timezone: 'Asia/Kolkata',
      interests: ['Management', 'Coaching'],
      isOnboarded: true,
      role: 'admin',
      emailVerified: new Date(),
    });
    console.log('✅ Created admin user: admin@test.com');

    console.log('\n✨ Seed completed successfully!');
    console.log('\n📝 Test Credentials:');
    console.log('Regular User: user@test.com / password123');
    console.log('Admin User: admin@test.com / admin123');
  } catch (error) {
    console.error('❌ Seed failed:', error);
    throw error;
  } finally {
    await mongoose.disconnect();
    console.log('👋 Disconnected from database');
  }
}

// Run seed
seed()
  .then(() => {
    console.log('\n✅ All done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Error:', error);
    process.exit(1);
  });
