function validate(schema, pick = 'body') {
  return (req, res, next) => {
    const value = req[pick];
    const { error, value: parsed } = schema.validate(value, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.details.map((d) => d.message)
      });
    }

    req[pick] = parsed;
    return next();
  };
}

module.exports = { validate };
