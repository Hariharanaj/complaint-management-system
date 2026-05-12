const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/complaints';
    await mongoose.connect(URI);
    console.log('✅ MongoDB connected successfully');
  } catch (err) {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  }
};

module.exports = connectDB;
