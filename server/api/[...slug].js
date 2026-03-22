const serverless = require('serverless-http');
const mongoose = require('mongoose');
const config = require('../src/config');
const app = require('../src/app');

const run = serverless(app);

module.exports = async (req, res) => {
  if (mongoose.connection.readyState !== 1) {
    await mongoose.connect(config.mongoUri);
  }
  return run(req, res);
};
