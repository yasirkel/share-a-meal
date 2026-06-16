process.env.JWT_SECRET = 'test-only-jwt-secret';

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const request = require('supertest');
const app = require('../src/app');
const userService = require('../src/services/user.service');

jest.mock('../src/services/user.service');

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
  jest.clearAllMocks();
});

describe('POST /api/user', () => {
  test('registers a new user with a hashed password', async () => {
    userService.findUserByEmail.mockResolvedValue(null);
    userService.createUser.mockImplementation(async (user) => ({
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

    expect(response.status).toBe(201);
    expect(response.body).toEqual({
      status: 201,
      message: 'User registered successfully',
      data: { user: baseUser },
    });

    const createdUser = userService.createUser.mock.calls[0][0];
    expect(createdUser.password).not.toBe('strongpass');
    await expect(bcrypt.compare('strongpass', createdUser.password)).resolves.toBe(true);
    expect(response.body.data.user.password).toBeUndefined();
  });

  test('rejects missing required fields', async () => {
    const response = await request(app).post('/api/user').send(validRegistration({ firstName: '' }));

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      status: 400,
      message: 'firstName is required',
      data: null,
    });
    expect(userService.createUser).not.toHaveBeenCalled();
  });

  test('rejects an invalid emailAddress', async () => {
    const response = await request(app).post('/api/user').send(
      validRegistration({ emailAddress: 'not-an-email' })
    );

    expect(response.status).toBe(400);
    expect(response.body.message).toBe('emailAddress must be a valid email address');
  });

  test('rejects a weak password', async () => {
    const response = await request(app).post('/api/user').send(validRegistration({ password: 'short' }));

    expect(response.status).toBe(400);
    expect(response.body.message).toBe('password must be at least 8 characters');
  });

  test('rejects an invalid phoneNumber', async () => {
    const response = await request(app).post('/api/user').send(
      validRegistration({ phoneNumber: '12345' })
    );

    expect(response.status).toBe(400);
    expect(response.body.message).toBe('phoneNumber must be a valid Dutch mobile number');
  });

  test('rejects a duplicate emailAddress', async () => {
    userService.findUserByEmail.mockResolvedValue(baseUser);

    const response = await request(app).post('/api/user').send(validRegistration());

    expect(response.status).toBe(409);
    expect(response.body).toEqual({
      status: 409,
      message: 'emailAddress is already in use',
      data: null,
    });
  });
});

describe('protected user endpoints', () => {
  test('rejects GET /api/user without a token', async () => {
    const response = await request(app).get('/api/user');

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      status: 401,
      message: 'Authentication token is required',
      data: null,
    });
  });

  test('returns all users', async () => {
    userService.findAllUsers.mockResolvedValue([baseUser]);

    const response = await request(app)
      .get('/api/user')
      .set('Authorization', `Bearer ${tokenFor()}`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      status: 200,
      message: 'Users retrieved successfully',
      data: { users: [baseUser] },
    });
  });

  test('returns own profile', async () => {
    userService.findUserById.mockResolvedValue(baseUser);

    const response = await request(app)
      .get('/api/user/profile')
      .set('Authorization', `Bearer ${tokenFor()}`);

    expect(response.status).toBe(200);
    expect(userService.findUserById).toHaveBeenCalledWith(42);
    expect(response.body.data.user).toEqual(baseUser);
  });

  test('returns a user by id', async () => {
    userService.findUserById.mockResolvedValue(baseUser);

    const response = await request(app)
      .get('/api/user/42')
      .set('Authorization', `Bearer ${tokenFor()}`);

    expect(response.status).toBe(200);
    expect(response.body.message).toBe('User retrieved successfully');
    expect(response.body.data.user).toEqual(baseUser);
  });

  test('returns 404 when a user id does not exist', async () => {
    userService.findUserById.mockResolvedValue(null);

    const response = await request(app)
      .get('/api/user/999')
      .set('Authorization', `Bearer ${tokenFor()}`);

    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      status: 404,
      message: 'User not found',
      data: null,
    });
  });

  test('updates own user', async () => {
    const updatedUser = { ...baseUser, firstName: 'Updated' };
    userService.findUserById.mockResolvedValueOnce(baseUser);
    userService.findUserByEmail.mockResolvedValueOnce(baseUser);
    userService.updateUser.mockResolvedValue(updatedUser);

    const response = await request(app)
      .put('/api/user/42')
      .set('Authorization', `Bearer ${tokenFor()}`)
      .send(validRegistration({ firstName: 'Updated' }));

    expect(response.status).toBe(200);
    expect(userService.updateUser).toHaveBeenCalledWith(42, expect.objectContaining({
      firstName: 'Updated',
      emailAddress: 'yasir@example.com',
    }));
    expect(response.body.data.user).toEqual(updatedUser);
  });

  test('rejects update for another user', async () => {
    const response = await request(app)
      .put('/api/user/99')
      .set('Authorization', `Bearer ${tokenFor()}`)
      .send(validRegistration());

    expect(response.status).toBe(403);
    expect(response.body).toEqual({
      status: 403,
      message: 'You can only update or delete your own user',
      data: null,
    });
    expect(userService.updateUser).not.toHaveBeenCalled();
  });

  test('rejects update when emailAddress belongs to another user', async () => {
    userService.findUserById.mockResolvedValueOnce(baseUser);
    userService.findUserByEmail.mockResolvedValueOnce({ ...baseUser, id: 99 });

    const response = await request(app)
      .put('/api/user/42')
      .set('Authorization', `Bearer ${tokenFor()}`)
      .send(validRegistration({ emailAddress: 'other@example.com' }));

    expect(response.status).toBe(409);
    expect(response.body.message).toBe('emailAddress is already in use');
  });

  test('deletes own user', async () => {
    userService.findUserById.mockResolvedValue(baseUser);
    userService.deleteUser.mockResolvedValue(true);

    const response = await request(app)
      .delete('/api/user/42')
      .set('Authorization', `Bearer ${tokenFor()}`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      status: 200,
      message: 'User deleted successfully',
      data: null,
    });
    expect(userService.deleteUser).toHaveBeenCalledWith(42);
  });

  test('rejects delete for another user', async () => {
    const response = await request(app)
      .delete('/api/user/99')
      .set('Authorization', `Bearer ${tokenFor()}`);

    expect(response.status).toBe(403);
    expect(userService.deleteUser).not.toHaveBeenCalled();
  });
});
