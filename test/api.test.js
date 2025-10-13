// test/api.test.js
const request = require('supertest');
const app = require('../server'); // your Express app

describe('API endpoints', () => {
  it('should return list of products', async () => {
    const res = await request(app).get('/api/products');
    expect(res.status).toBe(200);
    expect(res.body).toBeInstanceOf(Array);
  });
});
