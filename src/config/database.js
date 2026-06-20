const mysql = require('mysql2/promise');
const config = require('.');

const pool = mysql.createPool({
  host: config.database.host,
  port: config.database.port,
  user: config.database.user,
  password: config.database.password,
  database: config.database.name,
  connectionLimit: config.database.connectionLimit,
  waitForConnections: true,
  ssl: config.database.ssl
    ? { rejectUnauthorized: config.database.sslRejectUnauthorized }
    : undefined,
});

module.exports = pool;
