const request = require('supertest');
const app = require('../../app');
const { sequelize, Order } = require('../../models');
const { futureDate, futureIso } = require('../helpers/dates');

// deliveryToken (teslim QR'ının sırrı) SADECE siparişi veren müşteriye gösterilmeli.
// Market bu token'ı görürse, müşteri hiç gelmeden siparişi kendisi delivered ve ardından
// QR ile confirmed yapıp escrow'daki parayı alabilir. Kontrol hem alan adıyla hem gerçek
// token DEĞERİYLE yapılır (alan yeniden adlandırılsa bile değer görünürse test kırılır).
describe('Teslim token\'ı (deliveryToken) market tarafına sızmaz', () => {
  const timestamp = Date.now();
  const marketEmail = `tokenleak-market+${timestamp}@test.com`;
  const customerEmail = `tokenleak-customer+${timestamp}@test.com`;

  let adminToken, marketToken, customerToken;
  let shopId, productId, packageId, orderId, realToken;

  afterAll(async () => {
    await sequelize.close();
  });

  function expectNoTokens(value) {
    const serialized = JSON.stringify(value);
    expect(serialized).not.toContain(realToken);
    expect(serialized).not.toContain('"deliveryToken"');
    expect(serialized).not.toContain('"checkoutToken"');
  }

  const findOrder = (body, id) => body.orders.find((o) => o.id === id);

  it('admin hesabıyla giriş yapılır', async () => {
    const res = await request(app).post('/api/users/login').send({ email: 'admin@example.com', password: '1234' });
    expect(res.status).toBe(200);
    adminToken = res.body.accessToken;
  });

  it('market hazırlanır ve bir paket oluşturur', async () => {
    const registerRes = await request(app).post('/api/users/register').send({
      email: marketEmail, password: '123456', firstName: 'Token', lastName: 'Market',
    });
    expect(registerRes.status).toBe(201);

    const applyRes = await request(app)
      .post('/api/shops/apply')
      .set('Authorization', `Bearer ${registerRes.body.accessToken}`)
      .send({ name: `TokenLeak Market ${timestamp}`, address: 'Adres', phone: '05550000000', category: 'MARKET' });
    expect(applyRes.status).toBe(200);
    shopId = applyRes.body.shop.id;

    const approveRes = await request(app)
      .put(`/api/admin/shops/${shopId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'active' });
    expect(approveRes.status).toBe(200);

    const loginRes = await request(app).post('/api/users/login').send({ email: marketEmail, password: '123456' });
    expect(loginRes.status).toBe(200);
    marketToken = loginRes.body.accessToken;

    const productRes = await request(app)
      .post('/api/shop/products')
      .set('Authorization', `Bearer ${marketToken}`)
      .send({ name: 'Token Ürünü', price: 10, quantity: 50, expiryDate: futureDate(30) });
    expect(productRes.status).toBe(201);
    productId = productRes.body.id;

    const packageRes = await request(app)
      .post('/api/shop/packages')
      .set('Authorization', `Bearer ${marketToken}`)
      .send({
        name: 'Token Paketi',
        quantity: 1,
        deliveryStart: futureIso(30, 10),
        deliveryEnd: futureIso(30, 18),
        products: [{ id: productId, quantity: 1, price: 10 }],
      });
    expect(packageRes.status).toBe(201);
    packageId = packageRes.body.id;
  });

  it('müşteri sipariş verir ve (geliştirme ödemesiyle) paid yapar', async () => {
    const registerRes = await request(app).post('/api/users/register').send({
      email: customerEmail, password: '123456', firstName: 'Token', lastName: 'Customer',
    });
    expect(registerRes.status).toBe(201);
    customerToken = registerRes.body.accessToken;

    const orderRes = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ shopId, packages: [{ packageId, quantity: 1 }] });
    expect(orderRes.status).toBe(201);
    orderId = orderRes.body.id;

    const payRes = await request(app)
      .post('/api/orders/simulate-payment')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ orderId });
    expect(payRes.status).toBe(200);

    // Gerçek token'ı API'den değil doğrudan DB'den okuyoruz.
    const order = await Order.findByPk(orderId);
    realToken = order.deliveryToken;
    expect(realToken).toBeTruthy();
  });

  it('market sipariş listesinde (active) token görünmez', async () => {
    const res = await request(app)
      .get('/api/orders/shop/me')
      .set('Authorization', `Bearer ${marketToken}`);

    expect(res.status).toBe(200);
    const order = findOrder(res.body, orderId);
    expect(order).toBeDefined();
    expect(order.status).toBe('paid');
    expectNoTokens(res.body);
  });

  it('market siparişi delivered yapınca dönen yanıtta token görünmez', async () => {
    const res = await request(app)
      .post(`/api/orders/${orderId}/deliver`)
      .set('Authorization', `Bearer ${marketToken}`);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('delivered');
    expectNoTokens(res.body);
  });

  it('müşteri kendi siparişinde token\'ı görmeye devam eder (QR için gerekli)', async () => {
    const res = await request(app)
      .get('/api/orders/user/me')
      .set('Authorization', `Bearer ${customerToken}`);

    expect(res.status).toBe(200);
    const order = findOrder(res.body, orderId);
    expect(order).toBeDefined();
    expect(order.deliveryToken).toBe(realToken);
  });

  it('müşterinin QR\'ı okutulunca sipariş confirmed olur, yanıtta token görünmez', async () => {
    const res = await request(app)
      .post('/api/orders/confirm-qr')
      .set('Authorization', `Bearer ${marketToken}`)
      .send({ deliveryToken: realToken });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('confirmed');
    expectNoTokens(res.body);
  });

  it('market sipariş listesinde (past) token görünmez', async () => {
    const res = await request(app)
      .get('/api/orders/shop/me?tab=past')
      .set('Authorization', `Bearer ${marketToken}`);

    expect(res.status).toBe(200);
    const order = findOrder(res.body, orderId);
    expect(order).toBeDefined();
    expectNoTokens(res.body);
  });
});