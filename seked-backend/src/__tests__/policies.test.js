process.env.JWT_SECRET = 'test-secret';
const request = require('supertest');
const app = require('../server');
const jwt = require('jsonwebtoken');

// Generate a valid token for testing
const token = jwt.sign({ userId: 1 }, process.env.JWT_SECRET || 'your-super-secret-jwt-key-here');

// Mock Prisma
jest.mock('@prisma/client', () => {
  const mPrismaClient = {
    policy: {
      findMany: jest.fn().mockResolvedValue([]),
      create: jest.fn().mockResolvedValue({ id: 'test-policy-1', name: 'Test Policy' }),
      findUnique: jest.fn().mockResolvedValue({ id: 'test-policy-1', name: 'Test Policy' }),
      update: jest.fn().mockResolvedValue({ id: 'test-policy-1', name: 'Updated Policy' }),
      delete: jest.fn().mockResolvedValue({ id: 'test-policy-1' }),
    },
  };
  return { PrismaClient: jest.fn(() => mPrismaClient) };
});

describe('Policies Endpoint Security', () => {
  it('should reject POST /policies without a token with 401', async () => {
    const res = await request(app)
      .post('/policies')
      .send({ name: 'New Policy' });
    expect(res.statusCode).toBe(401);
  });

  it('should reject POST /policies with invalid token with 403', async () => {
    const res = await request(app)
      .post('/policies')
      .set('Authorization', 'Bearer invalid-token')
      .send({ name: 'New Policy' });
    expect(res.statusCode).toBe(403);
  });

  it('should accept POST /policies with valid token', async () => {
    const res = await request(app)
      .post('/policies')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'New Policy' });
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('saved');
  });

  it('should reject GET /policies without a token with 401', async () => {
    const res = await request(app).get('/policies');
    expect(res.statusCode).toBe(401);
  });

  it('should accept GET /policies with valid token', async () => {
    const res = await request(app)
      .get('/policies')
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
  });

  it('should reject PUT /policies/:id without a token with 401', async () => {
    const res = await request(app)
      .put('/policies/test-id')
      .send({ name: 'Updated Policy' });
    expect(res.statusCode).toBe(401);
  });

  it('should reject DELETE /policies/:id without a token with 401', async () => {
    const res = await request(app).delete('/policies/test-id');
    expect(res.statusCode).toBe(401);
  });
});
