const bcrypt = require('bcrypt');
const userService = require('../services/user.service');
const { validateUserPayload } = require('../validators/user.validator');

function json(res, status, message, data = null) {
  return res.status(status).json({ status, message, data });
}

function parseUserId(value) {
  const userId = Number.parseInt(value, 10);
  return Number.isInteger(userId) && userId > 0 ? userId : null;
}

function sanitizeUser(user) {
  if (!user) {
    return null;
  }

  const { password, ...publicUser } = user;
  return publicUser;
}

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

function parseUserFilters(query) {
  const filters = { ...query };
  const fields = Object.keys(filters);

  if (fields.length > 2) {
    return {
      error: 'A maximum of 2 filter fields is allowed',
      filters: null,
    };
  }

  const invalidField = fields.find((field) => !userService.allowedFilterFields.includes(field));
  if (invalidField) {
    return {
      error: `Filter field ${invalidField} is not supported`,
      filters: null,
    };
  }

  return {
    error: null,
    filters,
  };
}

function ownerOnly(req, res, userId) {
  if (req.user.userId !== userId) {
    json(res, 403, 'You can only update or delete your own user', null);
    return false;
  }

  return true;
}

async function register(req, res, next) {
  try {
    const errors = validateUserPayload(req.body);

    if (errors.length > 0) {
      return json(res, 400, errors[0], null);
    }

    const existingUser = await userService.findUserByEmail(req.body.emailAddress);
    if (existingUser) {
      return json(res, 409, 'emailAddress is already in use', null);
    }

    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    const createdUser = await userService.createUser({
      ...req.body,
      password: hashedPassword,
    });

    return json(res, 201, 'User registered successfully', {
      user: sanitizeUser(createdUser),
    });
  } catch (error) {
    return next(error);
  }
}

async function getAll(req, res, next) {
  try {
    const { error, filters } = parseUserFilters(req.query);
    if (error) {
      return json(res, 400, error, null);
    }

    const users = await userService.findAllUsers(filters);
    return json(res, 200, 'Users retrieved successfully', {
      users: users.map(sanitizeUser),
    });
  } catch (error) {
    return next(error);
  }
}

async function getProfile(req, res, next) {
  try {
    const user = await userService.findUserById(req.user.userId);

    if (!user) {
      return json(res, 404, 'User not found', null);
    }

    const meals = await userService.findMealsByCookId(req.user.userId, { futureOnly: true });

    return json(res, 200, 'Profile retrieved successfully', {
      user: sanitizeUser(user),
      meals: meals.map(sanitizeMeal),
    });
  } catch (error) {
    return next(error);
  }
}

async function getById(req, res, next) {
  try {
    const userId = parseUserId(req.params.userId);

    if (!userId) {
      return json(res, 400, 'userId must be a positive integer', null);
    }

    const user = await userService.findUserById(userId);
    if (!user) {
      return json(res, 404, 'User not found', null);
    }

    const meals = await userService.findMealsByCookId(userId);

    return json(res, 200, 'User retrieved successfully', {
      user: sanitizeUser(user),
      meals: meals.map(sanitizeMeal),
    });
  } catch (error) {
    return next(error);
  }
}

async function update(req, res, next) {
  try {
    const userId = parseUserId(req.params.userId);

    if (!userId) {
      return json(res, 400, 'userId must be a positive integer', null);
    }

    if (!ownerOnly(req, res, userId)) {
      return undefined;
    }

    const errors = validateUserPayload(req.body, { requirePassword: false });
    if (errors.length > 0) {
      return json(res, 400, errors[0], null);
    }

    const currentUser = await userService.findUserById(userId);
    if (!currentUser) {
      return json(res, 404, 'User not found', null);
    }

    const existingUser = await userService.findUserByEmail(req.body.emailAddress);
    if (existingUser && existingUser.id !== userId) {
      return json(res, 409, 'emailAddress is already in use', null);
    }

    const updatedUser = await userService.updateUser(userId, req.body);
    return json(res, 200, 'User updated successfully', {
      user: sanitizeUser(updatedUser),
    });
  } catch (error) {
    return next(error);
  }
}

async function remove(req, res, next) {
  try {
    const userId = parseUserId(req.params.userId);

    if (!userId) {
      return json(res, 400, 'userId must be a positive integer', null);
    }

    if (!ownerOnly(req, res, userId)) {
      return undefined;
    }

    const currentUser = await userService.findUserById(userId);
    if (!currentUser) {
      return json(res, 404, 'User not found', null);
    }

    await userService.deleteUser(userId);
    return json(res, 200, `User with ID #${userId} has been deleted`, null);
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  register,
  getAll,
  getProfile,
  getById,
  update,
  remove,
};
