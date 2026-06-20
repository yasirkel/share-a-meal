require('dotenv').config();

function getInteger(value, fallback) {
  const parsedValue = Number.parseInt(value, 10);
  return Number.isNaN(parsedValue) ? fallback : parsedValue;
}

function getBoolean(value, fallback = false) {
  if (value === undefined) {
    return fallback;
  }

  return ['true', '1', 'yes'].includes(value.toLowerCase());
}

module.exports = {
  environment: process.env.NODE_ENV || 'development',
  port: getInteger(process.env.PORT, 3000),
  student: {
    name: process.env.STUDENT_NAME || 'Yasir Kelloulou',
    number: process.env.STUDENT_NUMBER || '2212394',
  },
  description: process.env.APP_DESCRIPTION || 'Backend REST API for the Share-a-Meal Programmeren 4 assignment',
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '1h',
  },
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: getInteger(process.env.DB_PORT, 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    name: process.env.DB_DATABASE || process.env.DB_NAME || 'share_a_meal',
    connectionLimit: getInteger(process.env.DB_CONNECTION_LIMIT, 10),
    ssl: getBoolean(process.env.DB_SSL),
    sslRejectUnauthorized: getBoolean(process.env.DB_SSL_REJECT_UNAUTHORIZED),
  },
};
