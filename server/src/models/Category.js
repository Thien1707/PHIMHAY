const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    displayName: { type: String, default: '', trim: true },
    movieIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Movie' }]
  },
  { timestamps: true }
);

categorySchema.index({ movieIds: 1 });

module.exports = mongoose.model('Category', categorySchema);
