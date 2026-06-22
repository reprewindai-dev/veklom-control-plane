const request = require('supertest');
const app = require('../server');

describe('POST /calculate', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should return calculated SEKED ratios for valid measurement', async () => {
    const validMeasurement = {
      E: 5,
      R: 5,
      C: 5,
      D: 5,
      S: 5
    };

    const response = await request(app)
      .post('/calculate')
      .send(validMeasurement);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      sigma: 1.67,
      ci: 1,
      si: 0.5
    });
  });

  it('should return 400 for invalid measurement values', async () => {
    const invalidMeasurement = {
      E: -1,
      R: 5,
      C: 5,
      D: 5,
      S: 5
    };

    const response = await request(app)
      .post('/calculate')
      .send(invalidMeasurement);

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      error: 'All measurements must be numbers between 0 and 9'
    });
  });

  it('should return 500 when calculation throws an error', async () => {
    const validMeasurement = {
      E: 5,
      R: 5,
      C: 5,
      D: 5,
      S: 5
    };

    // Mock Math.round to throw an error
    jest.spyOn(Math, 'round').mockImplementation(() => {
      throw new Error('Calculation error');
    });

    const response = await request(app)
      .post('/calculate')
      .send(validMeasurement);

    expect(response.status).toBe(500);
    expect(response.body).toEqual({
      error: 'Calculation error'
    });
  });
});
