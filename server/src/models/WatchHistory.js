const mongoose = require('mongoose');

const watchHistorySchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    movieId: { type: mongoose.Schema.Types.ObjectId, ref: 'Movie', required: true },
    episode: { type: Number, default: 1 },
    currentTime: { type: Number, default: 0 } // in seconds
  },
  { timestamps: true }
);

module.exports = mongoose.model('WatchHistory', watchHistorySchema);
