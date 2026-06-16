const mealService = require('../services/meal.service');
const participantService = require('../services/participant.service');

function json(res, status, message, data = null) {
  return res.status(status).json({ status, message, data });
}

function parsePositiveInteger(value, fieldName) {
  const parsedValue = Number.parseInt(value, 10);

  if (!Number.isInteger(parsedValue) || parsedValue <= 0) {
    return {
      value: null,
      message: `${fieldName} must be a positive integer`,
    };
  }

  return {
    value: parsedValue,
    message: null,
  };
}

function sanitizeUser(user) {
  if (!user) {
    return null;
  }

  const { password, ...publicUser } = user;
  return publicUser;
}

function isMealOwner(req, meal) {
  return meal.cookId === req.user.userId || meal.cook?.id === req.user.userId;
}

async function getExistingMeal(res, mealId) {
  const meal = await mealService.findMealById(mealId);

  if (!meal) {
    json(res, 404, 'Meal not found', null);
    return null;
  }

  return meal;
}

async function participate(req, res, next) {
  try {
    const { value: mealId, message } = parsePositiveInteger(req.params.mealId, 'mealId');

    if (message) {
      return json(res, 400, message, null);
    }

    const meal = await getExistingMeal(res, mealId);
    if (!meal) {
      return undefined;
    }

    const existingParticipant = await participantService.findParticipantByMealAndUser(
      mealId,
      req.user.userId
    );

    if (existingParticipant) {
      return json(res, 409, 'User already participates in this meal', null);
    }

    const currentParticipants = Array.isArray(meal.participants)
      ? meal.participants
      : await participantService.findParticipantsByMealId(mealId);

    if (currentParticipants.length >= meal.maxAmountOfParticipants) {
      return json(res, 409, 'Meal has reached the maximum number of participants', null);
    }

    const participant = await participantService.addParticipant(mealId, req.user.userId);
    return json(res, 201, 'Participant added successfully', {
      participant: sanitizeUser(participant),
    });
  } catch (error) {
    return next(error);
  }
}

async function unsubscribe(req, res, next) {
  try {
    const { value: mealId, message } = parsePositiveInteger(req.params.mealId, 'mealId');

    if (message) {
      return json(res, 400, message, null);
    }

    const meal = await getExistingMeal(res, mealId);
    if (!meal) {
      return undefined;
    }

    const existingParticipant = await participantService.findParticipantByMealAndUser(
      mealId,
      req.user.userId
    );

    if (!existingParticipant) {
      return json(res, 404, 'Participant not found for this meal', null);
    }

    await participantService.removeParticipant(mealId, req.user.userId);
    return json(res, 200, 'Participant removed successfully', null);
  } catch (error) {
    return next(error);
  }
}

async function getParticipants(req, res, next) {
  try {
    const { value: mealId, message } = parsePositiveInteger(req.params.mealId, 'mealId');

    if (message) {
      return json(res, 400, message, null);
    }

    const meal = await getExistingMeal(res, mealId);
    if (!meal) {
      return undefined;
    }

    if (!isMealOwner(req, meal)) {
      return json(res, 403, 'Only the meal owner may view participants', null);
    }

    const participants = await participantService.findParticipantsByMealId(mealId);
    return json(res, 200, 'Participants retrieved successfully', {
      participants: participants.map(sanitizeUser),
    });
  } catch (error) {
    return next(error);
  }
}

async function getParticipant(req, res, next) {
  try {
    const { value: mealId, message: mealIdMessage } = parsePositiveInteger(req.params.mealId, 'mealId');
    const { value: userId, message: userIdMessage } = parsePositiveInteger(req.params.userId, 'userId');

    if (mealIdMessage) {
      return json(res, 400, mealIdMessage, null);
    }
    if (userIdMessage) {
      return json(res, 400, userIdMessage, null);
    }

    const meal = await getExistingMeal(res, mealId);
    if (!meal) {
      return undefined;
    }

    if (!isMealOwner(req, meal)) {
      return json(res, 403, 'Only the meal owner may view participants', null);
    }

    const participant = await participantService.findParticipantByMealAndUser(mealId, userId);
    if (!participant) {
      return json(res, 404, 'Participant not found for this meal', null);
    }

    return json(res, 200, 'Participant retrieved successfully', {
      participant: sanitizeUser(participant),
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  participate,
  unsubscribe,
  getParticipants,
  getParticipant,
};
