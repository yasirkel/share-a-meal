const test = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const app = require('../src/app');

test('GET /api/info returns API information', async () => {
  const response = await request(app).get('/api/info');

  assert.equal(response.status, 200);
  assert.equal(response.body.status, 200);
  assert.equal(response.body.message, 'Share-a-Meal API is running');
  assert.equal(response.body.data.version, '1.0.0');
});

test('unknown route returns a JSON 404 response', async () => {
  const response = await request(app).get('/api/unknown');

  assert.equal(response.status, 404);
  assert.equal(response.body.status, 404);
  assert.equal(response.body.message, 'Route GET /api/unknown not found');
});
