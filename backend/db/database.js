const mongoose = require('mongoose');

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

const connectDB = async () => {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/complaints';
    cached.promise = mongoose.connect(URI, {
      bufferCommands: false,
    }).then((mongoose) => {
      console.log('✅ MongoDB connected successfully');
      return mongoose;
    });
  }

  try {
    cached.conn = await cached.promise;
    return cached.conn;
  } catch (err) {
    console.error('❌ MongoDB connection error:', err);
    cached.promise = null;
    throw err;
  }
};

module.exports = connectDB;
