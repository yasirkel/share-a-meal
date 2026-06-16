process.env.JWT_SECRET = 'test-only-jwt-secret';

const { expect } = require('chai');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const request = require('supertest');
const app = require('../src/app');
const userService = require('../src/services/user.service');
const { stubService } = require('./helpers/stubs');

const baseUser = {
  id: 42,
  firstName: 'Yasir',
  lastName: 'Kel',
  street: 'Hogeschoollaan',
  city: 'Breda',
  emailAddress: 'yasir@example.com',
  phoneNumber: '0612345678',
  isActive: true,
};

function tokenFor(user = baseUser) {
  return jwt.sign(
    { userId: user.id, emailAddress: user.emailAddress },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );
}

function validRegistration(overrides = {}) {
  return {
    firstName: 'Yasir',
    lastName: 'Kel',
    street: 'Hogeschoollaan',
    city: 'Breda',
    emailAddress: 'yasir@example.com',
    password: 'strongpass',
    phoneNumber: '0612345678',
    ...overrides,
  };
}

beforeEach(() => {
  stubService(userService, [
    'findAllUsers',
    'findUserById',
    'findUserByEmail',
    'createUser',
    'updateUser',
    'deleteUser',
  ]);
});

describe('POST /api/user', () => {
  it('registers a new user with a hashed password', async () => {
    userService.findUserByEmail.resolves(null);
    userService.createUser.implements(async (user) => ({
      id: 42,
      firstName: user.firstName,
      lastName: user.lastName,
      street: user.street,
      city: user.city,
      emailAddress: user.emailAddress,
      phoneNumber: user.phoneNumber,
      isActive: true,
    }));

    const response = await request(app).post('/api/user').send(validRegistration());

    expect(response.status).to.equal(201);
    expect(response.body).to.deep.equal({
      status: 201,
      message: 'User registered successfully',
      data: { user: baseUser },
    });

    const createdUser = userService.createUser.calls[0][0];
    expect(createdUser.password).not.to.equal('strongpass');
    expect(await bcrypt.compare('strongpass', createdUser.password)).to.equal(true);
    expect(response.body.data.user.password).to.be.undefined;
  });

  it('rejects missing required fields', async () => {
    const response = await request(app).post('/api/user').send(validRegistration({ firstName: '' }));

    expect(response.status).to.equal(400);
    expect(response.body).to.deep.equal({
      status: 400,
      message: 'firstName is required',
      data: null,
    });
    expect(userService.createUser.calls).to.have.lengthOf(0);
  });

  it('rejects an invalid emailAddress', async () => {
    const response = await request(app).post('/api/user').send(
      validRegistration({ emailAddress: 'not-an-email' })
    );

    expect(response.status).to.equal(400);
    expect(response.body.message).to.equal('emailAddress must be a valid email address');
  });

  it('rejects a weak password', async () => {
    const response = await request(app).post('/api/user').send(validRegistration({ password: 'short' }));

    expect(response.status).to.equal(400);
    expect(response.body.message).to.equal('password must be at least 8 characters');
  });

  it('rejects an invalid phoneNumber', async () => {
    const response = await request(app).post('/api/user').send(
      validRegistration({ phoneNumber: '12345' })
    );

    expect(response.status).to.equal(400);
    expect(response.body.message).to.equal('phoneNumber must be a valid Dutch mobile number');
  });

  it('rejects a duplicate emailAddress', async () => {
    userService.findUserByEmail.resolves(baseUser);

    const response = await request(app).post('/api/user').send(validRegistration());

    expect(response.status).to.equal(409);
    expect(response.body).to.deep.equal({
      status: 409,
      message: 'emailAddress is already in use',
      data: null,
    });
  });
});

describe('protected user endpoints', () => {
  it('rejects GET /api/user without a token', async () => {
    const response = await request(app).get('/api/user');

    expect(response.status).to.equal(401);
    expect(response.body).to.deep.equal({
      status: 401,
      message: 'Authentication token is required',
      data: null,
    });
  });

  it('returns all users', async () => {
    userService.findAllUsers.resolves([baseUser]);

    const response = await request(app)
      .get('/api/user')
      .set('Authorization', `Bearer ${tokenFor()}`);

    expect(response.status).to.equal(200);
    expect(response.body).to.deep.equal({
      status: 200,
      message: 'Users retrieved successfully',
      data: { users: [baseUser] },
    });
  });

  it('returns own profile', async () => {
    userService.findUserById.resolves(baseUser);

    const response = await request(app)
      .get('/api/user/profile')
      .set('Authorization', `Bearer ${tokenFor()}`);

    expect(response.status).to.equal(200);
    expect(userService.findUserById.calls).to.deep.equal([[42]]);
    expect(response.body.data.user).to.deep.equal(baseUser);
  });

  it('returns a user by id', async () => {
    userService.findUserById.resolves(baseUser);

    const response = await request(app)
      .get('/api/user/42')
      .set('Authorization', `Bearer ${tokenFor()}`);

    expect(response.status).to.equal(200);
    expect(response.body.message).to.equal('User retrieved successfully');
    expect(response.body.data.user).to.deep.equal(baseUser);
  });

  it('returns 404 when a user id does not exist', async () => {
    userService.findUserById.resolves(null);

    const response = await request(app)
      .get('/api/user/999')
      .set('Authorization', `Bearer ${tokenFor()}`);

    expect(response.status).to.equal(404);
    expect(response.body).to.deep.equal({
      status: 404,
      message: 'User not found',
      data: null,
    });
  });

  it('updates own user', async () => {
    const updatedUser = { ...baseUser, firstName: 'Updated' };
    userService.findUserById.resolvesOnce(baseUser);
    userService.findUserByEmail.resolvesOnce(baseUser);
    userService.updateUser.resolves(updatedUser);

    const response = await request(app)
      .put('/api/user/42')
      .set('Authorization', `Bearer ${tokenFor()}`)
      .send(validRegistration({ firstName: 'Updated' }));

    expect(response.status).to.equal(200);
    expect(userService.updateUser.calls[0][0]).to.equal(42);
    expect(userService.updateUser.calls[0][1]).to.include({
      firstName: 'Updated',
      emailAddress: 'yasir@example.com',
    });
    expect(response.body.data.user).to.deep.equal(updatedUser);
  });

  it('rejects update for another user', async () => {
    const response = await request(app)
      .put('/api/user/99')
      .set('Authorization', `Bearer ${tokenFor()}`)
      .send(validRegistration());

    expect(response.status).to.equal(403);
    expect(response.body).to.deep.equal({
      status: 403,
      message: 'You can only update or delete your own user',
      data: null,
    });
    expect(userService.updateUser.calls).to.have.lengthOf(0);
  });

  it('rejects update when emailAddress belongs to another user', async () => {
    userService.findUserById.resolvesOnce(baseUser);
    userService.findUserByEmail.resolvesOnce({ ...baseUser, id: 99 });

    const response = await request(app)
      .put('/api/user/42')
      .set('Authorization', `Bearer ${tokenFor()}`)
      .send(validRegistration({ emailAddress: 'other@example.com' }));

    expect(response.status).to.equal(409);
    expect(response.body.message).to.equal('emailAddress is already in use');
  });

  it('deletes own user', async () => {
    userService.findUserById.resolves(baseUser);
    userService.deleteUser.resolves(true);

    const response = await request(app)
      .delete('/api/user/42')
      .set('Authorization', `Bearer ${tokenFor()}`);

    expect(response.status).to.equal(200);
    expect(response.body).to.deep.equal({
      status: 200,
      message: 'User deleted successfully',
      data: null,
    });
    expect(userService.deleteUser.calls).to.deep.equal([[42]]);
  });

  it('rejects delete for another user', async () => {
    const response = await request(app)
      .delete('/api/user/99')
      .set('Authorization', `Bearer ${tokenFor()}`);

    expect(response.status).to.equal(403);
    expect(userService.deleteUser.calls).to.have.lengthOf(0);
  });
});
