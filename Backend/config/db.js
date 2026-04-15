// ===================================
//   BRAINBALANCE — DATABASE CONFIG
//   MongoDB Atlas connection via Mongoose
// ===================================

const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`✅ MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB connection error: ${error.message}`);
    // Don't crash the server — features that need DB just won't work
    console.warn('⚠️  Running without database — some features will be unavailable');
  }
};

module.exports = connectDB;
