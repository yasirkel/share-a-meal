const userDao = require('../dao/user.dao');
const mealDao = require('../dao/meal.dao');

module.exports = {
  allowedFilterFields: userDao.allowedFilterFields,
  findAllUsers: userDao.findAllUsers,
  findUserById: userDao.findUserById,
  findUserByEmail: userDao.findUserByEmail,
  findMealsByCookId: mealDao.findMealsByCookId,
  createUser: userDao.createUser,
  updateUser: userDao.updateUser,
  deleteUser: userDao.deleteUser,
};
