const mongoose = require('mongoose');
const config = require('./config');

/**
 * Biến global để cache kết nối trong môi trường serverless
 * (tránh việc kết nối lại liên tục mỗi khi function được gọi)
 */
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function connectDB() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false, // Trả về lỗi ngay nếu mất kết nối thay vì chờ
      serverSelectionTimeoutMS: 5000, // Timeout sau 5s nếu không kết nối được (thay vì 30s)
      socketTimeoutMS: 45000, // Giữ kết nối lâu hơn một chút để tránh mất kết nối giữa chừng
    };

    console.log('Connecting to MongoDB...');
    cached.promise = mongoose.connect(config.mongoUri, opts).then((mongoose) => {
      console.log('MongoDB Connected successfully');
      return mongoose;
    });
  }
  
  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    console.error('MongoDB connection error:', e);
    throw e;
  }

  return cached.conn;
}

module.exports = connectDB;