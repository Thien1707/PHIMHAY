const express = require('express');
const mongoose = require('mongoose');
const Comment = require('../models/Comment');
const Movie = require('../models/Movie');
const { optionalAuth, requireAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/movie/:movieId', optionalAuth, async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.movieId)) {
      return res.status(400).json({ error: 'movieId không hợp lệ' });
    }
    const movie = await Movie.findById(req.params.movieId).lean();
    if (!movie || !movie.isActive) return res.status(404).json({ error: 'Không tìm thấy phim' });
    if (movie.commentRatingPolicy === 'members' && !req.user) {
      return res.status(401).json({ error: 'Đăng nhập để xem bình luận' });
    }
    const comments = await Comment.find({ movieId: movie._id })
      .sort({ createdAt: -1 })
      .populate('userId', 'displayName email')
      .lean();
    res.json({
      items: comments.map((c) => ({
        id: c._id,
        body: c.body,
        createdAt: c.createdAt,
        user: c.userId
          ? { id: c.userId._id, displayName: c.userId.displayName, email: c.userId.email }
          : null
      }))
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/movie/:movieId', requireAuth, async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.movieId)) {
      return res.status(400).json({ error: 'movieId không hợp lệ' });
    }
    const movie = await Movie.findById(req.params.movieId);
    if (!movie || !movie.isActive) return res.status(404).json({ error: 'Không tìm thấy phim' });
    const body = String(req.body.body || '').trim();
    if (!body) return res.status(400).json({ error: 'Nội dung trống' });
    const c = await Comment.create({ movieId: movie._id, userId: req.user._id, body });
    res.status(201).json({
      id: c._id,
      body: c.body,
      createdAt: c.createdAt,
      user: { id: req.user._id, displayName: req.user.displayName, email: req.user.email }
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.delete('/:id', requireAuth, async (req, res) => {
  const c = await Comment.findById(req.params.id);
  if (!c) return res.status(404).json({ error: 'Không tìm thấy' });
  if (String(c.userId) !== String(req.user._id) && !req.user.isAdmin) {
    return res.status(403).json({ error: 'Không được xóa' });
  }
  await c.deleteOne();
  res.json({ ok: true });
});

module.exports = router;
