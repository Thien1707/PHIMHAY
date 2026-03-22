const express = require('express');
const Movie = require('../models/Movie');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const { fetchMovieBySlug } = require('../services/phimapi');

const router = express.Router();

router.use(requireAuth, requireAdmin);

router.get('/movies', async (req, res) => {
  const items = await Movie.find().sort({ updatedAt: -1 }).lean();
  res.json({ items });
});

router.post('/movies/import', async (req, res) => {
  try {
    const slug = String(req.body.slug || '').trim();
    if (!slug) return res.status(400).json({ error: 'Thiếu slug' });
    const exists = await Movie.findOne({ slug });
    if (exists) return res.status(409).json({ error: 'Slug đã có trong hệ thống' });
    const data = await fetchMovieBySlug(slug);
    const m = data.movie;
    const doc = await Movie.create({
      slug: m.slug,
      title: m.name,
      originName: m.origin_name || '',
      posterUrl: m.poster_url || '',
      thumbUrl: m.thumb_url || '',
      year: m.year || null,
      type: m.type || '',
      content: m.content || '',
      viewStatus: Movie.VIEW_NORMAL,
      commentRatingPolicy: 'public',
      externalId: m._id ? String(m._id) : ''
    });
    res.status(201).json({ movie: doc });
  } catch (e) {
    const status = e.status || 500;
    res.status(status).json({ error: e.message || 'Import thất bại' });
  }
});

router.patch('/movies/:id', async (req, res) => {
  const { viewStatus, commentRatingPolicy, isActive, title, content } = req.body;
  const movie = await Movie.findById(req.params.id);
  if (!movie) return res.status(404).json({ error: 'Không tìm thấy' });
  if (viewStatus !== undefined) {
    if (![Movie.VIEW_NORMAL, Movie.VIEW_VIP].includes(Number(viewStatus))) {
      return res.status(400).json({ error: 'viewStatus không hợp lệ (0 hoặc 1)' });
    }
    movie.viewStatus = Number(viewStatus);
  }
  if (commentRatingPolicy !== undefined) {
    if (!['public', 'members'].includes(commentRatingPolicy)) {
      return res.status(400).json({ error: 'commentRatingPolicy: public | members' });
    }
    movie.commentRatingPolicy = commentRatingPolicy;
  }
  if (typeof isActive === 'boolean') movie.isActive = isActive;
  if (title !== undefined) movie.title = String(title);
  if (content !== undefined) movie.content = String(content);
  await movie.save();
  res.json({ movie });
});

router.delete('/movies/:id', async (req, res) => {
  const r = await Movie.findByIdAndDelete(req.params.id);
  if (!r) return res.status(404).json({ error: 'Không tìm thấy' });
  res.json({ ok: true });
});

module.exports = router;
