import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../app';
import { connectDatabase, disconnectDatabase } from '../config/database';

describe('Authentication API & Protected Routes', () => {
  beforeAll(async () => {
    await connectDatabase();
  }, 30000);

  afterAll(async () => {
    await disconnectDatabase();
  }, 30000);

  it('should login with valid seed credentials', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'shipper@loadvanta.com',
        password: 'Password@123'
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe('shipper@loadvanta.com');
    expect(res.body.data.user.role).toBe('SHIPPER');
    expect(res.body.data.accessToken).toBeDefined();
  });

  it('should reject login with wrong password', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'shipper@loadvanta.com',
        password: 'WrongPassword'
      });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
  });

  it('should block unauthenticated access to protected routes', async () => {
    const res = await request(app).get('/api/v1/shipments/my-shipments');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('should allow shipper to access their shipments with valid JWT', async () => {
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'shipper@loadvanta.com',
        password: 'Password@123'
      });

    const token = loginRes.body.data.accessToken;

    const res = await request(app)
      .get('/api/v1/shipments/my-shipments')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });
});
