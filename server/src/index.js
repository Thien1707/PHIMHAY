const app = require('./app');
const config = require('./config');
const mongoose = require('mongoose');

async function main() {
  await mongoose.connect(config.mongoUri);
  app.listen(config.port, () => {
    console.log(`API http://localhost:${config.port}`);
  });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
