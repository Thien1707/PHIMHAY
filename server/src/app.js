const express = require('express');
const cors = require('cors');
const connectDB = require('./db');

const authRoutes = require('./routes/auth');
const moviesRoutes = require('./routes/movies');
const adminRoutes = require('./routes/admin');
const commentsRoutes = require('./routes/comments');
const ratingsRoutes = require('./routes/ratings');
const paymentRoutes = require('./routes/payment');

const app = express();

app.use((req, res, next) => {
  // Log mỗi request đến server
  console.log(`[REQUEST START] ${new Date().toISOString()} | ${req.method} ${req.originalUrl || req.url}`);
  next();
});

app.use(
  cors({
    origin: '*',
    methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-admin-secret'],
    optionsSuccessStatus: 204
  })
);
app.use(express.json());

// Middleware kết nối Database cho môi trường Serverless (Vercel)
app.use(async (req, _res, next) => {
  try {
    console.log(`[DB CHECK] ${new Date().toISOString()} | Checking connection for ${req.url}...`);
    await connectDB();
    console.log(`[DB CHECK] ${new Date().toISOString()} | Connection Ready. Proceeding.`);
    next();
  } catch (error) {
    console.error(`[DB ERROR] ${new Date().toISOString()} | Failed to connect:`, error);
    next(error);
  }
});

// Thêm route cho trang chủ để test server sống hay chết
app.get('/', (req, res) => {
  res.json({ message: 'Server is running!', time: new Date() });
});

app.get('/api/health', (_req, res) => {
  const mongoose = require('mongoose');
  res.json({ ok: true, mongo: mongoose.connection.readyState === 1 });
});

app.use('/api/auth', authRoutes);
app.use('/api/movies', (req, res, next) => {
  // Log xác nhận request đã đi qua tầng DB và vào tới router phim
  console.log(`[ROUTE] ${new Date().toISOString()} | Entering moviesRoutes handler...`);
  next();
}, moviesRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/comments', commentsRoutes);
app.use('/api/ratings', ratingsRoutes);
app.use('/api/payment', paymentRoutes);

// Xử lý lỗi 404 (Không tìm thấy route) - Để tránh treo request
app.use((req, res, next) => {
  res.status(404).json({ error: 'Not Found', path: req.originalUrl });
});

app.use((err, _req, res, _next) => {
  console.error('[SERVER ERROR]', err);
  res.status(500).json({ error: err.message || 'Server error' });
});

module.exports = app;
