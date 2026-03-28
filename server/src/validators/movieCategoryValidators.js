const Joi = require('joi');

const objectIdPattern = /^[0-9a-fA-F]{24}$/;

const movieParamsSchema = Joi.object({
  id: Joi.string().pattern(objectIdPattern).required()
});

const updateMovieCategoriesSchema = Joi.object({
  categoryIds: Joi.array()
    .items(Joi.string().pattern(objectIdPattern))
    .unique()
    .required()
});

module.exports = {
  movieParamsSchema,
  updateMovieCategoriesSchema
};
