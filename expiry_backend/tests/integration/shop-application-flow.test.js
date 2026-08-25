const request = require('supertest');
const app = require('../../app');
const { sequelize } = require('../../models');

describe('Market başvuru akışı: kayıt → başvuru → red → yeniden başvuru → onay', () => {
  const timestamp = Date.now();

  const shopOwnerEmail = `shopowner+${timestamp}@test.com`;

  let userToken;
  let adminToken;
  let shopId;

  afterAll(async () => {
    await sequelize.close();
  });

  it('market sahibi olacak kullanıcı kayıt olur', async () => {
    const res = await request(app)
      .post('/api/users/register')
      .send({
        email: shopOwnerEmail,
        password: '123456',
        firstName: 'Test',
        lastName: 'Market',
      });

    expect(res.status).toBe(201);
    expect(res.body.accessToken).toBeDefined();

    userToken = res.body.accessToken;
  });

  it('kullanıcı market başvurusu yapar', async () => {
    const res = await request(app)
      .post('/api/shops/apply')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        name: `Test Market ${timestamp}`,
        address: 'Test Adres',
        phone: '05551234567'
      });

    expect(res.status).toBe(200);
    expect(res.body.shop).toBeDefined();
    expect(res.body.shop.name).toBe(`Test Market ${timestamp}`);
    expect(res.body.shop.status).toBe('pending');

    shopId = res.body.shop.id;

    expect(shopId).toBeDefined();
  });

  it('kullanıcı aynı market için tekrar başvuru yapamaz', async () => {
    const res = await request(app)
      .post('/api/shops/apply')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        name: `Test Market ${timestamp}`,
        address: 'Test Adres',
        phone: '05551234567',
      });

    expect(res.status).toBe(409);
  });

  it('seed edilmiş admin hesabıyla giriş yapılır', async () => {
    const res = await request(app)
      .post('/api/users/login')
      .send({
        email: 'admin@example.com',
        password: '1234',
      });

    expect(res.status).toBe(200);
    expect(res.body.accessToken).toBeDefined();

    adminToken = res.body.accessToken;
  });

  it('admin market başvurusunu reddeder', async () => {
    const res = await request(app)
      .put(`/api/admin/shops/${shopId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        status: 'rejected',
      });

    expect(res.status).toBe(200);
    expect(res.body.shop).toBeDefined();
    expect(res.body.shop.status).toBe('rejected');
  });

  it('market sahibi başvuru reddedildiği için tekrar başvurabilir', async () => {
    const res = await request(app)
      .post('/api/shops/apply')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        name: `Test Market Reapply ${timestamp}`,
        address: 'Yeni Test Adres',
        phone: '05559876543',
      });

    expect(res.status).toBe(200);
    expect(res.body.shop).toBeDefined();

    expect(res.body.shop.id).toBe(shopId);
    expect(res.body.shop.name).toBe(`Test Market Reapply ${timestamp}`);
    expect(res.body.shop.address).toBe('Yeni Test Adres');
    expect(res.body.shop.phone).toBe('05559876543');
    expect(res.body.shop.status).toBe('pending');
  });

  it('admin yeniden yapılan market başvurusunu onaylar', async () => {
    const res = await request(app)
      .put(`/api/admin/shops/${shopId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        status: 'active',
      });

    expect(res.status).toBe(200);
    expect(res.body.shop).toBeDefined();
    expect(res.body.shop.status).toBe('active');
  });

  it('market sahibi onaydan sonra market rolüyle giriş yapabilir', async () => {
    const res = await request(app)
      .post('/api/users/login')
      .send({
        email: shopOwnerEmail,
        password: '123456',
      });

    expect(res.status).toBe(200);
    expect(res.body.accessToken).toBeDefined();

    expect(res.body.user.role).toBe('market');
  });

  it('aktif market tekrar başvuru yapamaz', async () => {
    const res = await request(app)
      .post('/api/shops/apply')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        name: 'Başka Market',
        address: 'Başka Adres',
        phone: '05550000000',
      });

    expect(res.status).toBe(409);
  });
});