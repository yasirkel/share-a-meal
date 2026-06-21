const mealService = require('../services/meal.service');
const { validateMealPayload } = require('../validators/meal.validator');

// Stuurt iedere meal-response terug in het vaste responseformaat.
function json(res, status, message, data = null) {
  return res.status(status).json({ status, message, data });
}

// Zet een routeparameter om naar een geldig positief meal ID.
function parseMealId(value) {
  const mealId = Number.parseInt(value, 10);
  return Number.isInteger(mealId) && mealId > 0 ? mealId : null;
}

// Verwijdert het wachtwoord uit user-objecten in meal responses.
function sanitizeUser(user) {
  if (!user) {
    return null;
  }

  const { password, ...publicUser } = user;
  return publicUser;
}

// Verwijdert wachtwoorden uit kok en deelnemers binnen een maaltijd.
function sanitizeMeal(meal) {
  if (!meal) {
    return null;
  }

  return {
    ...meal,
    cook: sanitizeUser(meal.cook),
    participants: Array.isArray(meal.participants)
      ? meal.participants.map(sanitizeUser)
      : [],
  };
}

// Controleert of de ingelogde user eigenaar/kok van de maaltijd is.
function isOwner(req, meal) {
  return meal.cookId === req.user.userId || meal.cook?.id === req.user.userId;
}

// Maakt een nieuwe maaltijd aan met de ingelogde user als kok.
async function create(req, res, next) {
  try {
    const invalidMessage = validateMealPayload(req.body);

    if (invalidMessage) {
      return json(res, 400, invalidMessage, null);
    }

    const createdMeal = await mealService.createMeal(req.body, req.user.userId);
    return json(res, 201, 'Meal created successfully', {
      meal: sanitizeMeal(createdMeal),
    });
  } catch (error) {
    return next(error);
  }
}

// Haalt alle maaltijden op inclusief kok en deelnemers.
async function getAll(req, res, next) {
  try {
    const meals = await mealService.findAllMeals();
    return json(res, 200, 'Meals retrieved successfully', {
      meals: meals.map(sanitizeMeal),
    });
  } catch (error) {
    return next(error);
  }
}

// Haalt een specifieke maaltijd op basis van meal ID.
async function getById(req, res, next) {
  try {
    const mealId = parseMealId(req.params.mealId);

    if (!mealId) {
      return json(res, 400, 'mealId must be a positive integer', null);
    }

    const meal = await mealService.findMealById(mealId);
    if (!meal) {
      return json(res, 404, 'Meal not found', null);
    }

    return json(res, 200, 'Meal retrieved successfully', {
      meal: sanitizeMeal(meal),
    });
  } catch (error) {
    return next(error);
  }
}

// Wijzigt een maaltijd als de ingelogde user de kok is.
async function update(req, res, next) {
  try {
    const mealId = parseMealId(req.params.mealId);

    if (!mealId) {
      return json(res, 400, 'mealId must be a positive integer', null);
    }

    const invalidMessage = validateMealPayload(req.body, { partial: true });
    if (invalidMessage) {
      return json(res, 400, invalidMessage, null);
    }

    const currentMeal = await mealService.findMealById(mealId);
    if (!currentMeal) {
      return json(res, 404, 'Meal not found', null);
    }

    if (!isOwner(req, currentMeal)) {
      return json(res, 403, 'You can only update or delete your own meal', null);
    }

    const updatedMeal = await mealService.updateMeal(mealId, req.body);
    return json(res, 200, 'Meal updated successfully', {
      meal: sanitizeMeal(updatedMeal),
    });
  } catch (error) {
    return next(error);
  }
}

// Verwijdert een maaltijd als de ingelogde user de kok is.
async function remove(req, res, next) {
  try {
    const mealId = parseMealId(req.params.mealId);

    if (!mealId) {
      return json(res, 400, 'mealId must be a positive integer', null);
    }

    const currentMeal = await mealService.findMealById(mealId);
    if (!currentMeal) {
      return json(res, 404, 'Meal not found', null);
    }

    if (!isOwner(req, currentMeal)) {
      return json(res, 403, 'You can only update or delete your own meal', null);
    }

    await mealService.deleteMeal(mealId);
    return json(res, 200, 'Meal deleted successfully', null);
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  create,
  getAll,
  getById,
  update,
  remove,
};
