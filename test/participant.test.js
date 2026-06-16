process.env.JWT_SECRET = 'test-only-jwt-secret';

const jwt = require('jsonwebtoken');
const request = require('supertest');
const app = require('../src/app');
const mealService = require('../src/services/meal.service');
const participantService = require('../src/services/participant.service');

jest.mock('../src/services/meal.service');
jest.mock('../src/services/participant.service');

const owner = {
  id: 42,
  firstName: 'Yasir',
  lastName: 'Kel',
  emailAddress: 'yasir@example.com',
  password: 'secret-hash',
};

const participant = {
  id: 99,
  firstName: 'Guest',
  lastName: 'User',
  emailAddress: 'guest@example.com',
  phoneNumber: '0612345678',
  password: 'secret-hash',
};

const meal = {
  id: 7,
  name: 'Pasta pesto',
  maxAmountOfParticipants: 3,
  cookId: 42,
  cook: owner,
  participants: [],
};

function tokenFor(user = owner) {
  return jwt.sign(
    { userId: user.id, emailAddress: user.emailAddress },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('POST /api/meal/:mealId/participate', () => {
  test('participate without token returns 401', async () => {
    const response = await request(app).post('/api/meal/7/participate');

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      status: 401,
      message: 'Authentication token is required',
      data: null,
    });
  });

  test('participate non-existing meal returns 404', async () => {
    mealService.findMealById.mockResolvedValue(null);

    const response = await request(app)
      .post('/api/meal/999/participate')
      .set('Authorization', `Bearer ${tokenFor(participant)}`);

    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      status: 404,
      message: 'Meal not found',
      data: null,
    });
  });

  test('participate success returns 201', async () => {
    mealService.findMealById.mockResolvedValue(meal);
    participantService.findParticipantByMealAndUser.mockResolvedValue(null);
    participantService.addParticipant.mockResolvedValue(participant);

    const response = await request(app)
      .post('/api/meal/7/participate')
      .set('Authorization', `Bearer ${tokenFor(participant)}`);

    expect(response.status).toBe(201);
    expect(participantService.addParticipant).toHaveBeenCalledWith(7, 99);
    expect(response.body).toEqual({
      status: 201,
      message: 'Participant added successfully',
      data: {
        participant: {
          id: 99,
          firstName: 'Guest',
          lastName: 'User',
          emailAddress: 'guest@example.com',
          phoneNumber: '0612345678',
        },
      },
    });
  });

  test('participate twice returns 409', async () => {
    mealService.findMealById.mockResolvedValue(meal);
    participantService.findParticipantByMealAndUser.mockResolvedValue(participant);

    const response = await request(app)
      .post('/api/meal/7/participate')
      .set('Authorization', `Bearer ${tokenFor(participant)}`);

    expect(response.status).toBe(409);
    expect(response.body).toEqual({
      status: 409,
      message: 'User already participates in this meal',
      data: null,
    });
    expect(participantService.addParticipant).not.toHaveBeenCalled();
  });

  test('participate when meal full returns 409', async () => {
    mealService.findMealById.mockResolvedValue({
      ...meal,
      maxAmountOfParticipants: 1,
      participants: [{ id: 10 }],
    });
    participantService.findParticipantByMealAndUser.mockResolvedValue(null);

    const response = await request(app)
      .post('/api/meal/7/participate')
      .set('Authorization', `Bearer ${tokenFor(participant)}`);

    expect(response.status).toBe(409);
    expect(response.body).toEqual({
      status: 409,
      message: 'Meal has reached the maximum number of participants',
      data: null,
    });
  });
});

describe('DELETE /api/meal/:mealId/participate', () => {
  test('unsubscribe without token returns 401', async () => {
    const response = await request(app).delete('/api/meal/7/participate');

    expect(response.status).toBe(401);
    expect(response.body.data).toBeNull();
  });

  test('unsubscribe non-existing meal returns 404', async () => {
    mealService.findMealById.mockResolvedValue(null);

    const response = await request(app)
      .delete('/api/meal/999/participate')
      .set('Authorization', `Bearer ${tokenFor(participant)}`);

    expect(response.status).toBe(404);
    expect(response.body.message).toBe('Meal not found');
  });

  test('unsubscribe when not participating returns 404', async () => {
    mealService.findMealById.mockResolvedValue(meal);
    participantService.findParticipantByMealAndUser.mockResolvedValue(null);

    const response = await request(app)
      .delete('/api/meal/7/participate')
      .set('Authorization', `Bearer ${tokenFor(participant)}`);

    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      status: 404,
      message: 'Participant not found for this meal',
      data: null,
    });
  });

  test('unsubscribe success returns 200', async () => {
    mealService.findMealById.mockResolvedValue(meal);
    participantService.findParticipantByMealAndUser.mockResolvedValue(participant);
    participantService.removeParticipant.mockResolvedValue(true);

    const response = await request(app)
      .delete('/api/meal/7/participate')
      .set('Authorization', `Bearer ${tokenFor(participant)}`);

    expect(response.status).toBe(200);
    expect(participantService.removeParticipant).toHaveBeenCalledWith(7, 99);
    expect(response.body).toEqual({
      status: 200,
      message: 'Participant removed successfully',
      data: null,
    });
  });
});

describe('GET /api/meal/:mealId/participants', () => {
  test('get participants without token returns 401', async () => {
    const response = await request(app).get('/api/meal/7/participants');

    expect(response.status).toBe(401);
    expect(response.body.data).toBeNull();
  });

  test('get participants as non-owner returns 403', async () => {
    mealService.findMealById.mockResolvedValue(meal);

    const response = await request(app)
      .get('/api/meal/7/participants')
      .set('Authorization', `Bearer ${tokenFor(participant)}`);

    expect(response.status).toBe(403);
    expect(response.body).toEqual({
      status: 403,
      message: 'Only the meal owner may view participants',
      data: null,
    });
  });

  test('get participants non-existing meal returns 404', async () => {
    mealService.findMealById.mockResolvedValue(null);

    const response = await request(app)
      .get('/api/meal/999/participants')
      .set('Authorization', `Bearer ${tokenFor(owner)}`);

    expect(response.status).toBe(404);
    expect(response.body.message).toBe('Meal not found');
  });

  test('get participants success returns 200', async () => {
    mealService.findMealById.mockResolvedValue(meal);
    participantService.findParticipantsByMealId.mockResolvedValue([participant]);

    const response = await request(app)
      .get('/api/meal/7/participants')
      .set('Authorization', `Bearer ${tokenFor(owner)}`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      status: 200,
      message: 'Participants retrieved successfully',
      data: {
        participants: [{
          id: 99,
          firstName: 'Guest',
          lastName: 'User',
          emailAddress: 'guest@example.com',
          phoneNumber: '0612345678',
        }],
      },
    });
  });
});

describe('GET /api/meal/:mealId/participants/:userId', () => {
  test('get participant detail without token returns 401', async () => {
    const response = await request(app).get('/api/meal/7/participants/99');

    expect(response.status).toBe(401);
    expect(response.body.data).toBeNull();
  });

  test('get participant detail as non-owner returns 403', async () => {
    mealService.findMealById.mockResolvedValue(meal);

    const response = await request(app)
      .get('/api/meal/7/participants/99')
      .set('Authorization', `Bearer ${tokenFor(participant)}`);

    expect(response.status).toBe(403);
    expect(response.body.message).toBe('Only the meal owner may view participants');
  });

  test('get participant detail non-existing meal returns 404', async () => {
    mealService.findMealById.mockResolvedValue(null);

    const response = await request(app)
      .get('/api/meal/999/participants/99')
      .set('Authorization', `Bearer ${tokenFor(owner)}`);

    expect(response.status).toBe(404);
    expect(response.body.message).toBe('Meal not found');
  });

  test('get participant detail non-existing participant returns 404', async () => {
    mealService.findMealById.mockResolvedValue(meal);
    participantService.findParticipantByMealAndUser.mockResolvedValue(null);

    const response = await request(app)
      .get('/api/meal/7/participants/123')
      .set('Authorization', `Bearer ${tokenFor(owner)}`);

    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      status: 404,
      message: 'Participant not found for this meal',
      data: null,
    });
  });

  test('get participant detail success returns 200', async () => {
    mealService.findMealById.mockResolvedValue(meal);
    participantService.findParticipantByMealAndUser.mockResolvedValue(participant);

    const response = await request(app)
      .get('/api/meal/7/participants/99')
      .set('Authorization', `Bearer ${tokenFor(owner)}`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      status: 200,
      message: 'Participant retrieved successfully',
      data: {
        participant: {
          id: 99,
          firstName: 'Guest',
          lastName: 'User',
          emailAddress: 'guest@example.com',
          phoneNumber: '0612345678',
        },
      },
    });
  });
});
