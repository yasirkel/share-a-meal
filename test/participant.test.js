process.env.JWT_SECRET = 'test-only-jwt-secret';

const { expect } = require('chai');
const jwt = require('jsonwebtoken');
const request = require('supertest');
const app = require('../src/app');
const mealService = require('../src/services/meal.service');
const participantService = require('../src/services/participant.service');
const { stubService } = require('./helpers/stubs');

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
  stubService(mealService, ['findMealById']);
  stubService(participantService, [
    'findParticipantsByMealId',
    'findParticipantByMealAndUser',
    'addParticipant',
    'removeParticipant',
  ]);
});

describe('POST /api/meal/:mealId/participate', () => {
  it('participate without token returns 401', async () => {
    const response = await request(app).post('/api/meal/7/participate');

    expect(response.status).to.equal(401);
    expect(response.body).to.deep.equal({
      status: 401,
      message: 'Authentication token is required',
      data: null,
    });
  });

  it('participate non-existing meal returns 404', async () => {
    mealService.findMealById.resolves(null);

    const response = await request(app)
      .post('/api/meal/999/participate')
      .set('Authorization', `Bearer ${tokenFor(participant)}`);

    expect(response.status).to.equal(404);
    expect(response.body).to.deep.equal({
      status: 404,
      message: 'Meal not found',
      data: null,
    });
  });

  it('participate success returns 201', async () => {
    mealService.findMealById.resolves(meal);
    participantService.findParticipantByMealAndUser.resolves(null);
    participantService.addParticipant.resolves(participant);

    const response = await request(app)
      .post('/api/meal/7/participate')
      .set('Authorization', `Bearer ${tokenFor(participant)}`);

    expect(response.status).to.equal(201);
    expect(participantService.addParticipant.calls).to.deep.equal([[7, 99]]);
    expect(response.body).to.deep.equal({
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

  it('participate twice returns 409', async () => {
    mealService.findMealById.resolves(meal);
    participantService.findParticipantByMealAndUser.resolves(participant);

    const response = await request(app)
      .post('/api/meal/7/participate')
      .set('Authorization', `Bearer ${tokenFor(participant)}`);

    expect(response.status).to.equal(409);
    expect(response.body).to.deep.equal({
      status: 409,
      message: 'User already participates in this meal',
      data: null,
    });
    expect(participantService.addParticipant.calls).to.have.lengthOf(0);
  });

  it('participate when meal full returns 409', async () => {
    mealService.findMealById.resolves({
      ...meal,
      maxAmountOfParticipants: 1,
      participants: [{ id: 10 }],
    });
    participantService.findParticipantByMealAndUser.resolves(null);

    const response = await request(app)
      .post('/api/meal/7/participate')
      .set('Authorization', `Bearer ${tokenFor(participant)}`);

    expect(response.status).to.equal(409);
    expect(response.body).to.deep.equal({
      status: 409,
      message: 'Meal has reached the maximum number of participants',
      data: null,
    });
  });
});

describe('DELETE /api/meal/:mealId/participate', () => {
  it('unsubscribe without token returns 401', async () => {
    const response = await request(app).delete('/api/meal/7/participate');

    expect(response.status).to.equal(401);
    expect(response.body.data).to.equal(null);
  });

  it('unsubscribe non-existing meal returns 404', async () => {
    mealService.findMealById.resolves(null);

    const response = await request(app)
      .delete('/api/meal/999/participate')
      .set('Authorization', `Bearer ${tokenFor(participant)}`);

    expect(response.status).to.equal(404);
    expect(response.body.message).to.equal('Meal not found');
  });

  it('unsubscribe when not participating returns 404', async () => {
    mealService.findMealById.resolves(meal);
    participantService.findParticipantByMealAndUser.resolves(null);

    const response = await request(app)
      .delete('/api/meal/7/participate')
      .set('Authorization', `Bearer ${tokenFor(participant)}`);

    expect(response.status).to.equal(404);
    expect(response.body).to.deep.equal({
      status: 404,
      message: 'Participant not found for this meal',
      data: null,
    });
  });

  it('unsubscribe success returns 200', async () => {
    mealService.findMealById.resolves(meal);
    participantService.findParticipantByMealAndUser.resolves(participant);
    participantService.removeParticipant.resolves(true);

    const response = await request(app)
      .delete('/api/meal/7/participate')
      .set('Authorization', `Bearer ${tokenFor(participant)}`);

    expect(response.status).to.equal(200);
    expect(participantService.removeParticipant.calls).to.deep.equal([[7, 99]]);
    expect(response.body).to.deep.equal({
      status: 200,
      message: 'Participant removed successfully',
      data: null,
    });
  });
});

describe('GET /api/meal/:mealId/participants', () => {
  it('get participants without token returns 401', async () => {
    const response = await request(app).get('/api/meal/7/participants');

    expect(response.status).to.equal(401);
    expect(response.body.data).to.equal(null);
  });

  it('get participants as non-owner returns 403', async () => {
    mealService.findMealById.resolves(meal);

    const response = await request(app)
      .get('/api/meal/7/participants')
      .set('Authorization', `Bearer ${tokenFor(participant)}`);

    expect(response.status).to.equal(403);
    expect(response.body).to.deep.equal({
      status: 403,
      message: 'Only the meal owner may view participants',
      data: null,
    });
  });

  it('get participants non-existing meal returns 404', async () => {
    mealService.findMealById.resolves(null);

    const response = await request(app)
      .get('/api/meal/999/participants')
      .set('Authorization', `Bearer ${tokenFor(owner)}`);

    expect(response.status).to.equal(404);
    expect(response.body.message).to.equal('Meal not found');
  });

  it('get participants success returns 200', async () => {
    mealService.findMealById.resolves(meal);
    participantService.findParticipantsByMealId.resolves([participant]);

    const response = await request(app)
      .get('/api/meal/7/participants')
      .set('Authorization', `Bearer ${tokenFor(owner)}`);

    expect(response.status).to.equal(200);
    expect(response.body).to.deep.equal({
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
  it('get participant detail without token returns 401', async () => {
    const response = await request(app).get('/api/meal/7/participants/99');

    expect(response.status).to.equal(401);
    expect(response.body.data).to.equal(null);
  });

  it('get participant detail as non-owner returns 403', async () => {
    mealService.findMealById.resolves(meal);

    const response = await request(app)
      .get('/api/meal/7/participants/99')
      .set('Authorization', `Bearer ${tokenFor(participant)}`);

    expect(response.status).to.equal(403);
    expect(response.body.message).to.equal('Only the meal owner may view participants');
  });

  it('get participant detail non-existing meal returns 404', async () => {
    mealService.findMealById.resolves(null);

    const response = await request(app)
      .get('/api/meal/999/participants/99')
      .set('Authorization', `Bearer ${tokenFor(owner)}`);

    expect(response.status).to.equal(404);
    expect(response.body.message).to.equal('Meal not found');
  });

  it('get participant detail non-existing participant returns 404', async () => {
    mealService.findMealById.resolves(meal);
    participantService.findParticipantByMealAndUser.resolves(null);

    const response = await request(app)
      .get('/api/meal/7/participants/123')
      .set('Authorization', `Bearer ${tokenFor(owner)}`);

    expect(response.status).to.equal(404);
    expect(response.body).to.deep.equal({
      status: 404,
      message: 'Participant not found for this meal',
      data: null,
    });
  });

  it('get participant detail success returns 200', async () => {
    mealService.findMealById.resolves(meal);
    participantService.findParticipantByMealAndUser.resolves(participant);

    const response = await request(app)
      .get('/api/meal/7/participants/99')
      .set('Authorization', `Bearer ${tokenFor(owner)}`);

    expect(response.status).to.equal(200);
    expect(response.body).to.deep.equal({
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
