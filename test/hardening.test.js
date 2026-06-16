const fs = require('node:fs');
const path = require('node:path');

describe('final hardening assets', () => {
  test('database schema contains required tables and safe relations', () => {
    const schema = fs.readFileSync(path.join(__dirname, '..', 'database', 'schema.sql'), 'utf8');

    expect(schema).toContain('CREATE TABLE IF NOT EXISTS `user`');
    expect(schema).toContain('CREATE TABLE IF NOT EXISTS meal');
    expect(schema).toContain('CREATE TABLE IF NOT EXISTS meal_participants');
    expect(schema).toContain('UNIQUE KEY uq_user_emailAddress');
    expect(schema).toContain('ON DELETE CASCADE');
  });

  test('environment example documents database and JWT configuration', () => {
    const envExample = fs.readFileSync(path.join(__dirname, '..', '.env.example'), 'utf8');

    expect(envExample).toContain('DB_HOST=');
    expect(envExample).toContain('DB_NAME=');
    expect(envExample).toContain('JWT_SECRET=');
    expect(envExample).not.toContain('test-only-jwt-secret');
  });

  test('production environment example is available without real secrets', () => {
    const envExample = fs.readFileSync(
      path.join(__dirname, '..', '.env.production.example'),
      'utf8'
    );

    expect(envExample).toContain('NODE_ENV=production');
    expect(envExample).toContain('JWT_SECRET=replace-with-a-strong-production-secret');
    expect(envExample).not.toContain('test-only-jwt-secret');
  });
});
