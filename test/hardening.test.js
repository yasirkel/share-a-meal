const { expect } = require('chai');
const fs = require('node:fs');
const path = require('node:path');

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
    expect(envExample).not.to.contain('test-only-jwt-secret');
  });
});
