const mealDao = require('../dao/meal.dao');

module.exports = {
  findAllMeals: mealDao.findAllMeals,
  findMealById: mealDao.findMealById,
  createMeal: mealDao.createMeal,
  updateMeal: mealDao.updateMeal,
  deleteMeal: mealDao.deleteMeal,
};
