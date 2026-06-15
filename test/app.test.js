const request = require('supertest');
const app = require('../src/app');

describe('application routes', () => {
  test('GET /api/info returns API information', async () => {
    const response = await request(app).get('/api/info');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      status: 200,
      message: 'Share-a-Meal API is running',
      data: { version: '1.0.0' },
    });
  });

  test('unknown route returns a JSON 404 response', async () => {
    const response = await request(app).get('/api/unknown');

    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      status: 404,
      message: 'Route GET /api/unknown not found',
      data: null,
    });
  });
});
