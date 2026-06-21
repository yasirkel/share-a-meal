const authDao = require('../dao/auth.dao');

// Geeft de loginlaag toegang tot een user op basis van e-mailadres.
async function findUserByEmail(emailAddress) {
  return authDao.findUserByEmail(emailAddress);
}

module.exports = {
  findUserByEmail,
};
