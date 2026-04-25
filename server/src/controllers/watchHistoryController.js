const WatchHistory = require('../models/WatchHistory');
const Movie = require('../models/Movie');

exports.updateHistory = async (req, res) => {
  const { movieId, episode, currentTime } = req.body;
  const userId = req.user._id;

  try {
    if (!movieId) {
      return res.status(400).json({ error: 'movieId is required' });
    }

    // Check if movie exists
    const movie = await Movie.findById(movieId);
    if (!movie) {
      return res.status(404).json({ error: 'Movie not found' });
    }

    let history = await WatchHistory.findOne({ userId, movieId, episode });
    if (history) {
      history.currentTime = currentTime;
      await history.save();
    } else {
      history = new WatchHistory({ userId, movieId, episode, currentTime });
      await history.save();
    }

    res.status(200).json({ message: 'History updated', data: history });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getHistory = async (req, res) => {
  const userId = req.user._id;

  try {
    const history = await WatchHistory.find({ userId })
      .populate('movieId', 'title slug posterUrl thumbUrl')
      .sort({ updatedAt: -1 })
      .limit(50);

    res.status(200).json(history);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteHistory = async (req, res) => {
  const { historyId } = req.params;
  const userId = req.user._id;

  try {
    const history = await WatchHistory.findOneAndDelete({ _id: historyId, userId });
    if (!history) {
      return res.status(404).json({ error: 'History not found' });
    }

    res.status(200).json({ message: 'History deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.clearAllHistory = async (req, res) => {
  const userId = req.user._id;

  try {
    await WatchHistory.deleteMany({ userId });
    res.status(200).json({ message: 'All history cleared' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
