const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const moviesRoutes = require('./routes/movies');
const adminRoutes = require('./routes/admin');
const commentsRoutes = require('./routes/comments');
const ratingsRoutes = require('./routes/ratings');
const paymentRoutes = require('./routes/payment');

const app = express();

app.use(
  cors({
    origin: '*',
    methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-admin-secret'],
    optionsSuccessStatus: 204
  })
);
app.use(express.json());

app.get('/api/health', (_req, res) => {
  const mongoose = require('mongoose');
  res.json({ ok: true, mongo: mongoose.connection.readyState === 1 });
});

app.use('/api/auth', authRoutes);
app.use('/api/movies', moviesRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/comments', commentsRoutes);
app.use('/api/ratings', ratingsRoutes);
app.use('/api/payment', paymentRoutes);

app.use((err, _req, res, _next) => {
  res.status(500).json({ error: err.message || 'Server error' });
});

module.exports = app;
