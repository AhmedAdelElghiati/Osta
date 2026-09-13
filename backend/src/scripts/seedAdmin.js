const dotenv = require('dotenv');
const { connectDatabase } = require('../config/database');
const { seedAdmin } = require('../services/auth.service');

dotenv.config();

const runSeed = async () => {
  try {
    await connectDatabase();

    const name = process.env.ADMIN_NAME || 'System Admin';
    const email = process.env.ADMIN_EMAIL || 'admin@example.com';
    const phone = process.env.ADMIN_PHONE || '+1000000000';
    const password = process.env.ADMIN_PASSWORD || 'AdminPass123!';

    const admin = await seedAdmin({ name, email, phone, password });
    console.log('Admin created:', admin.email);
    process.exit(0);
  } catch (error) {
    console.error('Admin creation failed:', error.message);
    process.exit(1);
  }
};

runSeed();
