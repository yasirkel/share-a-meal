const app = require('./app');
const config = require('./config');

const server = app.listen(config.port, () => {
  console.log(`Share-a-Meal API listening on port ${config.port}`);
});

function shutdown() {
  server.close(() => {
    process.exit(0);
  });
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
