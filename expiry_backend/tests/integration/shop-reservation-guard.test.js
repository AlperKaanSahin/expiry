const request = require('supertest');
const app = require('../../app');
const { sequelize } = require('../../models');
const { futureDate, futureIso, utcSqlDateTime } = require('../helpers/dates');

// Ödeme aşamasındaki (createOrder ile rezerve edilmiş, TTL'i dolmamış) üniteler,
// market tarafındaki silme / adet azaltma işlemleriyle ezilmemeli: aksi halde müşterinin
// parası çekilir ama reserveStock stok bulamaz ve sipariş oluşmaz (manuel iade gerekir).
describe('Rezervasyon koruması: paket silme ve adet azaltma', () => {
  const timestamp = Date.now();

  let adminToken, marketToken, customerToken;
  let shopId, productId, packageId;

  afterAll(async () => {
    await sequelize.close();
  });

  const listOwnPackage = async () => {
    const res = await request(app)
      .get('/api/shop/packages')
      .set('Authorization', `Bearer ${marketToken}`);
    expect(res.status).toBe(200);
    return res.body.packages.find((p) => p.id === packageId);
  };

  it('admin hesabıyla giriş yapılır', async () => {
    const res = await request(app).post('/api/users/login').send({ email: 'admin@example.com', password: '1234' });
    expect(res.status).toBe(200);
    adminToken = res.body.accessToken;
  });

  it('market ve müşteri hazırlanır', async () => {
    const marketEmail = `resguard-market+${timestamp}@test.com`;

    const registerRes = await request(app).post('/api/users/register').send({
      email: marketEmail, password: '123456', firstName: 'Test', lastName: 'Market',
    });
    expect(registerRes.status).toBe(201);

    const applyRes = await request(app)
      .post('/api/shops/apply')
      .set('Authorization', `Bearer ${registerRes.body.accessToken}`)
      .send({ name: `ResGuard Market ${timestamp}`, address: 'Adres', phone: '05550000000', category: 'MARKET' });
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

    const customerRes = await request(app).post('/api/users/register').send({
      email: `resguard-customer+${timestamp}@test.com`, password: '123456', firstName: 'Test', lastName: 'Customer',
    });
    expect(customerRes.status).toBe(201);
    customerToken = customerRes.body.accessToken;
  });

  it('market 3 ünitelik bir paket oluşturur', async () => {
    const productRes = await request(app)
      .post('/api/shop/products')
      .set('Authorization', `Bearer ${marketToken}`)
      .send({ name: 'Rezervasyon Ürünü', price: 10, quantity: 50, expiryDate: futureDate(30) });
    expect(productRes.status).toBe(201);
    productId = productRes.body.id;

    const packageRes = await request(app)
      .post('/api/shop/packages')
      .set('Authorization', `Bearer ${marketToken}`)
      .send({
        name: 'Rezervasyon Paketi',
        quantity: 3,
        deliveryStart: futureIso(30, 10),
        deliveryEnd: futureIso(30, 18),
        products: [{ id: productId, quantity: 1, price: 10 }],
      });
    expect(packageRes.status).toBe(201);
    packageId = packageRes.body.id;
  });

  it('müşteri 2 ünitelik sipariş oluşturur (2 ünite 20 dk rezerve olur)', async () => {
    const res = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ shopId, packages: [{ packageId, quantity: 2 }] });

    expect(res.status).toBe(201);
  });

  it('müsait ünite sayısından fazla silinmek istenirse 409 döner, hiçbir ünite silinmez', async () => {
    const res = await request(app)
      .delete(`/api/shop/packages/${packageId}`)
      .set('Authorization', `Bearer ${marketToken}`)
      .send({ count: 3 });

    expect(res.status).toBe(409);
  });

  it('adet, rezerve üniteleri ezecek kadar düşürülmek istenirse 409 döner', async () => {
    const res = await request(app)
      .put(`/api/shop/packages/${packageId}`)
      .set('Authorization', `Bearer ${marketToken}`)
      .send({ name: 'Rezervasyon Paketi', price: 10, quantity: 1 });

    expect(res.status).toBe(409);
  });

  it('reddedilen işlemlerden sonra paket 3 ünitesiyle ve aynı fiyatla duruyor', async () => {
    const pkg = await listOwnPackage();

    expect(pkg).toBeDefined();
    expect(pkg.quantity).toBe(3);
    expect(Number(pkg.price)).toBe(10);
  });

  it('sadece müsait ünite kadar silinebilir (1 ünite), rezerve 2 ünite korunur', async () => {
    const res = await request(app)
      .delete(`/api/shop/packages/${packageId}`)
      .set('Authorization', `Bearer ${marketToken}`)
      .send({ count: 1 });

    expect(res.status).toBe(200);
    expect(res.body.deletedAll).toBe(false);
    expect(res.body.deletedCount).toBe(1);
    expect(res.body.remaining).toBe(2);
  });

  it('paket tamamen silinmek istenirse (rezervasyon sürerken) 409 döner', async () => {
    const res = await request(app)
      .delete(`/api/shop/packages/${packageId}`)
      .set('Authorization', `Bearer ${marketToken}`);

    expect(res.status).toBe(409);
  });

  it('rezervasyon süresi dolunca paket tamamen silinebilir', async () => {
    await sequelize.query(
      'UPDATE `PackageUnits` SET reservedUntil = :past WHERE packageId = :packageId AND isSold = false',
      { replacements: { past: utcSqlDateTime(new Date(Date.now() - 60 * 1000)), packageId } }
    );

    const res = await request(app)
      .delete(`/api/shop/packages/${packageId}`)
      .set('Authorization', `Bearer ${marketToken}`);

    expect(res.status).toBe(200);
    expect(res.body.deletedAll).toBe(true);
  });
});