const request = require('supertest');
const app = require('../../app');
const { sequelize } = require('../../models');

describe('GET /api/shops', () => {
  const timestamp = Date.now();

  afterAll(async () => {
    await sequelize.close();
  });

  it('bir array döner', async () => {
    const res = await request(app).get('/api/shops');

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('sadece active statüsündeki marketler listelenir, pending/rejected gizlenir', async () => {
    const adminLogin = await request(app)
      .post('/api/users/login')
      .send({ email: 'admin@example.com', password: '1234' });
    const adminToken = adminLogin.body.accessToken;

    // pending kalan market
    const pendingOwner = await request(app).post('/api/users/register').send({
      email: `list-pending+${timestamp}@test.com`,
      password: '123456',
      firstName: 'Pending',
      lastName: 'Owner',
    });
    const pendingApply = await request(app)
      .post('/api/shops/apply')
      .set('Authorization', `Bearer ${pendingOwner.body.accessToken}`)
      .send({ name: `Pending Market ${timestamp}`, address: 'Adres', phone: '05551110000', category: 'MARKET' });
    const pendingShopId = pendingApply.body.shop.id;

    // active yapılan market
    const activeOwner = await request(app).post('/api/users/register').send({
      email: `list-active+${timestamp}@test.com`,
      password: '123456',
      firstName: 'Active',
      lastName: 'Owner',
    });
    const activeApply = await request(app)
      .post('/api/shops/apply')
      .set('Authorization', `Bearer ${activeOwner.body.accessToken}`)
      .send({ name: `Active Market ${timestamp}`, address: 'Adres', phone: '05552220000', category: 'MARKET' });
    const activeShopId = activeApply.body.shop.id;

    await request(app)
      .put(`/api/admin/shops/${activeShopId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'active' });

    const res = await request(app).get('/api/shops');
    const ids = res.body.map((s) => s.id);

    expect(ids).toContain(activeShopId);
    expect(ids).not.toContain(pendingShopId);
  });
});