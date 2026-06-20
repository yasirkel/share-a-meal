process.env.JWT_SECRET = 'test-only-jwt-secret';

const { expect } = require('chai');
const jwt = require('jsonwebtoken');
const request = require('supertest');
const app = require('../src/app');
const mealService = require('../src/services/meal.service');
const { stubService } = require('./helpers/stubs');

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
  stubService(mealService, [
    'findAllMeals',
    'findMealById',
    'createMeal',
    'updateMeal',
    'deleteMeal',
  ]);
});

describe('POST /api/meal', () => {
  it('create meal missing required field returns 400', async () => {
    const response = await request(app)
      .post('/api/meal')
      .set('Authorization', `Bearer ${tokenFor()}`)
      .send(validMeal({ name: '' }));

    expect(response.status).to.equal(400);
    expect(response.body).to.deep.equal({
      status: 400,
      message: 'name is required',
      data: null,
    });
    expect(mealService.createMeal.calls).to.have.lengthOf(0);
  });

  it('create meal without token returns 401', async () => {
    const response = await request(app).post('/api/meal').send(validMeal());

    expect(response.status).to.equal(401);
    expect(response.body).to.deep.equal({
      status: 401,
      message: 'Authentication token is required',
      data: null,
    });
  });

  it('create meal success returns 201', async () => {
    mealService.createMeal.resolves(meal);

    const response = await request(app)
      .post('/api/meal')
      .set('Authorization', `Bearer ${tokenFor()}`)
      .send(validMeal());

    expect(response.status).to.equal(201);
    expect(mealService.createMeal.calls[0][0]).to.include({ name: 'Pasta pesto' });
    expect(mealService.createMeal.calls[0][1]).to.equal(42);
    expect(response.body.status).to.equal(201);
    expect(response.body.message).to.equal('Meal created successfully');
    expect(response.body.data.meal.cook.password).to.be.undefined;
    expect(response.body.data.meal.participants[0].password).to.be.undefined;
  });
});

describe('PUT /api/meal/:mealId', () => {
  it('update meal missing required fields returns 400', async () => {
    const response = await request(app)
      .put('/api/meal/7')
      .set('Authorization', `Bearer ${tokenFor()}`)
      .send(validUpdate({ price: undefined }));

    expect(response.status).to.equal(400);
    expect(response.body).to.deep.equal({
      status: 400,
      message: 'price is required',
      data: null,
    });
  });

  it('update meal without token returns 401', async () => {
    const response = await request(app).put('/api/meal/7').send(validUpdate());

    expect(response.status).to.equal(401);
    expect(response.body.data).to.equal(null);
  });

  it('update meal by non-owner returns 403', async () => {
    mealService.findMealById.resolves({ ...meal, cookId: 42 });

    const response = await request(app)
      .put('/api/meal/7')
      .set('Authorization', `Bearer ${tokenFor({ id: 99, emailAddress: 'other@example.com' })}`)
      .send(validUpdate());

    expect(response.status).to.equal(403);
    expect(response.body).to.deep.equal({
      status: 403,
      message: 'You can only update or delete your own meal',
      data: null,
    });
    expect(mealService.updateMeal.calls).to.have.lengthOf(0);
  });

  it('update non-existing meal returns 404', async () => {
    mealService.findMealById.resolves(null);

    const response = await request(app)
      .put('/api/meal/999')
      .set('Authorization', `Bearer ${tokenFor()}`)
      .send(validUpdate());

    expect(response.status).to.equal(404);
    expect(response.body).to.deep.equal({
      status: 404,
      message: 'Meal not found',
      data: null,
    });
  });

  it('update meal success returns 200', async () => {
    const updatedMeal = { ...meal, name: 'Pasta pesto updated' };
    mealService.findMealById.resolvesOnce(meal);
    mealService.updateMeal.resolves(updatedMeal);

    const response = await request(app)
      .put('/api/meal/7')
      .set('Authorization', `Bearer ${tokenFor()}`)
      .send(validUpdate());

    expect(response.status).to.equal(200);
    expect(mealService.updateMeal.calls).to.deep.equal([[7, validUpdate()]]);
    expect(response.body).to.deep.include({
      status: 200,
      message: 'Meal updated successfully',
    });
    expect(response.body.data.meal.name).to.equal('Pasta pesto updated');
  });
});

describe('GET /api/meal', () => {
  it('get all meals returns 200', async () => {
    mealService.findAllMeals.resolves([meal]);

    const response = await request(app).get('/api/meal');

    expect(response.status).to.equal(200);
    expect(response.body.status).to.equal(200);
    expect(response.body.message).to.equal('Meals retrieved successfully');
    expect(response.body.data.meals).to.have.lengthOf(1);
    expect(response.body.data.meals[0].cook.password).to.be.undefined;
  });
});

describe('GET /api/meal/:mealId', () => {
  it('get meal by non-existing id returns 404', async () => {
    mealService.findMealById.resolves(null);

    const response = await request(app).get('/api/meal/999');

    expect(response.status).to.equal(404);
    expect(response.body).to.deep.equal({
      status: 404,
      message: 'Meal not found',
      data: null,
    });
  });

  it('get meal by id success returns 200', async () => {
    mealService.findMealById.resolves(meal);

    const response = await request(app).get('/api/meal/7');

    expect(response.status).to.equal(200);
    expect(response.body).to.deep.include({
      status: 200,
      message: 'Meal retrieved successfully',
    });
    expect(response.body.data.meal.id).to.equal(7);
    expect(response.body.data.meal.participants[0].password).to.be.undefined;
  });
});

describe('DELETE /api/meal/:mealId', () => {
  it('delete meal without token returns 401', async () => {
    const response = await request(app).delete('/api/meal/7');

    expect(response.status).to.equal(401);
    expect(response.body.data).to.equal(null);
  });

  it('delete meal by non-owner returns 403', async () => {
    mealService.findMealById.resolves({ ...meal, cookId: 42 });

    const response = await request(app)
      .delete('/api/meal/7')
      .set('Authorization', `Bearer ${tokenFor({ id: 99, emailAddress: 'other@example.com' })}`);

    expect(response.status).to.equal(403);
    expect(response.body.message).to.equal('You can only update or delete your own meal');
    expect(mealService.deleteMeal.calls).to.have.lengthOf(0);
  });

  it('delete non-existing meal returns 404', async () => {
    mealService.findMealById.resolves(null);

    const response = await request(app)
      .delete('/api/meal/999')
      .set('Authorization', `Bearer ${tokenFor()}`);

    expect(response.status).to.equal(404);
    expect(response.body).to.deep.equal({
      status: 404,
      message: 'Meal not found',
      data: null,
    });
  });

  it('delete meal success returns 200', async () => {
    mealService.findMealById.resolves(meal);
    mealService.deleteMeal.resolves(true);

    const response = await request(app)
      .delete('/api/meal/7')
      .set('Authorization', `Bearer ${tokenFor()}`);

    expect(response.status).to.equal(200);
    expect(response.body).to.deep.equal({
      status: 200,
      message: 'Meal deleted successfully',
      data: null,
    });
    expect(mealService.deleteMeal.calls).to.deep.equal([[7]]);
  });
});
