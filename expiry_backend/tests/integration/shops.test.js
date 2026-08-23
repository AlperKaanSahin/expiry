const request = require('supertest');
const app = require('../../app');
const { sequelize } = require('../../models');

describe('GET /api/shops', () => {
  afterAll(async () => {
    await sequelize.close();
  });

  it('boş bir listeyle bile 200 döner ve bir array verir', async () => {
    const res = await request(app).get('/api/shops');

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});