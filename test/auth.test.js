process.env.JWT_SECRET = 'test-only-jwt-secret';

const { expect } = require('chai');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const request = require('supertest');
const app = require('../src/app');
const authService = require('../src/services/auth.service');
const { stubService } = require('./helpers/stubs');

const user = {
  id: 42,
  firstName: 'Test',
  lastName: 'User',
  emailAddress: 'test@example.com',
  password: bcrypt.hashSync('Correctpass1', 10),
};

beforeEach(() => {
  stubService(authService, ['findUserByEmail']);
});

describe('POST /api/login', () => {
  it('returns a JWT and user data for a successful login', async () => {
    authService.findUserByEmail.resolves(user);

    const response = await request(app).post('/api/login').send({
      emailAddress: user.emailAddress,
      password: 'Correctpass1',
    });

    expect(response.status).to.equal(200);
    expect(response.body.status).to.equal(200);
    expect(response.body.data.user).to.deep.equal({
      id: 42,
      firstName: 'Test',
      lastName: 'User',
      emailAddress: 'test@example.com',
    });
    expect(response.body.data.user.password).to.be.undefined;
    expect(jwt.verify(response.body.data.token, process.env.JWT_SECRET)).to.deep.include({
      userId: 42,
      emailAddress: 'test@example.com',
    });
  });

  it('rejects a wrong password', async () => {
    authService.findUserByEmail.resolves(user);

    const response = await request(app).post('/api/login').send({
      emailAddress: user.emailAddress,
      password: 'Wrongpass1',
    });

    expect(response.status).to.equal(401);
    expect(response.body).to.deep.equal({
      status: 401,
      message: 'Invalid emailAddress or password',
      data: null,
    });
  });

  it('rejects an unknown user', async () => {
    authService.findUserByEmail.resolves(null);

    const response = await request(app).post('/api/login').send({
      emailAddress: 'unknown@example.com',
      password: 'Somepass1',
    });

    expect(response.status).to.equal(401);
    expect(response.body.data).to.equal(null);
  });

  it('rejects missing fields', async () => {
    const response = await request(app).post('/api/login').send({
      emailAddress: user.emailAddress,
    });

    expect(response.status).to.equal(400);
    expect(response.body).to.deep.equal({
      status: 400,
      message: 'emailAddress and password are required',
      data: null,
    });
    expect(authService.findUserByEmail.calls).to.have.lengthOf(0);
  });
});

describe('JWT authentication middleware', () => {
  it('rejects a protected route without a token', async () => {
    const response = await request(app).get('/api/auth/validate');

    expect(response.status).to.equal(401);
    expect(response.body.data).to.equal(null);
  });

  it('makes userId and emailAddress available for a valid token', async () => {
    const token = jwt.sign(
      { userId: user.id, emailAddress: user.emailAddress },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    const response = await request(app)
      .get('/api/auth/validate')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).to.equal(200);
    expect(response.body.data.user).to.deep.equal({
      userId: 42,
      emailAddress: 'test@example.com',
    });
  });
});
