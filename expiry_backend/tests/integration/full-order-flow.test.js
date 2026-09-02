const request = require('supertest');
const app = require('../../app');
const { sequelize } = require('../../models');

describe('Uçtan uca sipariş akışı: kayıt → başvuru → onay → ürün/paket → sipariş → ödeme → teslimat → onay → release', () => {
  const timestamp = Date.now();
  const shopOwnerEmail = `shopowner+${timestamp}@test.com`;
  const otherShopOwnerEmail = `othershop+${timestamp}@test.com`;
  const customerEmail = `customer+${timestamp}@test.com`;

  let shopOwnerToken, otherShopOwnerToken, customerToken, adminToken;
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
      .send({ name: `Test Market ${timestamp}`, address: 'Test Adres', phone: '05551234567', category: 'MARKET' });

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

  // ---------- Yetkilendirme: deliver ----------

  it('müşteri kendi siparişini teslimata hazır işaretleyemez (403)', async () => {
    const res = await request(app)
      .post(`/api/orders/${orderId}/deliver`)
      .set('Authorization', `Bearer ${customerToken}`);

    expect(res.status).toBe(403);
  });

  it('müşteri ödemeyi simüle eder, sipariş "paid" durumuna geçer', async () => {
    const res = await request(app)
      .post('/api/orders/simulate-payment')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ orderId });

    expect(res.status).toBe(200);
    expect(res.body.order.status).toBe('paid');
  });

  it('paid durumundaki sipariş müşterinin aktif (active) listesinde görünür', async () => {
  const res = await request(app)
    .get('/api/orders/user/me?tab=active')
    .set('Authorization', `Bearer ${customerToken}`);

  expect(res.status).toBe(200);
  const ids = res.body.orders.map((o) => o.id);
  expect(ids).toContain(orderId);
});

  it('market sahibi siparişi teslimata hazır işaretler', async () => {
    const res = await request(app)
      .post(`/api/orders/${orderId}/deliver`)
      .set('Authorization', `Bearer ${shopOwnerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('delivered');
  });

  // ---------- Yetkilendirme: confirm-qr ----------

  it('farklı bir market sahibi başkasının QR kodunu onaylayamaz (403)', async () => {
    const registerRes = await request(app).post('/api/users/register').send({
      email: otherShopOwnerEmail, password: '123456', firstName: 'Other', lastName: 'Shop',
    });
    const otherToken = registerRes.body.accessToken;

    const applyRes = await request(app)
      .post('/api/shops/apply')
      .set('Authorization', `Bearer ${otherToken}`)
      .send({ name: `Other Market ${timestamp}`, address: 'Adres', phone: '05559998877', category: 'MARKET' });
    const otherShopId = applyRes.body.shop.id;

    await request(app)
      .put(`/api/admin/shops/${otherShopId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'active' });

    const loginRes = await request(app).post('/api/users/login').send({
      email: otherShopOwnerEmail, password: '123456',
    });
    otherShopOwnerToken = loginRes.body.accessToken;

    const res = await request(app)
      .post('/api/orders/confirm-qr')
      .set('Authorization', `Bearer ${otherShopOwnerToken}`)
      .send({ deliveryToken });

    expect(res.status).toBe(403);
  });

  it('müşteri kendi QR kodunu kendisi onaylayamaz (403)', async () => {
    const res = await request(app)
      .post('/api/orders/confirm-qr')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ deliveryToken });

    expect(res.status).toBe(403);
  });

  it('market sahibi QR kod ile teslimatı onaylar, sipariş "confirmed" olur', async () => {
    const res = await request(app)
      .post('/api/orders/confirm-qr')
      .set('Authorization', `Bearer ${shopOwnerToken}`)
      .send({ deliveryToken });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('confirmed');
  });

  it('confirmed durumundaki sipariş artık aktif (active) listede görünmez', async () => {
  const res = await request(app)
    .get('/api/orders/user/me?tab=active')
    .set('Authorization', `Bearer ${customerToken}`);

  expect(res.status).toBe(200);
  const ids = res.body.orders.map((o) => o.id);
  expect(ids).not.toContain(orderId);
});

  it('aynı QR kodu tekrar kullanılamaz (zaten confirmed, artık "delivered" değil)', async () => {
    const res = await request(app)
      .post('/api/orders/confirm-qr')
      .set('Authorization', `Bearer ${shopOwnerToken}`)
      .send({ deliveryToken });

    expect(res.status).toBe(404);
  });

  // ---------- confirmed → released ----------

  it('sipariş release edilir, "released" durumuna geçer', async () => {
    const res = await request(app)
      .post(`/api/orders/${orderId}/status`)
      .set('Authorization', `Bearer ${shopOwnerToken}`)
      .send({ status: 'released' });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('released');
  });

  it('released sonrası geçersiz bir sonraki geçiş denenirse 409 döner', async () => {
    const res = await request(app)
      .post(`/api/orders/${orderId}/status`)
      .set('Authorization', `Bearer ${shopOwnerToken}`)
      .send({ status: 'paid' });

    expect(res.status).toBe(409);
  });

  // ---------- Listeleme ----------

  it('müşteri geçmiş siparişlerini (past) listeleyebilir, sipariş orada görünür', async () => {
    const res = await request(app)
      .get('/api/orders/user/me?tab=past')
      .set('Authorization', `Bearer ${customerToken}`);

    expect(res.status).toBe(200);
    const ids = res.body.orders.map((o) => o.id);
    expect(ids).toContain(orderId);
  });

  it('market sahibi geçmiş siparişlerini (past) listeleyebilir, sipariş orada görünür', async () => {
    const res = await request(app)
      .get('/api/orders/shop/me?tab=past')
      .set('Authorization', `Bearer ${shopOwnerToken}`);

    expect(res.status).toBe(200);
    const ids = res.body.orders.map((o) => o.id);
    expect(ids).toContain(orderId);
  });
});