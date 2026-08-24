const request = require('supertest');
const app = require('../../app');
const { sequelize } = require('../../models');

describe('Uçtan uca sipariş akışı: kayıt → başvuru → onay → ürün/paket → sipariş → ödeme → teslimat → onay', () => {
  const timestamp = Date.now();
  const shopOwnerEmail = `shopowner+${timestamp}@test.com`;
  const customerEmail = `customer+${timestamp}@test.com`;

  let shopOwnerToken, customerToken, adminToken;
  let shopId, productId, packageId, orderId, deliveryToken;

  afterAll(async () => {
    await sequelize.close();
  });

  it('market sahibi olacak kullanıcı kayıt olur', async () => {
    const res = await request(app).post('/api/users/register').send({
      email: shopOwnerEmail, password: '123456', firstName: 'Market', lastName: 'Sahibi',
    });

    expect(res.status).toBe(201);
    shopOwnerToken = res.body.accessToken;
  });

  it('müşteri olacak kullanıcı kayıt olur', async () => {
    const res = await request(app).post('/api/users/register').send({
      email: customerEmail, password: '123456', firstName: 'Test', lastName: 'Müşteri',
    });

    expect(res.status).toBe(201);
    customerToken = res.body.accessToken;
  });

  it('market başvurusu yapar', async () => {
    const res = await request(app)
      .post('/api/shops/apply')
      .set('Authorization', `Bearer ${shopOwnerToken}`)
      .send({ name: `Test Market ${timestamp}`, address: 'Test Adres', phone: '05551234567' });

    expect(res.status).toBe(200);
    shopId = res.body.shop.id;
  });

  it('seed edilmiş admin hesabıyla giriş yapılır', async () => {
    const res = await request(app).post('/api/users/login').send({
      email: 'admin@example.com', password: '1234',
    });

    expect(res.status).toBe(200);
    adminToken = res.body.accessToken;
  });

  it('admin market başvurusunu onaylar', async () => {
    const res = await request(app)
      .put(`/api/admin/shops/${shopId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'active' });

    expect(res.status).toBe(200);
    expect(res.body.shop.status).toBe('active');
  });

  it('market sahibi güncel (market) rolüyle tekrar giriş yapar', async () => {
    const res = await request(app).post('/api/users/login').send({
      email: shopOwnerEmail, password: '123456',
    });

    expect(res.status).toBe(200);
    shopOwnerToken = res.body.accessToken;
  });

  it('market sahibi bir ürün oluşturur', async () => {
    const res = await request(app)
      .post('/api/shop/products')
      .set('Authorization', `Bearer ${shopOwnerToken}`)
      .send({ name: 'Test Ürün', price: 20, quantity: 100, expiryDate: '2027-01-01' });

    expect(res.status).toBe(201);
    productId = res.body.id;
  });

  it('market sahibi bu ürünü içeren bir paket oluşturur', async () => {
    const res = await request(app)
      .post('/api/shop/packages')
      .set('Authorization', `Bearer ${shopOwnerToken}`)
      .send({
        name: 'Test Paket',
        quantity: 5,
        deliveryStart: '2027-01-01T10:00:00Z',
        deliveryEnd: '2027-01-01T18:00:00Z',
        products: [{ id: productId, quantity: 1, price: 20 }],
      });

    expect(res.status).toBe(201);
    packageId = res.body.id;
  });

  it('müşteri bu paketten sipariş oluşturur', async () => {
    const res = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ shopId, packages: [{ packageId, quantity: 1 }] });

    expect(res.status).toBe(201);
    expect(res.body.status).toBe('pending');
    orderId = res.body.id;
    deliveryToken = res.body.deliveryToken;
  });

  it('müşteri ödemeyi simüle eder, sipariş "paid" durumuna geçer', async () => {
    const res = await request(app)
      .post('/api/orders/simulate-payment')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ orderId });

    expect(res.status).toBe(200);
    expect(res.body.order.status).toBe('paid');
  });

  it('market sahibi siparişi teslimata hazır işaretler', async () => {
    const res = await request(app)
      .post(`/api/orders/${orderId}/deliver`)
      .set('Authorization', `Bearer ${shopOwnerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('delivered');
  });

  it('market sahibi QR kod ile teslimatı onaylar, sipariş "confirmed" olur', async () => {
    const res = await request(app)
      .post('/api/orders/confirm-qr')
      .set('Authorization', `Bearer ${shopOwnerToken}`)
      .send({ deliveryToken });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('confirmed');
  });

  it('başka bir market sahibinin aynı QR kodu tekrar kullanması reddedilir', async () => {
    const res = await request(app)
      .post('/api/orders/confirm-qr')
      .set('Authorization', `Bearer ${shopOwnerToken}`)
      .send({ deliveryToken });

    expect(res.status).toBe(404);
  });
});