const Joi = require('joi');

const objectIdPattern = /^[0-9a-fA-F]{24}$/;

const createCategorySchema = Joi.object({
  name: Joi.string().trim().min(1).required(),
  displayName: Joi.string().trim().min(1).optional(),
  movieIds: Joi.array().items(Joi.string().pattern(objectIdPattern)).unique().default([])
});

const updateCategorySchema = Joi.object({
  name: Joi.string().trim().min(1),
  displayName: Joi.string().trim().min(1),
  movieIds: Joi.array().items(Joi.string().pattern(objectIdPattern)).unique()
}).or('name', 'displayName', 'movieIds');

const categoryParamsSchema = Joi.object({
  id: Joi.string().pattern(objectIdPattern).required()
});

module.exports = {
  createCategorySchema,
  updateCategorySchema,
  categoryParamsSchema
};
