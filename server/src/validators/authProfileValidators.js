const Joi = require('joi');

const genderSchema = Joi.string()
  .trim()
  .valid('male', 'female', 'other')
  .optional()
  .allow('', null);

const updateProfileSchema = Joi.object({
  displayName: Joi.string().trim().min(1).optional(),
  email: Joi.string().trim().email().optional(),
  phoneNumber: Joi.string().trim().optional().allow('', null),
  dateOfBirth: Joi.string()
    .trim()
    .optional()
    .allow('', null)
    .pattern(/^\d{4}-\d{2}-\d{2}$/),
  gender: genderSchema,
  /**
   * New password (optional). If provided, it will be hashed and stored.
   */
  password: Joi.string().min(6).optional().allow('')
}).min(1);

module.exports = { updateProfileSchema };

