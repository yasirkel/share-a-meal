const { expect } = require('chai');
const fs = require('node:fs');
const path = require('node:path');
const request = require('supertest');
const app = require('../src/app');

describe('final hardening assets', () => {
  it('database schema contains required tables and safe relations', () => {
    const schema = fs.readFileSync(path.join(__dirname, '..', 'database', 'schema.sql'), 'utf8');

    expect(schema).to.contain('CREATE TABLE IF NOT EXISTS `user`');
    expect(schema).to.contain('CREATE TABLE IF NOT EXISTS meal');
    expect(schema).to.contain('CREATE TABLE IF NOT EXISTS meal_participants');
    expect(schema).to.contain('UNIQUE KEY uq_user_emailAddress');
    expect(schema).to.contain('ON DELETE CASCADE');
  });

  it('environment example documents database and JWT configuration', () => {
    const envExample = fs.readFileSync(path.join(__dirname, '..', '.env.example'), 'utf8');

    expect(envExample).to.contain('DB_HOST=');
    expect(envExample).to.contain('DB_NAME=');
    expect(envExample).to.contain('JWT_SECRET=');
    expect(envExample).to.contain('STUDENT_NAME=');
    expect(envExample).to.contain('STUDENT_NUMBER=');
    expect(envExample).not.to.contain('test-only-jwt-secret');
  });

  it('GET /api/info returns student metadata and description', async () => {
    const response = await request(app).get('/api/info');

    expect(response.status).to.equal(200);
    expect(response.body.data).to.include({
      studentName: 'Yasir Kelloulou',
      studentNumber: '2212394',
      description: 'Backend REST API for the Share-a-Meal Programmeren 4 assignment',
    });
  });

  it('project has explicit routes/controllers/services/dao separation', () => {
    ['routes', 'controllers', 'services', 'dao', 'middleware', 'validators'].forEach((folder) => {
      expect(fs.existsSync(path.join(__dirname, '..', 'src', folder))).to.equal(true);
    });
  });

  it('README and package files do not reference the previous test framework', () => {
    const readme = fs.readFileSync(path.join(__dirname, '..', 'README.md'), 'utf8');
    const packageJson = fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8');
    const previousTestFramework = new RegExp('je' + 'st', 'i');

    expect(readme).not.to.match(previousTestFramework);
    expect(packageJson).not.to.match(previousTestFramework);
  });

  it('production environment example is available without real secrets', () => {
    const envExample = fs.readFileSync(
      path.join(__dirname, '..', '.env.production.example'),
      'utf8'
    );

    expect(envExample).to.contain('NODE_ENV=production');
    expect(envExample).to.contain('STUDENT_NAME=Yasir Kelloulou');
    expect(envExample).to.contain('STUDENT_NUMBER=2212394');
    expect(envExample).to.contain('JWT_SECRET=replace-with-a-strong-production-secret');
    expect(envExample).not.to.contain('test-only-jwt-secret');
  });
});
