const express = require('express');
const Movie = require('../models/Movie');
const mongoose = require('mongoose');
const { optionalAuth, requireAuth, requireAdmin, isVipActive } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { fetchMovieBySlug } = require('../services/phimapi');
const { assignMovieToSeries, getMovieSeriesParts } = require('../controllers/movieSeriesController');
const { updateMovieCategories } = require('../controllers/movieCategoriesController');
const { movieParamsSchema, updateMovieCategoriesSchema } = require('../validators/movieCategoryValidators');

const router = express.Router();

/** Gợi ý phim từ phimapi (import admin) — đặt trước /:slug */
router.get('/meta/phimapi-new', async (req, res) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const { fetchNewMovies } = require('../services/phimapi');
    const data = await fetchNewMovies(page);
    res.json(data);
  } catch (e) {
    res.status(502).json({ error: e.message });
  }
});

function playbackAccess(user, movie) {
  if (!user) return { canWatch: false, reason: 'guest' };
  if (user.isAdmin) return { canWatch: true, reason: 'admin' };
  const vip = isVipActive(user);
  if (movie.viewStatus === Movie.VIEW_VIP && !vip) {
    return { canWatch: false, reason: 'vip_only' };
  }
  return { canWatch: true, reason: vip ? 'vip' : 'normal' };
}

router.get('/search', async (req, res) => {
  try {
    const q = req.query.q || '';
    if (!q) {
      return res.json({ items: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 1 } });
    }

    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(64, Math.max(1, Number(req.query.limit) || 20));
    const skip = (page - 1) * limit;

    const query = {
      isActive: true,
      $or: [
        { title: { $regex: q, $options: 'i' } },
        { originName: { $regex: q, $options: 'i' } },
      ],
    };

    const [items, total] = await Promise.all([
      Movie.find(query)
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Movie.countDocuments(query),
    ]);

    res.json({
      items: items.map((m) => ({
        id: m._id,
        slug: m.slug,
        title: m.title,
        originName: m.originName,
        posterUrl: m.posterUrl,
        thumbUrl: m.thumbUrl,
        year: m.year,
        type: m.type,
        viewStatus: m.viewStatus,
        commentRatingPolicy: m.commentRatingPolicy,
      })),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
    });
  } catch (e) {
    console.error(`[MOVIES SEARCH ERROR]`, e);
    res.status(500).json({ error: e.message });
  }
});

router.get('/', optionalAuth, async (req, res) => {
  try {
    console.log(`[MOVIES] ${new Date().toISOString()} | Start fetching list. Query:`, req.query);
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(64, Math.max(1, Number(req.query.limit) || 20));
    const skip = (page - 1) * limit;

    const query = { isActive: true };
    if (req.query.type) {
      query.type = String(req.query.type);
    }
    if (req.query.country) {
      query.country = { $regex: String(req.query.country), $options: 'i' };
    }
    if (req.query.category) {
      const categoryId = String(req.query.category);
      if (!mongoose.Types.ObjectId.isValid(categoryId)) {
        return res.status(400).json({ error: 'category không hợp lệ' });
      }
      query.categoryIds = new mongoose.Types.ObjectId(categoryId);
    }

    const start = Date.now();
    const [items, total] = await Promise.all([
      Movie.find(query)
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean()
        .maxTimeMS(8000), // Timeout query sau 8s để tránh treo Vercel
      Movie.countDocuments(query).maxTimeMS(8000)
    ]);

    console.log(`[MOVIES] Query done in ${Date.now() - start}ms. Found ${items.length} items.`);

    res.json({
      items: items.map((m) => ({
        id: m._id,
        slug: m.slug,
        title: m.title,
        originName: m.originName,
        posterUrl: m.posterUrl,
        thumbUrl: m.thumbUrl,
        year: m.year,
        type: m.type,
        country: m.country,
        viewStatus: m.viewStatus,
        commentRatingPolicy: m.commentRatingPolicy
      })),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 }
    });
  } catch (e) {
    console.error(`[MOVIES ERROR]`, e);
    res.status(500).json({ error: e.message });
  }
});

router.get('/filters', async (req, res) => {
  try {
    const [types, countries] = await Promise.all([
      Movie.distinct('type', { isActive: true, type: { $ne: '' } }),
      Movie.distinct('country', { isActive: true, country: { $ne: '' } })
    ]);
    const allCountries = countries
      .flatMap((c) => c.split(','))
      .map((c) => c.trim())
      .filter(Boolean);
    const uniqueCountries = [...new Set(allCountries)];
    res.json({ types, countries: uniqueCountries });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/:id/assign-series', requireAuth, requireAdmin, assignMovieToSeries);
router.get('/:id/series', getMovieSeriesParts);
router.put('/:id/categories', requireAuth, requireAdmin, validate(movieParamsSchema, 'params'), validate(updateMovieCategoriesSchema), updateMovieCategories);

router.get('/:slug', optionalAuth, async (req, res) => {
  try {
    const movie = await Movie.findOne({ slug: req.params.slug, isActive: true }).lean();
    if (!movie) return res.status(404).json({ error: 'Không có phim trong hệ thống' });

    const effectiveUser = req.user || null;
    const access = playbackAccess(effectiveUser, movie);

    let phimapiData = null;
    if (access.canWatch) {
      try {
        phimapiData = await fetchMovieBySlug(movie.slug);
      } catch (e) {
        return res.status(502).json({ error: 'Không lấy được nguồn phát. Thử lại sau.' });
      }
    }

    const base = {
      id: movie._id,
      slug: movie.slug,
      title: movie.title,
      originName: movie.originName,
      posterUrl: movie.posterUrl,
      thumbUrl: movie.thumbUrl,
      year: movie.year,
      type: movie.type,
      content: movie.content,
      viewStatus: movie.viewStatus,
      commentRatingPolicy: movie.commentRatingPolicy,
      canWatch: access.canWatch,
      accessReason: access.reason
    };

    if (!phimapiData) {
      return res.json({
        movie: {
          ...base,
          trailer_url: '',
          episodes: []
        }
      });
    }

    const m = phimapiData.movie;
    res.json({
      movie: {
        ...base,
        trailer_url: m.trailer_url || '',
        episode_current: m.episode_current,
        episode_total: m.episode_total,
        quality: m.quality,
        lang: m.lang,
        time: m.time,
        category: m.category,
        country: m.country,
        episodes: phimapiData.episodes || []
      }
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
