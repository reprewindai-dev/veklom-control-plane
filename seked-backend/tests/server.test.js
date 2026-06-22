const request = require('supertest');
const app = require('../src/server');

describe('GET /directive/:ratio', () => {
  it('should return a valid directive for a valid ratio parameter', async () => {
    const response = await request(app).get('/directive/2.5');

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('ratio', 2.5);
    expect(response.body).toHaveProperty('directive');
    expect(response.body).toHaveProperty('action_type');
    expect(response.body).toHaveProperty('confidence');
    expect(response.body).toHaveProperty('reasoning');
  });

  it('should return 400 Bad Request for an invalid ratio parameter', async () => {
    const response = await request(app).get('/directive/invalid');

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: 'Invalid ratio parameter' });
  });

  it('should return a valid directive for 0', async () => {
    const response = await request(app).get('/directive/0');

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('ratio', 0);
  });
});
