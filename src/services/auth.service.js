const pool = require('../config/database');

async function findUserByEmail(emailAddress) {
  const [rows] = await pool.execute(
    'SELECT id, firstName, lastName, emailAddress, password FROM user WHERE emailAddress = ? LIMIT 1',
    [emailAddress]
  );

  return rows[0] || null;
}

module.exports = {
  findUserByEmail,
};
