const request = require('supertest');
const app = require('../../app');
const { sequelize } = require('../../models');

// Bu dosya, shopPackageService.listPackages / deleteExpiredPackages ve
// dashboardService.getShopSummary içindeki HAM SQL sorgularını gerçek MySQL'e
// karşı çalıştırır. Ham SQL'de tablo adı büyük/küçük harf hatası Windows'ta
// görünmez, Linux'ta (CI, Docker, prod) "Table doesn't exist" ile patlar —
// bu testler o regresyonun tek koruması.
describe('Shop ham SQL akışı: paket listesi, SKT toplu silme, dashboard özeti', () => {
  const timestamp = Date.now();

  let adminToken;
  let marketA, marketB;
  let productFreshId, productSoonId, productToExpireId;
  let pkgFreshId, pkgSoonId, pkgToExpireId;

  // Yerel takvim gününe göre YYYY-MM-DD (servisteki startOfDay ile tutarlı).
  const localDateString = (offsetDays) => {
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  };

  afterAll(async () => {
    await sequelize.close();
  });

  async function registerAndApprove(email, shopName) {
    const registerRes = await request(app).post('/api/users/register').send({
      email, password: '123456', firstName: 'Test', lastName: 'Market',
    });
    expect(registerRes.status).toBe(201);

    const applyRes = await request(app)
      .post('/api/shops/apply')
      .set('Authorization', `Bearer ${registerRes.body.accessToken}`)
      .send({ name: `${shopName} ${timestamp}`, address: 'Adres', phone: '05550000000', category: 'MARKET' });
    expect(applyRes.status).toBe(200);
    const shopId = applyRes.body.shop.id;

    const approveRes = await request(app)
      .put(`/api/admin/shops/${shopId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'active' });
    expect(approveRes.status).toBe(200);

    // Rol güncellenmiş token için yeniden giriş gerekiyor.
    const loginRes = await request(app).post('/api/users/login').send({ email, password: '123456' });
    expect(loginRes.status).toBe(200);
    return { token: loginRes.body.accessToken, shopId };
  }

  async function createProduct(token, name, expiryDate) {
    const res = await request(app)
      .post('/api/shop/products')
      .set('Authorization', `Bearer ${token}`)
      .send({ name, price: 10, quantity: 50, expiryDate });
    expect(res.status).toBe(201);
    return res.body.id;
  }

  async function createPackage(token, name, productId, quantity) {
    const res = await request(app)
      .post('/api/shop/packages')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name,
        quantity,
        deliveryStart: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
        deliveryEnd: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(),
        products: [{ id: productId, quantity: 1, price: 10 }],
      });
    expect(res.status).toBe(201);
    return res.body.id;
  }

  const listPackages = (token, query = '') =>
    request(app).get(`/api/shop/packages${query}`).set('Authorization', `Bearer ${token}`);

  const getSummary = (token) =>
    request(app).get('/api/shop/dashboard/summary').set('Authorization', `Bearer ${token}`);

  it('admin hesabıyla giriş yapılır', async () => {
    const res = await request(app).post('/api/users/login').send({ email: 'admin@example.com', password: '1234' });
    expect(res.status).toBe(200);
    adminToken = res.body.accessToken;
  });

  it('iki market hazırlanır', async () => {
    marketA = await registerAndApprove(`rawsql-a+${timestamp}@test.com`, 'RawSQL Market A');
    marketB = await registerAndApprove(`rawsql-b+${timestamp}@test.com`, 'RawSQL Market B');
    expect(marketA.token).toBeDefined();
    expect(marketB.token).toBeDefined();
  });

  it('market A üç ürün oluşturur', async () => {
    productFreshId = await createProduct(marketA.token, 'Taze Ürün', localDateString(30));
    productSoonId = await createProduct(marketA.token, 'Yarın Biten Ürün', localDateString(1));
    productToExpireId = await createProduct(marketA.token, 'Sonradan Geçecek Ürün', localDateString(30));
  });

  it('market A her ürün için bir paket oluşturur (sırayla: fresh, soon, toExpire)', async () => {
    pkgFreshId = await createPackage(marketA.token, 'Taze Paket', productFreshId, 2);
    pkgSoonId = await createPackage(marketA.token, 'Yarın Biten Paket', productSoonId, 1);
    pkgToExpireId = await createPackage(marketA.token, 'Sonradan Geçecek Paket', productToExpireId, 1);
  });

  it('paket listesi (3 ham sorgu): üç paket döner, SKT geçen yok', async () => {
    const res = await listPackages(marketA.token);

    expect(res.status).toBe(200);
    expect(res.body.total).toBe(3);
    expect(res.body.expiredCount).toBe(0);
    const ids = res.body.packages.map((p) => p.id);
    expect(ids).toEqual(expect.arrayContaining([pkgFreshId, pkgSoonId, pkgToExpireId]));
    expect(res.body.packages.every((p) => p.isExpired === false)).toBe(true);

    const fresh = res.body.packages.find((p) => p.id === pkgFreshId);
    expect(fresh.quantity).toBe(2);
  });

  it('sayfalama: limit=2 en yeni iki paketi, page=2 kalanı döner', async () => {
    const page1 = await listPackages(marketA.token, '?page=1&limit=2');
    expect(page1.status).toBe(200);
    expect(page1.body.total).toBe(3);
    expect(page1.body.packages.map((p) => p.id)).toEqual([pkgToExpireId, pkgSoonId]);

    const page2 = await listPackages(marketA.token, '?page=2&limit=2');
    expect(page2.status).toBe(200);
    expect(page2.body.packages.map((p) => p.id)).toEqual([pkgFreshId]);
  });

  it('dashboard özeti (ham sorgular): aktif paket sayısı, yakında bitenler, 7 günlük trend', async () => {
    const res = await getSummary(marketA.token);

    expect(res.status).toBe(200);
    expect(res.body.today.activePackages).toBe(3);
    expect(res.body.today.orderCount).toBe(0);
    expect(res.body.today.revenue).toBe(0);

    const soonIds = res.body.expiringSoon.map((e) => e.packageId);
    expect(soonIds).toContain(pkgSoonId);
    expect(soonIds).not.toContain(pkgFreshId);

    const soonEntry = res.body.expiringSoon.find((e) => e.packageId === pkgSoonId);
    expect(soonEntry.remainingUnits).toBe(1);
    expect(soonEntry.daysLeft).toBeGreaterThanOrEqual(0);
    expect(soonEntry.daysLeft).toBeLessThanOrEqual(1);

    expect(res.body.weeklyTrend).toHaveLength(7);
    expect(res.body.weeklyTrend.every((d) => d.revenue === 0)).toBe(true);
  });

  it('ürünün SKT\'si geçmişe çekilince: liste isExpired ve expiredCount, dashboard negatif daysLeft verir', async () => {
    // Servis, geçmiş SKT'li ürünü API üzerinden kabul etmiyor; "paket oluşturulduktan
    // sonra SKT geçti" durumunu doğrudan DB'de simüle ediyoruz.
    await sequelize.query('UPDATE shop_products SET expiryDate = :date WHERE id = :id', {
      replacements: { date: '2020-01-01', id: productToExpireId },
    });

    const listRes = await listPackages(marketA.token);
    expect(listRes.status).toBe(200);
    expect(listRes.body.expiredCount).toBe(1);
    const expired = listRes.body.packages.find((p) => p.id === pkgToExpireId);
    expect(expired.isExpired).toBe(true);
    const others = listRes.body.packages.filter((p) => p.id !== pkgToExpireId);
    expect(others.every((p) => p.isExpired === false)).toBe(true);

    const summaryRes = await getSummary(marketA.token);
    expect(summaryRes.status).toBe(200);
    const entry = summaryRes.body.expiringSoon.find((e) => e.packageId === pkgToExpireId);
    expect(entry).toBeDefined();
    expect(entry.daysLeft).toBeLessThan(0);
  });

  it('DELETE /api/shop/packages/expired sadece SKT\'si geçen paketi siler', async () => {
    const res = await request(app)
      .delete('/api/shop/packages/expired')
      .set('Authorization', `Bearer ${marketA.token}`);

    expect(res.status).toBe(200);
    expect(res.body.deletedCount).toBe(1);
    expect(res.body.blockedCount).toBe(0);
  });

  it('toplu silme sonrası liste: SKT geçen paket yok, diğer ikisi duruyor', async () => {
    const res = await listPackages(marketA.token);

    expect(res.status).toBe(200);
    expect(res.body.total).toBe(2);
    expect(res.body.expiredCount).toBe(0);
    const ids = res.body.packages.map((p) => p.id);
    expect(ids).toEqual(expect.arrayContaining([pkgFreshId, pkgSoonId]));
    expect(ids).not.toContain(pkgToExpireId);
  });

  it('market B, market A\'nın paketlerini ve istatistiklerini görmez (shopId filtresi)', async () => {
    const listRes = await listPackages(marketB.token);
    expect(listRes.status).toBe(200);
    expect(listRes.body.total).toBe(0);
    expect(listRes.body.packages).toEqual([]);
    expect(listRes.body.expiredCount).toBe(0);

    const summaryRes = await getSummary(marketB.token);
    expect(summaryRes.status).toBe(200);
    expect(summaryRes.body.today.activePackages).toBe(0);
    expect(summaryRes.body.expiringSoon).toEqual([]);
  });
});