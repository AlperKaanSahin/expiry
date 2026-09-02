const request = require('supertest');
const app = require('../../app');
const { sequelize } = require('../../models');

describe('Paket görüntüleme akışı: getById, shop packages', () => {
  const timestamp = Date.now();
  const shopOwnerEmail = `pkgowner+${timestamp}@test.com`;
  const customerEmail = `pkgcustomer+${timestamp}@test.com`;

  let adminToken;
  let shopOwnerToken;
  let customerToken;
  let shopId;
  let productId;
  let packageWithStockId;
  let packageNoStockId;

  afterAll(async () => {
    await sequelize.close();
  });

  it('admin ile giriş yapılır', async () => {
    const res = await request(app)
      .post('/api/users/login')
      .send({ email: 'admin@example.com', password: '1234' });

    expect(res.status).toBe(200);
    adminToken = res.body.accessToken;
  });

  it('market sahibi kayıt olur, başvurur ve onaylanır', async () => {
    const registerRes = await request(app).post('/api/users/register').send({
      email: shopOwnerEmail, password: '123456', firstName: 'Pkg', lastName: 'Owner',
    });
    const initialToken = registerRes.body.accessToken;

    const applyRes = await request(app)
      .post('/api/shops/apply')
      .set('Authorization', `Bearer ${initialToken}`)
      .send({ name: `Pkg Market ${timestamp}`, address: 'Adres', phone: '05551112233', category: 'MARKET' });

    shopId = applyRes.body.shop.id;

    await request(app)
      .put(`/api/admin/shops/${shopId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'active' });

    const loginRes = await request(app).post('/api/users/login').send({
      email: shopOwnerEmail, password: '123456',
    });
    shopOwnerToken = loginRes.body.accessToken;
  });

  it('müşteri kayıt olur', async () => {
    const res = await request(app).post('/api/users/register').send({
      email: customerEmail, password: '123456', firstName: 'Pkg', lastName: 'Customer',
    });
    expect(res.status).toBe(201);
    customerToken = res.body.accessToken;
  });

  it('market bir ürün oluşturur', async () => {
    const res = await request(app)
      .post('/api/shop/products')
      .set('Authorization', `Bearer ${shopOwnerToken}`)
      .send({ name: 'Pkg Ürün', price: 10, quantity: 50, expiryDate: '2027-01-01' });

    expect(res.status).toBe(201);
    productId = res.body.id;
  });

  it('market stoklu bir paket oluşturur', async () => {
    const res = await request(app)
      .post('/api/shop/packages')
      .set('Authorization', `Bearer ${shopOwnerToken}`)
      .send({
        name: 'Stoklu Paket',
        quantity: 3,
        deliveryStart: '2027-01-01T10:00:00Z',
        deliveryEnd: '2027-01-01T18:00:00Z',
        products: [{ id: productId, quantity: 1, price: 10 }],
      });

    expect(res.status).toBe(201);
    packageWithStockId = res.body.id;
  });

  it('market stoksuz (quantity: 1, hemen tüketilecek) bir paket oluşturur', async () => {
    const res = await request(app)
      .post('/api/shop/packages')
      .set('Authorization', `Bearer ${shopOwnerToken}`)
      .send({
        name: 'Tükenecek Paket',
        quantity: 1,
        deliveryStart: '2027-01-01T10:00:00Z',
        deliveryEnd: '2027-01-01T18:00:00Z',
        products: [{ id: productId, quantity: 1, price: 10 }],
      });

    expect(res.status).toBe(201);
    packageNoStockId = res.body.id;

    // stoğu tüket: sipariş oluştur + ödeme simüle et
    const orderRes = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ shopId, packages: [{ packageId: packageNoStockId, quantity: 1 }] });

    expect(orderRes.status).toBe(201);

    const payRes = await request(app)
      .post('/api/orders/simulate-payment')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ orderId: orderRes.body.id });

    expect(payRes.status).toBe(200);
  });

  // ---------- getShopPackages ----------

  it('token olmadan shop packages görüntülenemez (401)', async () => {
    const res = await request(app).get(`/api/packages/shop/${shopId}/packages`);
    expect(res.status).toBe(401);
  });

  it('stoklu paket shop packages listesinde görünür, tükenen görünmez', async () => {
    const res = await request(app)
      .get(`/api/packages/shop/${shopId}/packages`)
      .set('Authorization', `Bearer ${customerToken}`);

    expect(res.status).toBe(200);
    const ids = res.body.map((p) => p.id);

    expect(ids).toContain(packageWithStockId);
    expect(ids).not.toContain(packageNoStockId);
  });

  it('hiç paketi olmayan bir shop için boş array döner', async () => {
    const registerRes = await request(app).post('/api/users/register').send({
      email: `emptyshop+${timestamp}@test.com`, password: '123456', firstName: 'Empty', lastName: 'Shop',
    });
    const applyRes = await request(app)
      .post('/api/shops/apply')
      .set('Authorization', `Bearer ${registerRes.body.accessToken}`)
      .send({ name: `Empty Market ${timestamp}`, address: 'Adres', phone: '05559990000', category: 'MARKET' });

    const emptyShopId = applyRes.body.shop.id;

    const res = await request(app)
      .get(`/api/packages/shop/${emptyShopId}/packages`)
      .set('Authorization', `Bearer ${customerToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  // ---------- getPackageById ----------

  it('token olmadan paket detayı görüntülenemez (401)', async () => {
    const res = await request(app).get(`/api/packages/${packageWithStockId}`);
    expect(res.status).toBe(401);
  });

  it('stoklu bir paketin detayı ürün bilgileriyle birlikte döner', async () => {
    const res = await request(app)
      .get(`/api/packages/${packageWithStockId}`)
      .set('Authorization', `Bearer ${customerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.id).toBe(packageWithStockId);
    expect(Array.isArray(res.body.products)).toBe(true);
    expect(res.body.products[0].name).toBe('Pkg Ürün');
  });

  it('stoğu tükenen bir paket yine de getById ile görüntülenebilir', async () => {
    const res = await request(app)
      .get(`/api/packages/${packageNoStockId}`)
      .set('Authorization', `Bearer ${customerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.id).toBe(packageNoStockId);
  });

  it('var olmayan bir paket 404 döner', async () => {
    const res = await request(app)
      .get('/api/packages/999999999')
      .set('Authorization', `Bearer ${customerToken}`);

    expect(res.status).toBe(404);
  });
});