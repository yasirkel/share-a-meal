process.env.JWT_SECRET = 'test-only-jwt-secret';

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const request = require('supertest');
const app = require('../src/app');
const authService = require('../src/services/auth.service');

jest.mock('../src/services/auth.service');

const user = {
  id: 42,
  firstName: 'Test',
  lastName: 'User',
  emailAddress: 'test@example.com',
  password: bcrypt.hashSync('correct-password', 10),
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('POST /api/login', () => {
  test('returns a JWT and user data for a successful login', async () => {
    authService.findUserByEmail.mockResolvedValue(user);

    const response = await request(app).post('/api/login').send({
      emailAddress: user.emailAddress,
      password: 'correct-password',
    });

    expect(response.status).toBe(200);
    expect(response.body.status).toBe(200);
    expect(response.body.data.user).toEqual({
      id: 42,
      firstName: 'Test',
      lastName: 'User',
      emailAddress: 'test@example.com',
    });
    expect(response.body.data.user.password).toBeUndefined();
    expect(jwt.verify(response.body.data.token, process.env.JWT_SECRET)).toMatchObject({
      userId: 42,
      emailAddress: 'test@example.com',
    });
  });

  test('rejects a wrong password', async () => {
    authService.findUserByEmail.mockResolvedValue(user);

    const response = await request(app).post('/api/login').send({
      emailAddress: user.emailAddress,
      password: 'wrong-password',
    });

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      status: 401,
      message: 'Invalid emailAddress or password',
      data: null,
    });
  });

  test('rejects an unknown user', async () => {
    authService.findUserByEmail.mockResolvedValue(null);

    const response = await request(app).post('/api/login').send({
      emailAddress: 'unknown@example.com',
      password: 'some-password',
    });

    expect(response.status).toBe(401);
    expect(response.body.data).toBeNull();
  });

  test('rejects missing fields', async () => {
    const response = await request(app).post('/api/login').send({
      emailAddress: user.emailAddress,
    });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      status: 400,
      message: 'emailAddress and password are required',
      data: null,
    });
    expect(authService.findUserByEmail).not.toHaveBeenCalled();
  });
});

describe('JWT authentication middleware', () => {
  test('rejects a protected route without a token', async () => {
    const response = await request(app).get('/api/auth/validate');

    expect(response.status).toBe(401);
    expect(response.body.data).toBeNull();
  });

  test('makes userId and emailAddress available for a valid token', async () => {
    const token = jwt.sign(
      { userId: user.id, emailAddress: user.emailAddress },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    const response = await request(app)
      .get('/api/auth/validate')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.data.user).toEqual({
      userId: 42,
      emailAddress: 'test@example.com',
    });
  });
});
