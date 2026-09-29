const request = require('supertest');
const crypto = require('crypto');

// Sadece Iyzico'ya GERÇEKTEN gidecek fonksiyonları mock'luyoruz — verifyWebhookSignature
// ve applyPlatformFee GERÇEK implementasyon (jest.requireActual), çünkü asıl test ettiğimiz
// şey imza doğrulamasının ve sepet kurulumunun gerçekten çalıştığı.
jest.mock('../../services/iyzicoService', () => {
  const actual = jest.requireActual('../../services/iyzicoService');
  return {
    ...actual,
    retrieveCheckoutForm: jest.fn(),
    initializeCheckoutForm: jest.fn(),
    approvePaymentTransaction: jest.fn(),
    createOrUpdateSubMerchant: jest.fn(),
  };
});

const app = require('../../app');
const { User, Shop, Package, PackageUnit, Order, OrderPackage } = require('../../models');
const orderService = require('../../services/orderService');
const iyzicoService = require('../../services/iyzicoService');

function buildSignature({ iyziEventType, iyziPaymentId, token, paymentConversationId, status }) {
  const secretKey = process.env.IYZICO_SECRET_KEY;
  const key = `${secretKey}${iyziEventType}${iyziPaymentId}${token}${paymentConversationId}${status}`;
  return crypto.createHmac('sha256', secretKey).update(key).digest('hex');
}

describe('Iyzico webhook akışı: POST /api/orders/webhook/iyzico', () => {
  let owner, user, shop, pkg, order, orderPackage;

  beforeEach(async () => {
    jest.clearAllMocks();

    const suffix = Date.now();

    owner = await User.create({
      email: `webhook-owner-${suffix}@example.com`,
      password: '123456',
      firstName: 'Market',
      lastName: 'Sahibi',
      role: 'market',
    });

    user = await User.create({
      email: `webhook-user-${suffix}@example.com`,
      password: '123456',
      firstName: 'Test',
      lastName: 'Kullanici',
      role: 'user',
    });

    shop = await Shop.create({
      name: `Webhook Test Market ${suffix}`,
      address: 'Adres',
      phone: '5550000000',
      ownerId: owner.id,
      status: 'active',
      subMerchantKey: 'test-submerchant-key',
      subMerchantStatus: 'active',
    });

    pkg = await Package.create({
      name: 'Webhook Test Paket',
      price: 55,
      shopId: shop.id,
      quantity: 1,
      deliveryStart: new Date(),
      deliveryEnd: new Date(Date.now() + 86400000),
    });
    await PackageUnit.create({ packageId: pkg.id, isSold: false });

    // Order, gerçek createOrder akışından geçirilerek oluşturuluyor — reservedByOrderId/
    // reservedUntil'i burada elle taklit ETMİYORUZ. Böylece reserveStock/createOrder
    // ileride değişirse bu test de o gerçek davranışı otomatik takip eder, fixture
    // sessizce eskimez.
    order = await orderService.createOrder(user.id, {
      shopId: shop.id,
      packages: [{ packageId: pkg.id, quantity: 1 }],
    });

    orderPackage = await OrderPackage.findOne({ where: { orderId: order.id } });

    // checkoutToken normalde initiateCheckout ile Iyzico'dan dönen token'la set edilir —
    // gerçek akış çağrılıyor, sadece dış Iyzico çağrısı (initializeCheckoutForm) mock'lanıyor.
    iyzicoService.initializeCheckoutForm.mockResolvedValue({
      token: `test-checkout-token-${suffix}`,
      paymentPageUrl: 'https://sandbox-payment.iyzipay.com/xyz',
    });

    await orderService.initiateCheckout(user.id, order.id, { ip: '127.0.0.1' });
    order = await Order.findByPk(order.id);
  });

  afterEach(async () => {
    await OrderPackage.destroy({ where: { orderId: order.id } });
    await Order.destroy({ where: { id: order.id } });
    await PackageUnit.destroy({ where: { packageId: pkg.id } });
    await Package.destroy({ where: { id: pkg.id } });
    await Shop.destroy({ where: { id: shop.id } });
    await User.destroy({ where: { id: [user.id, owner.id] } });
  });

  it('imza header\'ı hiç yoksa 401 döner, order işlenmez', async () => {
    const res = await request(app)
      .post('/api/orders/webhook/iyzico')
      .send({
        iyziEventType: 'CHECKOUT_FORM_AUTH',
        iyziPaymentId: '123',
        token: order.checkoutToken,
        paymentConversationId: 'conv-1',
        status: 'SUCCESS',
      });

    expect(res.status).toBe(401);
    expect(iyzicoService.retrieveCheckoutForm).not.toHaveBeenCalled();

    const unchanged = await Order.findByPk(order.id);
    expect(unchanged.status).toBe('pending');
  });

  it('geçersiz (yanlış) imza ile 401 döner, order işlenmez', async () => {
    const res = await request(app)
      .post('/api/orders/webhook/iyzico')
      .set('X-IYZ-SIGNATURE-V3', 'tamamen-yanlis-bir-imza')
      .send({
        iyziEventType: 'CHECKOUT_FORM_AUTH',
        iyziPaymentId: '123',
        token: order.checkoutToken,
        paymentConversationId: 'conv-1',
        status: 'SUCCESS',
      });

    expect(res.status).toBe(401);
    expect(iyzicoService.retrieveCheckoutForm).not.toHaveBeenCalled();
  });

  it('geçerli imza ve status=SUCCESS ile order \'paid\' durumuna geçer', async () => {
    const payload = {
      iyziEventType: 'CHECKOUT_FORM_AUTH',
      iyziPaymentId: '123',
      token: order.checkoutToken,
      paymentConversationId: 'conv-1',
      status: 'SUCCESS',
    };
    const signature = buildSignature(payload);

    iyzicoService.retrieveCheckoutForm.mockResolvedValue({
      paymentStatus: 'SUCCESS',
      itemTransactions: [{ itemId: orderPackage.iyzicoItemId, paymentTransactionId: 'tx-webhook-1' }],
    });

    const res = await request(app)
      .post('/api/orders/webhook/iyzico')
      .set('X-IYZ-SIGNATURE-V3', signature)
      .send(payload);

    expect(res.status).toBe(200);

    const updated = await Order.findByPk(order.id);
    expect(updated.status).toBe('paid');
    expect(updated.paidAt).not.toBeNull();
  });

  it('geçerli imza ama status SUCCESS değilse (örn. INIT_THREEDS) order işlenmez, retrieveCheckoutForm hiç çağrılmaz', async () => {
    const payload = {
      iyziEventType: 'CHECKOUT_FORM_AUTH',
      iyziPaymentId: '123',
      token: order.checkoutToken,
      paymentConversationId: 'conv-1',
      status: 'INIT_THREEDS',
    };
    const signature = buildSignature(payload);

    const res = await request(app)
      .post('/api/orders/webhook/iyzico')
      .set('X-IYZ-SIGNATURE-V3', signature)
      .send(payload);

    expect(res.status).toBe(200);
    expect(iyzicoService.retrieveCheckoutForm).not.toHaveBeenCalled();

    const unchanged = await Order.findByPk(order.id);
    expect(unchanged.status).toBe('pending');
  });

  it('order zaten \'paid\' ise (idempotency) webhook tekrar gelirse retrieveCheckoutForm\'a hiç gitmez', async () => {
    await order.update({ status: 'paid', paidAt: new Date() });

    const payload = {
      iyziEventType: 'CHECKOUT_FORM_AUTH',
      iyziPaymentId: '123',
      token: order.checkoutToken,
      paymentConversationId: 'conv-1',
      status: 'SUCCESS',
    };
    const signature = buildSignature(payload);

    const res = await request(app)
      .post('/api/orders/webhook/iyzico')
      .set('X-IYZ-SIGNATURE-V3', signature)
      .send(payload);

    expect(res.status).toBe(200);
    expect(iyzicoService.retrieveCheckoutForm).not.toHaveBeenCalled();
  });

  it('retrieveCheckoutForm hata fırlatırsa (Iyzico\'ya erişilemedi) webhook yine 200 döner, order değişmez', async () => {
    const payload = {
      iyziEventType: 'CHECKOUT_FORM_AUTH',
      iyziPaymentId: '123',
      token: order.checkoutToken,
      paymentConversationId: 'conv-1',
      status: 'SUCCESS',
    };
    const signature = buildSignature(payload);

    iyzicoService.retrieveCheckoutForm.mockRejectedValue(new Error('Iyzico\'ya erişilemedi'));

    const res = await request(app)
      .post('/api/orders/webhook/iyzico')
      .set('X-IYZ-SIGNATURE-V3', signature)
      .send(payload);

    expect(res.status).toBe(200);

    const unchanged = await Order.findByPk(order.id);
    expect(unchanged.status).toBe('pending');
  });

  it('token bilinmeyen bir sipariş için gelirse (404) yine 200 döner, exception dışarı taşmaz', async () => {
    const payload = {
      iyziEventType: 'CHECKOUT_FORM_AUTH',
      iyziPaymentId: '123',
      token: 'hic-var-olmayan-bir-token',
      paymentConversationId: 'conv-1',
      status: 'SUCCESS',
    };
    const signature = buildSignature(payload);

    const res = await request(app)
      .post('/api/orders/webhook/iyzico')
      .set('X-IYZ-SIGNATURE-V3', signature)
      .send(payload);

    expect(res.status).toBe(200);
  });
});