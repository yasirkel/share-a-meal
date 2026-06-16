const { expect } = require('chai');
const request = require('supertest');
const app = require('../src/app');

describe('application routes', () => {
  it('GET /api/info returns API information', async () => {
    const response = await request(app).get('/api/info');

    expect(response.status).to.equal(200);
    expect(response.body).to.deep.equal({
      status: 200,
      message: 'Share-a-Meal API is running',
      data: {
        version: '1.0.0',
        studentName: 'Yasir Kel',
        studentNumber: 'replace-with-your-student-number',
        description: 'Backend REST API for the Share-a-Meal Programmeren 4 assignment',
      },
    });
  });

  it('unknown route returns a JSON 404 response', async () => {
    const response = await request(app).get('/api/unknown');

    expect(response.status).to.equal(404);
    expect(response.body).to.deep.equal({
      status: 404,
      message: 'Route GET /api/unknown not found',
      data: null,
    });
  });
});
