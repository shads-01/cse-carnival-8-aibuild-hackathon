import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../../app';

describe('Auth Endpoints End-to-End Tests', () => {
  const uniqueId = Date.now();
  const testEmail = `student_${uniqueId}@campus.edu`;
  const testPassword = 'SecurePassword123!';
  let authToken = '';

  // 1. Register
  it('POST /api/v1/auth/register should successfully register a new user and return a session', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: testEmail,
        name: 'New Registered Student',
        password: testPassword
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('token');
    expect(res.body.data).toHaveProperty('user');
    expect(res.body.data.user.email).toBe(testEmail);
    expect(res.body.data.user.name).toBe('New Registered Student');
    expect(res.body.data.user).not.toHaveProperty('password');
    expect(res.body.data.user).not.toHaveProperty('password_hash');
    expect(res.body.data.user).not.toHaveProperty('passwordHash');

    authToken = res.body.data.token;
  });

  // 2. Reject duplicate register
  it('POST /api/v1/auth/register should reject registration with an existing email with 409 Conflict', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: testEmail,
        name: 'Duplicate Student',
        password: testPassword
      });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
  });

  // 3. Reject invalid register payload
  it('POST /api/v1/auth/register should reject passwords shorter than 6 characters with 400 Bad Request', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: `shortpass_${uniqueId}@campus.edu`,
        name: 'Short Pass',
        password: '123'
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  // 4. Login with valid credentials
  it('POST /api/v1/auth/login should authenticate successfully with correct credentials', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: testEmail,
        password: testPassword
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('token');
    expect(res.body.data.user.email).toBe(testEmail);
    expect(res.body.data.user).not.toHaveProperty('password_hash');
  });

  // 5. Login with demo admin credentials
  it('POST /api/v1/auth/login should authenticate demo admin credentials (admin@campus.edu / admin123)', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'admin@campus.edu',
        password: 'admin123'
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.role).toBe('ADMIN');
  });

  // 6. Login with demo student credentials
  it('POST /api/v1/auth/login should authenticate demo student credentials (student@campus.edu / student123)', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'student@campus.edu',
        password: 'student123'
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.role).toBe('USER');
  });

  // 7. Login with invalid password
  it('POST /api/v1/auth/login should reject incorrect password with 401 Unauthorized', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: testEmail,
        password: 'wrongpassword!'
      });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/invalid.*credentials/i);
  });

  // 8. Login with non-existent user
  it('POST /api/v1/auth/login should reject non-existent user with 401 Unauthorized', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'nonexistent_user@campus.edu',
        password: 'somepassword123'
      });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  // 9. GET /api/v1/auth/me with valid Bearer token
  it('GET /api/v1/auth/me should return current user profile with valid Bearer token', async () => {
    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.email).toBe(testEmail);
    expect(res.body.data).not.toHaveProperty('password_hash');
  });

  // 10. GET /api/v1/auth/me without token
  it('GET /api/v1/auth/me should reject request without token with 401 Unauthorized', async () => {
    const res = await request(app).get('/api/v1/auth/me');

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  // 11. GET /api/v1/auth/me with invalid token
  it('GET /api/v1/auth/me should reject request with invalid token with 401 Unauthorized', async () => {
    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', 'Bearer invalid_garbage_token_123');

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });
});
