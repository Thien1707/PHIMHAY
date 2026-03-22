const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema(
  {
    movieId: { type: mongoose.Schema.Types.ObjectId, ref: 'Movie', required: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    body: { type: String, required: true, maxlength: 2000 }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Comment', commentSchema);
