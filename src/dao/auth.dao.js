const pool = require('../config/database');

// Zoekt een user inclusief wachtwoordhash op voor login.
async function findUserByEmail(emailAddress) {
  const [rows] = await pool.execute(
    'SELECT id, firstName, lastName, emailAddress, password FROM `user` WHERE emailAddress = ? LIMIT 1',
    [emailAddress]
  );

  return rows[0] || null;
}

module.exports = {
  findUserByEmail,
};
