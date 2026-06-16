process.env.JWT_SECRET = 'test-only-jwt-secret';

const jwt = require('jsonwebtoken');
const request = require('supertest');
const app = require('../src/app');
const mealService = require('../src/services/meal.service');

jest.mock('../src/services/meal.service');

const cook = {
  id: 42,
  firstName: 'Yasir',
  lastName: 'Kel',
  emailAddress: 'yasir@example.com',
  phoneNumber: '0612345678',
  password: 'secret-hash',
};

const participant = {
  id: 99,
  firstName: 'Guest',
  lastName: 'User',
  emailAddress: 'guest@example.com',
  phoneNumber: '0698765432',
  password: 'secret-hash',
};

const meal = {
  id: 7,
  name: 'Pasta pesto',
  description: 'Verse pasta met pesto',
  price: 8.5,
  dateTime: '2026-07-01T18:30:00.000Z',
  maxAmountOfParticipants: 4,
  imageUrl: 'https://example.com/pasta.jpg',
  cookId: 42,
  isActive: true,
  isVega: true,
  isVegan: false,
  isToTakeHome: false,
  allergenes: 'gluten',
  cook,
  participants: [participant],
};

function tokenFor(user = cook) {
  return jwt.sign(
    { userId: user.id, emailAddress: user.emailAddress },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );
}

function validMeal(overrides = {}) {
  return {
    name: 'Pasta pesto',
    description: 'Verse pasta met pesto',
    price: 8.5,
    dateTime: '2026-07-01T18:30:00.000Z',
    maxAmountOfParticipants: 4,
    imageUrl: 'https://example.com/pasta.jpg',
    ...overrides,
  };
}

function validUpdate(overrides = {}) {
  return {
    name: 'Pasta pesto updated',
    price: 9.25,
    maxAmountOfParticipants: 5,
    ...overrides,
  };
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('POST /api/meal', () => {
  test('create meal missing required field returns 400', async () => {
    const response = await request(app)
      .post('/api/meal')
      .set('Authorization', `Bearer ${tokenFor()}`)
      .send(validMeal({ name: '' }));

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      status: 400,
      message: 'name is required',
      data: null,
    });
    expect(mealService.createMeal).not.toHaveBeenCalled();
  });

  test('create meal without token returns 401', async () => {
    const response = await request(app).post('/api/meal').send(validMeal());

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      status: 401,
      message: 'Authentication token is required',
      data: null,
    });
  });

  test('create meal success returns 201', async () => {
    mealService.createMeal.mockResolvedValue(meal);

    const response = await request(app)
      .post('/api/meal')
      .set('Authorization', `Bearer ${tokenFor()}`)
      .send(validMeal());

    expect(response.status).toBe(201);
    expect(mealService.createMeal).toHaveBeenCalledWith(expect.objectContaining({
      name: 'Pasta pesto',
    }), 42);
    expect(response.body.status).toBe(201);
    expect(response.body.message).toBe('Meal created successfully');
    expect(response.body.data.meal.cook.password).toBeUndefined();
    expect(response.body.data.meal.participants[0].password).toBeUndefined();
  });
});

describe('PUT /api/meal/:mealId', () => {
  test('update meal missing required fields returns 400', async () => {
    const response = await request(app)
      .put('/api/meal/7')
      .set('Authorization', `Bearer ${tokenFor()}`)
      .send(validUpdate({ price: undefined }));

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      status: 400,
      message: 'price is required',
      data: null,
    });
  });

  test('update meal without token returns 401', async () => {
    const response = await request(app).put('/api/meal/7').send(validUpdate());

    expect(response.status).toBe(401);
    expect(response.body.data).toBeNull();
  });

  test('update meal by non-owner returns 403', async () => {
    mealService.findMealById.mockResolvedValue({ ...meal, cookId: 42 });

    const response = await request(app)
      .put('/api/meal/7')
      .set('Authorization', `Bearer ${tokenFor({ id: 99, emailAddress: 'other@example.com' })}`)
      .send(validUpdate());

    expect(response.status).toBe(403);
    expect(response.body).toEqual({
      status: 403,
      message: 'You can only update or delete your own meal',
      data: null,
    });
    expect(mealService.updateMeal).not.toHaveBeenCalled();
  });

  test('update non-existing meal returns 404', async () => {
    mealService.findMealById.mockResolvedValue(null);

    const response = await request(app)
      .put('/api/meal/999')
      .set('Authorization', `Bearer ${tokenFor()}`)
      .send(validUpdate());

    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      status: 404,
      message: 'Meal not found',
      data: null,
    });
  });

  test('update meal success returns 200', async () => {
    const updatedMeal = { ...meal, name: 'Pasta pesto updated' };
    mealService.findMealById.mockResolvedValueOnce(meal);
    mealService.updateMeal.mockResolvedValue(updatedMeal);

    const response = await request(app)
      .put('/api/meal/7')
      .set('Authorization', `Bearer ${tokenFor()}`)
      .send(validUpdate());

    expect(response.status).toBe(200);
    expect(mealService.updateMeal).toHaveBeenCalledWith(7, validUpdate());
    expect(response.body).toMatchObject({
      status: 200,
      message: 'Meal updated successfully',
    });
    expect(response.body.data.meal.name).toBe('Pasta pesto updated');
  });
});

describe('GET /api/meal', () => {
  test('get all meals returns 200', async () => {
    mealService.findAllMeals.mockResolvedValue([meal]);

    const response = await request(app).get('/api/meal');

    expect(response.status).toBe(200);
    expect(response.body.status).toBe(200);
    expect(response.body.message).toBe('Meals retrieved successfully');
    expect(response.body.data.meals).toHaveLength(1);
    expect(response.body.data.meals[0].cook.password).toBeUndefined();
  });
});

describe('GET /api/meal/:mealId', () => {
  test('get meal by non-existing id returns 404', async () => {
    mealService.findMealById.mockResolvedValue(null);

    const response = await request(app).get('/api/meal/999');

    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      status: 404,
      message: 'Meal not found',
      data: null,
    });
  });

  test('get meal by id success returns 200', async () => {
    mealService.findMealById.mockResolvedValue(meal);

    const response = await request(app).get('/api/meal/7');

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      status: 200,
      message: 'Meal retrieved successfully',
    });
    expect(response.body.data.meal.id).toBe(7);
    expect(response.body.data.meal.participants[0].password).toBeUndefined();
  });
});

describe('DELETE /api/meal/:mealId', () => {
  test('delete meal without token returns 401', async () => {
    const response = await request(app).delete('/api/meal/7');

    expect(response.status).toBe(401);
    expect(response.body.data).toBeNull();
  });

  test('delete meal by non-owner returns 403', async () => {
    mealService.findMealById.mockResolvedValue({ ...meal, cookId: 42 });

    const response = await request(app)
      .delete('/api/meal/7')
      .set('Authorization', `Bearer ${tokenFor({ id: 99, emailAddress: 'other@example.com' })}`);

    expect(response.status).toBe(403);
    expect(response.body.message).toBe('You can only update or delete your own meal');
    expect(mealService.deleteMeal).not.toHaveBeenCalled();
  });

  test('delete non-existing meal returns 404', async () => {
    mealService.findMealById.mockResolvedValue(null);

    const response = await request(app)
      .delete('/api/meal/999')
      .set('Authorization', `Bearer ${tokenFor()}`);

    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      status: 404,
      message: 'Meal not found',
      data: null,
    });
  });

  test('delete meal success returns 200', async () => {
    mealService.findMealById.mockResolvedValue(meal);
    mealService.deleteMeal.mockResolvedValue(true);

    const response = await request(app)
      .delete('/api/meal/7')
      .set('Authorization', `Bearer ${tokenFor()}`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      status: 200,
      message: 'Meal deleted successfully',
      data: null,
    });
    expect(mealService.deleteMeal).toHaveBeenCalledWith(7);
  });
});
