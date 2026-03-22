const express = require('express');
const mongoose = require('mongoose');
const Rating = require('../models/Rating');
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
      return res.status(401).json({ error: 'Đăng nhập để xem đánh giá' });
    }
    const list = await Rating.find({ movieId: movie._id })
      .populate('userId', 'displayName email')
      .sort({ createdAt: -1 })
      .lean();
    const mid = new mongoose.Types.ObjectId(String(movie._id));
    const agg = await Rating.aggregate([
      { $match: { movieId: mid } },
      { $group: { _id: null, avg: { $avg: '$stars' }, count: { $sum: 1 } } }
    ]);
    const summary = agg[0] || { avg: 0, count: 0 };
    let myRating = null;
    if (req.user) {
      const mine = list.find((r) => String(r.userId?._id || r.userId) === String(req.user._id));
      if (mine) myRating = mine.stars;
    }
    res.json({
      average: summary.count ? Math.round((summary.avg + Number.EPSILON) * 10) / 10 : 0,
      count: summary.count,
      myRating,
      items: list.map((r) => ({
        id: r._id,
        stars: r.stars,
        createdAt: r.createdAt,
        user: r.userId
          ? { id: r.userId._id, displayName: r.userId.displayName, email: r.userId.email }
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
    const stars = Number(req.body.stars);
    if (!Number.isFinite(stars) || stars < 1 || stars > 5) {
      return res.status(400).json({ error: 'Số sao từ 1 đến 5' });
    }
    const r = await Rating.findOneAndUpdate(
      { movieId: movie._id, userId: req.user._id },
      { stars },
      { upsert: true, new: true }
    );
    res.json({ id: r._id, stars: r.stars });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
