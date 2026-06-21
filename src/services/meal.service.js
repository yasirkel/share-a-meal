const mealDao = require('../dao/meal.dao');

// Bundelt meal-gerelateerde databasefuncties voor de controllers.
module.exports = {
  findAllMeals: mealDao.findAllMeals,
  findMealById: mealDao.findMealById,
  createMeal: mealDao.createMeal,
  updateMeal: mealDao.updateMeal,
  deleteMeal: mealDao.deleteMeal,
};
