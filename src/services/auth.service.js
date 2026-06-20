const authDao = require('../dao/auth.dao');

async function findUserByEmail(emailAddress) {
  return authDao.findUserByEmail(emailAddress);
}

module.exports = {
  findUserByEmail,
};
