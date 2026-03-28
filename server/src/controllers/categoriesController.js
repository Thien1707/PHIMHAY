const mongoose = require('mongoose');
const Category = require('../models/Category');
const Movie = require('../models/Movie');

const VIETNAMESE_DISPLAY_NAME_MAP = {
  hoathinh: 'Hoạt Hình',
  series: 'Phim bộ',
  single: 'Phim lẻ'
};

function normalizeMovieIds(movieIds) {
  if (!Array.isArray(movieIds)) return [];
  const normalized = movieIds
    .map((id) => String(id).trim())
    .filter(Boolean)
    .filter((id) => mongoose.Types.ObjectId.isValid(id));
  return [...new Set(normalized)];
}

function escapeRegex(input) {
  return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function resolveDisplayName(name, displayName) {
  const trimmedDisplayName = String(displayName || '').trim();
  if (trimmedDisplayName) return trimmedDisplayName;
  const key = String(name || '').trim().toLowerCase();
  return VIETNAMESE_DISPLAY_NAME_MAP[key] || String(name || '').trim();
}

async function listCategories(_req, res) {
  try {
    const items = await Category.aggregate([
      {
        $addFields: {
          normalizedName: { $toLower: { $trim: { input: '$name' } } }
        }
      },
      { $sort: { createdAt: 1 } },
      {
        $group: {
          _id: '$normalizedName',
          category: { $first: '$$ROOT' }
        }
      },
      { $replaceRoot: { newRoot: '$category' } },
      { $sort: { name: 1 } },
      {
        $project: {
          _id: 1,
          name: 1,
          displayName: 1,
          movieIds: 1,
          createdAt: 1,
          updatedAt: 1
        }
      }
    ]);
    return res.json({ items });
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Failed to fetch categories' });
  }
}

async function createCategory(req, res) {
  const name = String(req.body?.name || '').trim();
  const displayName = resolveDisplayName(name, req.body?.displayName);
  const movieIds = normalizeMovieIds(req.body?.movieIds);

  const session = await mongoose.startSession();
  try {
    let createdCategory = null;

    await session.withTransaction(async () => {
      const existing = await Category.findOne({
        name: { $regex: `^${escapeRegex(name)}$`, $options: 'i' }
      }).session(session).lean();
      if (existing) {
        throw Object.assign(new Error(`Category already exists: ${existing.name}`), { status: 409 });
      }

      if (movieIds.length > 0) {
        const existingMoviesCount = await Movie.countDocuments({ _id: { $in: movieIds } }).session(session);
        if (existingMoviesCount !== movieIds.length) {
          throw Object.assign(new Error('One or more movieIds are invalid'), { status: 400 });
        }
      }

      const [newCategory] = await Category.create(
        [{ name, displayName, movieIds }],
        { session }
      );
      createdCategory = newCategory;

      if (movieIds.length > 0) {
        await Movie.updateMany(
          { _id: { $in: movieIds } },
          { $addToSet: { categoryIds: createdCategory._id } },
          { session }
        );
      }
    });

    return res.status(201).json({ category: createdCategory });
  } catch (error) {
    const status = error.status || (error.code === 11000 ? 409 : 500);
    return res.status(status).json({ error: error.message || 'Failed to create category' });
  } finally {
    session.endSession();
  }
}

async function updateCategory(req, res) {
  const { id } = req.params;
  const name = req.body?.name !== undefined ? String(req.body.name).trim() : undefined;
  const displayName = req.body?.displayName !== undefined ? String(req.body.displayName).trim() : undefined;
  const nextMovieIds = req.body?.movieIds !== undefined ? normalizeMovieIds(req.body.movieIds) : undefined;

  const session = await mongoose.startSession();
  try {
    let updatedCategory = null;

    await session.withTransaction(async () => {
      const category = await Category.findById(id).session(session);
      if (!category) {
        throw Object.assign(new Error('Category not found'), { status: 404 });
      }

      if (name !== undefined) {
        const existingByName = await Category.findOne({
          _id: { $ne: id },
          name: { $regex: `^${escapeRegex(name)}$`, $options: 'i' }
        }).session(session).lean();
        if (existingByName) {
          throw Object.assign(new Error('Category name already exists'), { status: 409 });
        }
        category.name = name;
        if (displayName === undefined) {
          category.displayName = resolveDisplayName(name, category.displayName);
        }
      }
      if (displayName !== undefined) {
        category.displayName = resolveDisplayName(category.name, displayName);
      }

      if (nextMovieIds !== undefined) {
        if (nextMovieIds.length > 0) {
          const existingMoviesCount = await Movie.countDocuments({ _id: { $in: nextMovieIds } }).session(session);
          if (existingMoviesCount !== nextMovieIds.length) {
            throw Object.assign(new Error('One or more movieIds are invalid'), { status: 400 });
          }
        }

        const currentSet = new Set(category.movieIds.map((movieId) => String(movieId)));
        const nextSet = new Set(nextMovieIds);

        const toAdd = nextMovieIds.filter((movieId) => !currentSet.has(movieId));
        const toRemove = [...currentSet].filter((movieId) => !nextSet.has(movieId));

        if (toAdd.length > 0) {
          await Movie.updateMany(
            { _id: { $in: toAdd } },
            { $addToSet: { categoryIds: category._id } },
            { session }
          );
        }

        if (toRemove.length > 0) {
          await Movie.updateMany(
            { _id: { $in: toRemove } },
            { $pull: { categoryIds: category._id } },
            { session }
          );
        }

        category.movieIds = nextMovieIds;
      }

      updatedCategory = await category.save({ session });
    });

    return res.json({ category: updatedCategory });
  } catch (error) {
    const status = error.status || (error.code === 11000 ? 409 : 500);
    return res.status(status).json({ error: error.message || 'Failed to update category' });
  } finally {
    session.endSession();
  }
}

async function deleteCategory(req, res) {
  const { id } = req.params;
  const session = await mongoose.startSession();

  try {
    await session.withTransaction(async () => {
      const category = await Category.findById(id).session(session);
      if (!category) {
        throw Object.assign(new Error('Category not found'), { status: 404 });
      }

      await Movie.updateMany(
        { _id: { $in: category.movieIds } },
        { $pull: { categoryIds: category._id } },
        { session }
      );

      await Category.deleteOne({ _id: id }, { session });
    });

    return res.json({ ok: true });
  } catch (error) {
    const status = error.status || 500;
    return res.status(status).json({ error: error.message || 'Failed to delete category' });
  } finally {
    session.endSession();
  }
}

module.exports = { listCategories, createCategory, updateCategory, deleteCategory };
