const request = require('supertest');
const app = require('../../app');
const { sequelize, Shop, PackageUnit } = require('../../models');
const iyzicoService = require('../../services/iyzicoService');
const { futureDate, futureIso, utcSqlDateTime } = require('../helpers/dates');

// Ağa giden tek parça mock'lanıyor; applyPlatformFee gibi saf fonksiyonlar gerçek kalıyor.
jest.mock('../../services/iyzicoService', () => ({
  ...jest.requireActual('../../services/iyzicoService'),
  initializeCheckoutForm: jest.fn(),
}));

// Rezervasyon süresi (createOrder'da 20 dk) ödeme sayfası açılmadan dolarsa ve üniteler başka
// bir müşteriye geçerse, ilk müşteri ödeme yapınca para çekilir ama reserveStock stok bulamaz
// (para alındı, sipariş yok, manuel iade). Bu testler initiateCheckout'un ÖDEMEDEN ÖNCE
// rezervasyonu doğruladığını, ünite hâlâ bizdeyse süreyi uzattığını ve uzatmanın üst sınırı
// olduğunu gerçek DB üzerinde kanıtlar.
describe('Checkout rezervasyon koruması', () => {
  const timestamp = Date.now();

  let adminToken, marketToken, shopId;
  let packageIds = {};

  afterAll(async () => {
    await sequelize.close();
  });

  beforeEach(() => {
    iyzicoService.initializeCheckoutForm.mockReset();
    iyzicoService.initializeCheckoutForm.mockImplementation(async (order) => ({
      token: `tok-${order.id}-${Date.now()}`,
      paymentPageUrl: 'https://pay.test',
    }));
  });

  async function registerCustomer(label) {
    const res = await request(app).post('/api/users/register').send({
      email: `reservation-${label}+${timestamp}@test.com`, password: '123456', firstName: label, lastName: 'Test',
    });
    expect(res.status).toBe(201);
    return res.body.accessToken;
  }

  async function createOrder(token, packageId) {
    return request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${token}`)
      .send({ shopId, packages: [{ packageId, quantity: 1 }] });
  }

  const checkout = (token, orderId) =>
    request(app).post(`/api/orders/${orderId}/checkout`).set('Authorization', `Bearer ${token}`);

  // Rezervasyon süresini "geçmişe çekmek" için ham SQL: Date nesnesi yerel saat dilimine
  // göre yazılır (bkz. helpers/dates.js utcSqlDateTime).
  const expireReservation = (orderId) =>
    sequelize.query('UPDATE `PackageUnits` SET reservedUntil = :past WHERE reservedByOrderId = :orderId', {
      replacements: { past: utcSqlDateTime(new Date(Date.now() - 60 * 1000)), orderId },
    });

  async function createPackage(name) {
    const productRes = await request(app)
      .post('/api/shop/products')
      .set('Authorization', `Bearer ${marketToken}`)
      .send({ name: `${name} Ürünü`, price: 10, quantity: 50, expiryDate: futureDate(30) });
    expect(productRes.status).toBe(201);

    const packageRes = await request(app)
      .post('/api/shop/packages')
      .set('Authorization', `Bearer ${marketToken}`)
      .send({
        name,
        quantity: 1,
        deliveryStart: futureIso(30, 10),
        deliveryEnd: futureIso(30, 18),
        products: [{ id: productRes.body.id, quantity: 1, price: 10 }],
      });
    expect(packageRes.status).toBe(201);
    return packageRes.body.id;
  }

  it('hazırlık: admin, onaylı ve ödeme almaya hazır market, üç tek stoklu paket', async () => {
    const adminRes = await request(app).post('/api/users/login').send({ email: 'admin@example.com', password: '1234' });
    expect(adminRes.status).toBe(200);
    adminToken = adminRes.body.accessToken;

    const marketEmail = `reservation-market+${timestamp}@test.com`;
    const registerRes = await request(app).post('/api/users/register').send({
      email: marketEmail, password: '123456', firstName: 'Res', lastName: 'Market',
    });
    expect(registerRes.status).toBe(201);

    const applyRes = await request(app)
      .post('/api/shops/apply')
      .set('Authorization', `Bearer ${registerRes.body.accessToken}`)
      .send({ name: `Reservation Market ${timestamp}`, address: 'Adres', phone: '05550000000', category: 'MARKET' });
    expect(applyRes.status).toBe(200);
    shopId = applyRes.body.shop.id;

    const approveRes = await request(app)
      .put(`/api/admin/shops/${shopId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'active' });
    expect(approveRes.status).toBe(200);

    // Iyzico'ya gitmeden alt üye işyeri alanlarını doğrudan yazıyoruz.
    await Shop.update({ subMerchantKey: `smk-${timestamp}`, subMerchantStatus: 'active' }, { where: { id: shopId } });

    const loginRes = await request(app).post('/api/users/login').send({ email: marketEmail, password: '123456' });
    expect(loginRes.status).toBe(200);
    marketToken = loginRes.body.accessToken;

    packageIds.taken = await createPackage('Başkasına Geçen');
    packageIds.extend = await createPackage('Uzatılan');
    packageIds.cap = await createPackage('Üst Sınır');
  });

  it('süre dolmuş ve üniteler başka müşteriye geçmişse ödeme sayfası açılmaz (409)', async () => {
    const tokenA = await registerCustomer('a');
    const tokenB = await registerCustomer('b');

    const orderA = await createOrder(tokenA, packageIds.taken);
    expect(orderA.status).toBe(201);

    await expireReservation(orderA.body.id);

    const orderB = await createOrder(tokenB, packageIds.taken);
    expect(orderB.status).toBe(201); // süresi dolan rezervasyon lazy release ile B'ye geçti

    const res = await checkout(tokenA, orderA.body.id);

    expect(res.status).toBe(409);
    expect(iyzicoService.initializeCheckoutForm).not.toHaveBeenCalled();
  });

  it('süre dolmuş ama üniteler hâlâ bu siparişteyse ödeme açılır, rezervasyon uzatılır ve başkası alamaz', async () => {
    const tokenA = await registerCustomer('c');
    const tokenB = await registerCustomer('d');

    const orderA = await createOrder(tokenA, packageIds.extend);
    expect(orderA.status).toBe(201);

    await expireReservation(orderA.body.id);

    const res = await checkout(tokenA, orderA.body.id);

    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(iyzicoService.initializeCheckoutForm).toHaveBeenCalledTimes(1);

    const units = await PackageUnit.findAll({ where: { reservedByOrderId: orderA.body.id } });
    expect(units).toHaveLength(1);
    expect(units[0].reservedUntil.getTime()).toBeGreaterThan(Date.now() + 30 * 60 * 1000);

    const orderB = await createOrder(tokenB, packageIds.extend);
    expect(orderB.status).toBe(409); // uzatılan rezervasyon yüzünden stok yok
  });

  it('sipariş çok eskiyse (üst sınır aşıldı) üniteler hâlâ bizde olsa bile uzatılmaz (409)', async () => {
    const tokenA = await registerCustomer('e');

    const orderA = await createOrder(tokenA, packageIds.cap);
    expect(orderA.status).toBe(201);

    await expireReservation(orderA.body.id);
    await sequelize.query('UPDATE `orders` SET createdAt = :old WHERE id = :orderId', {
      replacements: { old: utcSqlDateTime(new Date(Date.now() - 2 * 60 * 60 * 1000)), orderId: orderA.body.id },
    });

    const res = await checkout(tokenA, orderA.body.id);

    expect(res.status).toBe(409);
    expect(iyzicoService.initializeCheckoutForm).not.toHaveBeenCalled();
  });
});