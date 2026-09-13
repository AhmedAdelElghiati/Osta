const mongoose = require('mongoose');

const connectDatabase = async () => {
  const mongoUri = process.env.MONGO_URI;

  if (!mongoUri) {
    throw new Error('MONGO_URI is not defined in the environment variables.');
  }

  try {
    await mongoose.connect(mongoUri, {
      autoIndex: true,
    });

    console.log('MongoDB connected successfully');
    return mongoose.connection;
  } catch (error) {
    console.error('MongoDB connection failed:', error.message);
    throw error;
  }
};

module.exports = { connectDatabase };
