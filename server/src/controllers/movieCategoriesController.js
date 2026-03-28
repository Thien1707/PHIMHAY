const mongoose = require('mongoose');
const Movie = require('../models/Movie');
const Category = require('../models/Category');

function normalizeCategoryIds(categoryIds) {
  if (!Array.isArray(categoryIds)) return [];
  const normalized = categoryIds
    .map((id) => String(id).trim())
    .filter(Boolean)
    .filter((id) => mongoose.Types.ObjectId.isValid(id));
  return [...new Set(normalized)];
}

async function updateMovieCategories(req, res) {
  const { id } = req.params;
  const nextCategoryIds = normalizeCategoryIds(req.body?.categoryIds);
  const session = await mongoose.startSession();

  try {
    let updatedMovie = null;

    await session.withTransaction(async () => {
      const movie = await Movie.findById(id).session(session);
      if (!movie) {
        throw Object.assign(new Error('Movie not found'), { status: 404 });
      }

      if (nextCategoryIds.length > 0) {
        const existingCategoriesCount = await Category.countDocuments({ _id: { $in: nextCategoryIds } }).session(session);
        if (existingCategoriesCount !== nextCategoryIds.length) {
          throw Object.assign(new Error('One or more categoryIds are invalid'), { status: 400 });
        }
      }

      const currentSet = new Set((movie.categoryIds || []).map((categoryId) => String(categoryId)));
      const nextSet = new Set(nextCategoryIds);

      const toAdd = nextCategoryIds.filter((categoryId) => !currentSet.has(categoryId));
      const toRemove = [...currentSet].filter((categoryId) => !nextSet.has(categoryId));

      if (toAdd.length > 0) {
        await Category.updateMany(
          { _id: { $in: toAdd } },
          { $addToSet: { movieIds: movie._id } },
          { session }
        );
      }

      if (toRemove.length > 0) {
        await Category.updateMany(
          { _id: { $in: toRemove } },
          { $pull: { movieIds: movie._id } },
          { session }
        );
      }

      movie.categoryIds = nextCategoryIds;
      updatedMovie = await movie.save({ session });
    });

    return res.json({ movie: updatedMovie });
  } catch (error) {
    const status = error.status || 500;
    return res.status(status).json({ error: error.message || 'Failed to update movie categories' });
  } finally {
    session.endSession();
  }
}

module.exports = { updateMovieCategories };
