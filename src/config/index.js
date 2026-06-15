require('dotenv').config();

function getInteger(value, fallback) {
  const parsedValue = Number.parseInt(value, 10);
  return Number.isNaN(parsedValue) ? fallback : parsedValue;
}

module.exports = {
  environment: process.env.NODE_ENV || 'development',
  port: getInteger(process.env.PORT, 3000),
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: getInteger(process.env.DB_PORT, 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    name: process.env.DB_NAME || 'share_a_meal',
    connectionLimit: getInteger(process.env.DB_CONNECTION_LIMIT, 10),
  },
};
