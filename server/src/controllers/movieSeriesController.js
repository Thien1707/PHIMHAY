const Movie = require('../models/Movie');

async function assignMovieToSeries(req, res) {
  try {
    const { id } = req.params;
    const seriesId = String(req.body?.seriesId || '').trim();
    const partNumber = Number(req.body?.partNumber);

    if (!seriesId) {
      return res.status(400).json({ error: 'seriesId is required' });
    }
    if (!Number.isInteger(partNumber) || partNumber < 1) {
      return res.status(400).json({ error: 'partNumber must be an integer >= 1' });
    }

    const movie = await Movie.findById(id);
    if (!movie) {
      return res.status(404).json({ error: 'Movie not found' });
    }

    const duplicatePart = await Movie.findOne({
      _id: { $ne: movie._id },
      seriesId,
      partNumber
    }).lean();
    if (duplicatePart) {
      return res.status(409).json({ error: 'This partNumber already exists in the series' });
    }

    movie.seriesId = seriesId;
    movie.partNumber = partNumber;
    await movie.save();

    return res.json({ movie });
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Failed to assign movie to series' });
  }
}

async function getMovieSeriesParts(req, res) {
  try {
    const { id } = req.params;
    const movie = await Movie.findById(id).lean();
    if (!movie) {
      return res.status(404).json({ error: 'Movie not found' });
    }
    if (!movie.seriesId) {
      return res.json({ seriesId: null, parts: [] });
    }

    const parts = await Movie.find({ seriesId: movie.seriesId, isActive: true })
      .sort({ partNumber: 1, createdAt: 1 })
      .select('_id slug title posterUrl thumbUrl partNumber seriesId')
      .lean();

    return res.json({ seriesId: movie.seriesId, parts });
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Failed to fetch series parts' });
  }
}

module.exports = { assignMovieToSeries, getMovieSeriesParts };
