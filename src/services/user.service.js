const userDao = require('../dao/user.dao');

module.exports = {
  findAllUsers: userDao.findAllUsers,
  findUserById: userDao.findUserById,
  findUserByEmail: userDao.findUserByEmail,
  createUser: userDao.createUser,
  updateUser: userDao.updateUser,
  deleteUser: userDao.deleteUser,
};
