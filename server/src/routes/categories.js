const express = require('express');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const {
  createCategorySchema,
  updateCategorySchema,
  categoryParamsSchema
} = require('../validators/categoryValidators');
const {
  listCategories,
  createCategory,
  updateCategory,
  deleteCategory
} = require('../controllers/categoriesController');

const router = express.Router();

router.get('/', listCategories);
router.post('/', requireAuth, requireAdmin, validate(createCategorySchema), createCategory);
router.put('/:id', requireAuth, requireAdmin, validate(categoryParamsSchema, 'params'), validate(updateCategorySchema), updateCategory);
router.delete('/:id', requireAuth, requireAdmin, validate(categoryParamsSchema, 'params'), deleteCategory);

module.exports = router;
