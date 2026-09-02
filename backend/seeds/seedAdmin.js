require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const dns = require('dns');

// Force Node.js to use public DNS servers to resolve MongoDB SRV records
dns.setServers(["8.8.8.8", "8.8.4.4"]);
const mongoose = require('mongoose');
const User = require('../models/User');
const Settings = require('../models/Settings');

const seedAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Create super admin if not exists
    const existingAdmin = await User.findOne({ email: 'admin@paapicrackers.com' });
    if (!existingAdmin) {
      await User.create({
        name: 'Super Admin',
        email: 'admin@paapicrackers.com',
        password: 'PapiBanu',
        phone: '8248061885',
        role: 'superAdmin',
      });
      console.log('Super Admin created:');
      console.log('  Email: admin@paapicrackers.com');
      console.log('  Password: PapiBanu@5124');
    } else {
      console.log('Super Admin already exists.');
    }

    // Initialize settings if not exists
    await Settings.getSettings();
    console.log('Settings initialized.');

    await mongoose.disconnect();
    console.log('Done! Disconnected from MongoDB.');
    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
};

seedAdmin();
