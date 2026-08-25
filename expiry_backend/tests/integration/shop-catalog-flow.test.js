const request = require('supertest');
const app = require('../../app');
const { sequelize } = require('../../models');

describe('Shop katalog akışı: ürün/paket CRUD, ownership, eşzamanlılık', () => {
  const timestamp = Date.now();
  const marketAEmail = `catalog-a+${timestamp}@test.com`;
  const marketBEmail = `catalog-b+${timestamp}@test.com`;
  const customerEmail = `catalog-customer+${timestamp}@test.com`;

  let adminToken;
  let marketAToken, marketBToken, customerToken;
  let shopAId, shopBId;
  let productAId, productBId;
  let packageAId;

  afterAll(async () => {
    await sequelize.close();
  });

  async function registerAndApprove(email, shopName) {
    const registerRes = await request(app).post('/api/users/register').send({
      email, password: '123456', firstName: 'Test', lastName: 'Market',
    });
    const userToken = registerRes.body.accessToken;

    const applyRes = await request(app)
      .post('/api/shops/apply')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ name: `${shopName} ${timestamp}`, address: 'Adres', phone: '05550000000' });
    const shopId = applyRes.body.shop.id;

    await request(app)
      .put(`/api/admin/shops/${shopId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'active' });

    const loginRes = await request(app).post('/api/users/login').send({ email, password: '123456' });
    return { token: loginRes.body.accessToken, shopId };
  }

  it('admin hesabıyla giriş yapılır', async () => {
    const res = await request(app).post('/api/users/login').send({ email: 'admin@example.com', password: '1234' });
    expect(res.status).toBe(200);
    adminToken = res.body.accessToken;
  });

  it('iki farklı market ve bir müşteri hazırlanır', async () => {
    const marketA = await registerAndApprove(marketAEmail, 'Market A');
    marketAToken = marketA.token;
    shopAId = marketA.shopId;

    const marketB = await registerAndApprove(marketBEmail, 'Market B');
    marketBToken = marketB.token;
    shopBId = marketB.shopId;

    const customerRes = await request(app).post('/api/users/register').send({
      email: customerEmail, password: '123456', firstName: 'Test', lastName: 'Customer',
    });
    customerToken = customerRes.body.accessToken;

    expect(marketAToken).toBeDefined();
    expect(marketBToken).toBeDefined();
    expect(customerToken).toBeDefined();
  });

  it('market A bir ürün oluşturur', async () => {
    const res = await request(app)
      .post('/api/shop/products')
      .set('Authorization', `Bearer ${marketAToken}`)
      .send({ name: 'Ürün A', price: 10, quantity: 50, expiryDate: '2027-01-01' });

    expect(res.status).toBe(201);
    productAId = res.body.id;
  });

  it('market B bir ürün oluşturur', async () => {
    const res = await request(app)
      .post('/api/shop/products')
      .set('Authorization', `Bearer ${marketBToken}`)
      .send({ name: 'Ürün B', price: 15, quantity: 30, expiryDate: '2027-01-01' });

    expect(res.status).toBe(201);
    productBId = res.body.id;
  });

  it('market A kendi ürünlerini listeleyebilir, market B\'ninkini görmez', async () => {
    const res = await request(app)
      .get('/api/shop/products')
      .set('Authorization', `Bearer ${marketAToken}`);

    expect(res.status).toBe(200);
    const ids = res.body.products.map(p => p.id);
    expect(ids).toContain(productAId);
    expect(ids).not.toContain(productBId);
  });

  it('market A, market B\'nin ürününü güncelleyemez (404)', async () => {
    const res = await request(app)
      .put(`/api/shop/products/${productBId}`)
      .set('Authorization', `Bearer ${marketAToken}`)
      .send({ name: 'Hacklenmiş', price: 1, quantity: 1, expiryDate: '2027-01-01' });

    expect(res.status).toBe(404);
  });

  it('market A, market B\'nin ürününü silemez (404)', async () => {
    const res = await request(app)
      .delete(`/api/shop/products/${productBId}`)
      .set('Authorization', `Bearer ${marketAToken}`);

    expect(res.status).toBe(404);
  });

  it('müşteri (market olmayan biri) ürün oluşturamaz (403)', async () => {
    const res = await request(app)
      .post('/api/shop/products')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ name: 'Yasak Ürün', price: 1, quantity: 1, expiryDate: '2027-01-01' });

    expect(res.status).toBe(403);
  });

  it('token olmadan ürün listesi görüntülenemez (401)', async () => {
    const res = await request(app).get('/api/shop/products');
    expect(res.status).toBe(401);
  });

  it('market A kendi ürününü günceller', async () => {
    const res = await request(app)
      .put(`/api/shop/products/${productAId}`)
      .set('Authorization', `Bearer ${marketAToken}`)
      .send({ name: 'Güncellenmiş Ürün A', price: 12, quantity: 40, expiryDate: '2027-02-01' });

    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Güncellenmiş Ürün A');
  });

  it('market A, ürününü içeren bir paket (quantity=1) oluşturur', async () => {
    const res = await request(app)
      .post('/api/shop/packages')
      .set('Authorization', `Bearer ${marketAToken}`)
      .send({
        name: 'Son Kutu',
        quantity: 1,
        deliveryStart: '2027-01-01T10:00:00Z',
        deliveryEnd: '2027-01-01T18:00:00Z',
        products: [{ id: productAId, quantity: 1, price: 12 }],
      });

    expect(res.status).toBe(201);
    packageAId = res.body.id;
  });

  it('market B, market A\'nın paketini güncelleyemez (404)', async () => {
    const res = await request(app)
      .put(`/api/shop/packages/${packageAId}`)
      .set('Authorization', `Bearer ${marketBToken}`)
      .send({ name: 'Hacklenmiş Paket' });

    expect(res.status).toBe(404);
  });

it('EŞZAMANLILIK: son 1 stoklu pakete iki eşzamanlı ödeme onayı atılırsa sadece biri başarılı olur', async () => {
  const [customer1Res, customer2Res] = await Promise.all([
    request(app).post('/api/users/register').send({
      email: `concurrent-1+${timestamp}@test.com`, password: '123456', firstName: 'C1', lastName: 'Test',
    }),
    request(app).post('/api/users/register').send({
      email: `concurrent-2+${timestamp}@test.com`, password: '123456', firstName: 'C2', lastName: 'Test',
    }),
  ]);

  const token1 = customer1Res.body.accessToken;
  const token2 = customer2Res.body.accessToken;

  // İkisi de sipariş oluşturabilir (createOrder'da kilit yok, bilinçli tasarım)
  const [order1Res, order2Res] = await Promise.all([
    request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${token1}`)
      .send({ shopId: shopAId, packages: [{ packageId: packageAId, quantity: 1 }] }),
    request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${token2}`)
      .send({ shopId: shopAId, packages: [{ packageId: packageAId, quantity: 1 }] }),
  ]);

  expect(order1Res.status).toBe(201);
  expect(order2Res.status).toBe(201);

  const orderId1 = order1Res.body.id;
  const orderId2 = order2Res.body.id;

  // Asıl kilit burada devreye girmeli — ikisi eşzamanlı ödeme dener
  const [pay1Res, pay2Res] = await Promise.all([
    request(app)
      .post('/api/orders/simulate-payment')
      .set('Authorization', `Bearer ${token1}`)
      .send({ orderId: orderId1 }),
    request(app)
      .post('/api/orders/simulate-payment')
      .set('Authorization', `Bearer ${token2}`)
      .send({ orderId: orderId2 }),
  ]);

const statuses = [pay1Res.status, pay2Res.status].sort();
expect(statuses).toEqual([200, 409]);
});

  it('market A kendi paketini siler', async () => {
    const res = await request(app)
      .delete(`/api/shop/packages/${packageAId}`)
      .set('Authorization', `Bearer ${marketAToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('market A kendi ürününü siler', async () => {
    const res = await request(app)
      .delete(`/api/shop/products/${productAId}`)
      .set('Authorization', `Bearer ${marketAToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});