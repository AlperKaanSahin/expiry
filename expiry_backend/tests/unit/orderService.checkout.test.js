jest.mock('../../models', () => ({
  Order: { findOne: jest.fn() },
  OrderPackage: { findAll: jest.fn(), create: jest.fn() },
  Package: { update: jest.fn(), findOne: jest.fn() },
  PackageUnit: { findAll: jest.fn(), count: jest.fn() },
  PackageProduct: { findAll: jest.fn() },
  ShopProduct: {},
  Shop: { findOne: jest.fn(), findByPk: jest.fn() },
  User: { findByPk: jest.fn() },
  sequelize: { transaction: jest.fn() },
}));

jest.mock('../../events/eventBus', () => ({ emit: jest.fn() }));

// applyPlatformFee gerçek (pure) implementasyon olarak kalıyor — ayrı bir
// yerde (iyzicoService.checkout.test.js) test ediliyor, burada onu mock'un
// içine sahte bir versiyonla yeniden yazmak yerine gerçeğini kullanıyoruz.
// Sadece network'e giden initializeCheckoutForm/retrieveCheckoutForm mock'lanıyor.
jest.mock('../../services/iyzicoService', () => ({
  ...jest.requireActual('../../services/iyzicoService'),
  initializeCheckoutForm: jest.fn(),
  retrieveCheckoutForm: jest.fn(),
}));

const {
  Order, OrderPackage, Package, PackageUnit, Shop, User, sequelize,
} = require('../../models');
const iyzicoService = require('../../services/iyzicoService');
const eventBus = require('../../events/eventBus');
const ORDER_EVENTS = require('../../events/order.events');
const { initiateCheckout, handleCheckoutCallback } = require('../../services/orderService');

function mockTransaction() {
  const afterCommitCallbacks = [];
  const t = {
    LOCK: { UPDATE: 'UPDATE' },
    afterCommit: jest.fn((cb) => {
      afterCommitCallbacks.push(cb);
    }),
    commit: jest.fn(async () => {
      for (const cb of afterCommitCallbacks) {
        await cb();
      }
      return true;
    }),
    rollback: jest.fn().mockResolvedValue(true),
  };
  sequelize.transaction.mockResolvedValue(t);
  return t;
}

describe('orderService.initiateCheckout', () => {
  const originalBackendUrl = process.env.BACKEND_URL;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.BACKEND_URL = 'https://test.example.com';
  });

  afterAll(() => {
    process.env.BACKEND_URL = originalBackendUrl;
  });

  it('sipariş bulunamazsa AppError(404) fırlatır', async () => {
    Order.findOne.mockResolvedValue(null);

    await expect(initiateCheckout(5, 999, { ip: '1.2.3.4' })).rejects.toMatchObject({ statusCode: 404 });
  });

  it('sipariş pending değilse AppError(409) fırlatır', async () => {
    Order.findOne.mockResolvedValue({ id: 1, status: 'paid', shopId: 7, OrderPackages: [] });

    await expect(initiateCheckout(5, 1, { ip: '1.2.3.4' })).rejects.toMatchObject({ statusCode: 409 });
  });

  it('siparişte paket yoksa AppError(409) fırlatır', async () => {
    Order.findOne.mockResolvedValue({ id: 1, status: 'pending', shopId: 7, OrderPackages: [] });

    await expect(initiateCheckout(5, 1, { ip: '1.2.3.4' })).rejects.toMatchObject({ statusCode: 409 });
    expect(iyzicoService.initializeCheckoutForm).not.toHaveBeenCalled();
  });

  it('market submerchant\'ı active değilse AppError(409) fırlatır', async () => {
    Order.findOne.mockResolvedValue({
      id: 1, status: 'pending', shopId: 7, platformFee: 11,
      OrderPackages: [{ iyzicoItemId: 'op-1-0', price: 55, quantity: 1, Package: { name: 'X' } }],
    });
    User.findByPk.mockResolvedValue({ id: 5, firstName: 'A', lastName: 'B', email: 'a@b.com' });
    Shop.findByPk.mockResolvedValue({ id: 7, subMerchantKey: null, subMerchantStatus: 'pending' });

    await expect(initiateCheckout(5, 1, { ip: '1.2.3.4' })).rejects.toMatchObject({ statusCode: 409 });
    expect(iyzicoService.initializeCheckoutForm).not.toHaveBeenCalled();
  });

  it('subMerchantKey olsa da subMerchantStatus active değilse AppError(409) fırlatır', async () => {
    Order.findOne.mockResolvedValue({
      id: 1, status: 'pending', shopId: 7, platformFee: 11,
      OrderPackages: [{ iyzicoItemId: 'op-1-0', price: 55, quantity: 1, Package: { name: 'X' } }],
    });
    User.findByPk.mockResolvedValue({ id: 5, firstName: 'A', lastName: 'B', email: 'a@b.com' });
    Shop.findByPk.mockResolvedValue({ id: 7, subMerchantKey: 'sm-key', subMerchantStatus: 'failed' });

    await expect(initiateCheckout(5, 1, { ip: '1.2.3.4' })).rejects.toMatchObject({ statusCode: 409 });
  });

  // NOT: Artık ayrı bir "fee item" yok — komisyon, applyPlatformFee ile her
  // paket kaleminin price/subMerchantPrice farkına yansıtılıyor. Iyzico
  // marketplace ödemesinde HER kalemin subMerchantKey taşıması zorunlu
  // olduğu için (sandbox'ta alınan gerçek hata buydu) ayrı, key'siz bir fee
  // kalemi artık mümkün değil.
  it('basketItems\'ı her paket için tek kalem olarak kurar; komisyon subMerchantPrice farkı olarak yansır', async () => {
    const mockOrder = {
      id: 42, status: 'pending', shopId: 7, platformFee: 11, paidPrice: 66,
      save: jest.fn().mockResolvedValue(true),
      OrderPackages: [
        { iyzicoItemId: 'op-42-0', price: 55, quantity: 1, Package: { name: 'Test Paket' } },
      ],
    };
    Order.findOne.mockResolvedValue(mockOrder);
    User.findByPk.mockResolvedValue({ id: 5, firstName: 'A', lastName: 'B', email: 'a@b.com' });
    Shop.findByPk.mockResolvedValue({ id: 7, subMerchantKey: 'sm-key-1', subMerchantStatus: 'active' });
    iyzicoService.initializeCheckoutForm.mockResolvedValue({ token: 'tok-1', paymentPageUrl: 'https://pay' });

    const result = await initiateCheckout(5, 42, { ip: '9.9.9.9' });

    const [orderArg, basketItemsArg, userArg, ipArg, callbackUrlArg, shopArg] =
      iyzicoService.initializeCheckoutForm.mock.calls[0];

    expect(orderArg).toBe(mockOrder);
    expect(userArg).toMatchObject({ id: 5 });
    expect(ipArg).toBe('9.9.9.9');
    expect(callbackUrlArg).toBe('https://test.example.com/api/orders/checkout/callback');
    expect(shopArg).toMatchObject({ id: 7 });

    expect(basketItemsArg).toHaveLength(1);
    expect(basketItemsArg[0]).toMatchObject({
      id: 'op-42-0', name: 'Test Paket', subMerchantKey: 'sm-key-1', subMerchantPrice: 55, price: 66,
    });

    expect(mockOrder.checkoutToken).toBe('tok-1');
    expect(mockOrder.save).toHaveBeenCalled();
    expect(result).toEqual({ paymentPageUrl: 'https://pay', token: 'tok-1' });
  });

  it('platformFee 0 ise price ve subMerchantPrice eşit olur (komisyon farkı yok)', async () => {
    const mockOrder = {
      id: 43, status: 'pending', shopId: 7, platformFee: 0, paidPrice: 55,
      save: jest.fn().mockResolvedValue(true),
      OrderPackages: [{ iyzicoItemId: 'op-43-0', price: 55, quantity: 1, Package: { name: 'X' } }],
    };
    Order.findOne.mockResolvedValue(mockOrder);
    User.findByPk.mockResolvedValue({ id: 5, firstName: 'A', lastName: 'B', email: 'a@b.com' });
    Shop.findByPk.mockResolvedValue({ id: 7, subMerchantKey: 'sm-key', subMerchantStatus: 'active' });
    iyzicoService.initializeCheckoutForm.mockResolvedValue({ token: 't', paymentPageUrl: 'u' });

    await initiateCheckout(5, 43, { ip: '1.1.1.1' });

    const basketItemsArg = iyzicoService.initializeCheckoutForm.mock.calls[0][1];
    expect(basketItemsArg).toHaveLength(1);
    expect(basketItemsArg[0].price).toBe(55);
    expect(basketItemsArg[0].subMerchantPrice).toBe(55);
  });

  it('birden fazla paketli siparişte her paket kendi iyzicoItemId\'siyle ayrı basket item olur', async () => {
    const mockOrder = {
      id: 44, status: 'pending', shopId: 7, platformFee: 20, paidPrice: 120,
      save: jest.fn().mockResolvedValue(true),
      OrderPackages: [
        { iyzicoItemId: 'op-44-0', price: 50, quantity: 1, Package: { name: 'Paket 1' } },
        { iyzicoItemId: 'op-44-1', price: 50, quantity: 1, Package: { name: 'Paket 2' } },
      ],
    };
    Order.findOne.mockResolvedValue(mockOrder);
    User.findByPk.mockResolvedValue({ id: 5, firstName: 'A', lastName: 'B', email: 'a@b.com' });
    Shop.findByPk.mockResolvedValue({ id: 7, subMerchantKey: 'sm-key', subMerchantStatus: 'active' });
    iyzicoService.initializeCheckoutForm.mockResolvedValue({ token: 't', paymentPageUrl: 'u' });

    await initiateCheckout(5, 44, { ip: '1.1.1.1' });

    const basketItemsArg = iyzicoService.initializeCheckoutForm.mock.calls[0][1];
    expect(basketItemsArg).toHaveLength(2); // artık ayrı fee item yok
    expect(basketItemsArg[0].id).toBe('op-44-0');
    expect(basketItemsArg[1].id).toBe('op-44-1');
    expect(basketItemsArg.reduce((sum, i) => sum + i.price, 0)).toBe(120); // paidPrice ile eşit
  });

  it('quantity > 1 olan bir paketin fiyatı price * quantity üzerinden hesaplanır, komisyon price\'a eklenir', async () => {
    const mockOrder = {
      id: 45, status: 'pending', shopId: 7, platformFee: 20, paidPrice: 140,
      save: jest.fn().mockResolvedValue(true),
      OrderPackages: [{ iyzicoItemId: 'op-45-0', price: 40, quantity: 3, Package: { name: 'Paket' } }],
    };
    Order.findOne.mockResolvedValue(mockOrder);
    User.findByPk.mockResolvedValue({ id: 5, firstName: 'A', lastName: 'B', email: 'a@b.com' });
    Shop.findByPk.mockResolvedValue({ id: 7, subMerchantKey: 'sm-key', subMerchantStatus: 'active' });
    iyzicoService.initializeCheckoutForm.mockResolvedValue({ token: 't', paymentPageUrl: 'u' });

    await initiateCheckout(5, 45, { ip: '1.1.1.1' });

    const basketItemsArg = iyzicoService.initializeCheckoutForm.mock.calls[0][1];
    expect(basketItemsArg[0].subMerchantPrice).toBe(120); // 40 * 3, mağazanın payı
    expect(basketItemsArg[0].price).toBe(140); // 120 + platformFee(20)
  });

  it('iyzicoService.initializeCheckoutForm hata fırlatırsa checkoutToken hiç set edilmez', async () => {
    const mockOrder = {
      id: 46, status: 'pending', shopId: 7, platformFee: 10, paidPrice: 40,
      save: jest.fn().mockResolvedValue(true),
      OrderPackages: [{ iyzicoItemId: 'op-46-0', price: 30, quantity: 1, Package: { name: 'X' } }],
    };
    Order.findOne.mockResolvedValue(mockOrder);
    User.findByPk.mockResolvedValue({ id: 5, firstName: 'A', lastName: 'B', email: 'a@b.com' });
    Shop.findByPk.mockResolvedValue({ id: 7, subMerchantKey: 'sm-key', subMerchantStatus: 'active' });
    iyzicoService.initializeCheckoutForm.mockRejectedValue(new Error('Iyzico hatası'));

    await expect(initiateCheckout(5, 46, { ip: '1.1.1.1' })).rejects.toThrow('Iyzico hatası');
    expect(mockOrder.save).not.toHaveBeenCalled();
  });
});

describe('orderService.handleCheckoutCallback', () => {
  beforeEach(() => jest.clearAllMocks());

  it('checkoutToken bulunamazsa AppError(404) fırlatır', async () => {
    Order.findOne.mockResolvedValue(null);

    await expect(handleCheckoutCallback('bilinmeyen-token')).rejects.toMatchObject({ statusCode: 404 });
  });

  it('order zaten pending değilse (idempotent) retrieveCheckoutForm\'a hiç gitmeden order\'ı döner', async () => {
    const mockOrder = { id: 1, status: 'paid', checkoutToken: 'tok' };
    Order.findOne.mockResolvedValue(mockOrder);

    const result = await handleCheckoutCallback('tok');

    expect(result).toBe(mockOrder);
    expect(iyzicoService.retrieveCheckoutForm).not.toHaveBeenCalled();
    expect(sequelize.transaction).not.toHaveBeenCalled();
  });

  it('Iyzico paymentStatus SUCCESS değilse AppError(402) fırlatır, transaction hiç açılmaz', async () => {
    Order.findOne.mockResolvedValue({ id: 1, status: 'pending', checkoutToken: 'tok' });
    iyzicoService.retrieveCheckoutForm.mockResolvedValue({ paymentStatus: 'FAILURE', errorMessage: 'Kart reddedildi' });

    await expect(handleCheckoutCallback('tok')).rejects.toMatchObject({ statusCode: 402, message: 'Kart reddedildi' });
    expect(sequelize.transaction).not.toHaveBeenCalled();
  });

  it('paymentStatus SUCCESS ise itemTransactions\'ı OrderPackage\'lara yazar ve order \'paid\' olur', async () => {
    const t = mockTransaction();

    const initialOrder = { id: 1, status: 'pending', checkoutToken: 'tok', paidPrice: 0 };
    const lockedOrder = {
      id: 1, status: 'pending', userId: 5, shopId: 7,
      save: jest.fn().mockResolvedValue(true),
    };

    Order.findOne
      .mockResolvedValueOnce(initialOrder)
      .mockResolvedValueOnce(lockedOrder);

    iyzicoService.retrieveCheckoutForm.mockResolvedValue({
      paymentStatus: 'SUCCESS',
      itemTransactions: [{ itemId: 'op-1-0', paymentTransactionId: 'tx-999' }],
    });

    const matchedOrderPackage = {
      id: 10, packageId: 3, quantity: 1, iyzicoItemId: 'op-1-0',
      save: jest.fn().mockResolvedValue(true),
    };
    OrderPackage.findAll.mockResolvedValue([matchedOrderPackage]);
    PackageUnit.findAll.mockResolvedValue([{ id: 100, isSold: false, save: jest.fn().mockResolvedValue(true) }]);
    PackageUnit.count.mockResolvedValue(0);
    Package.update.mockResolvedValue(true);

    const result = await handleCheckoutCallback('tok');

    expect(matchedOrderPackage.iyzicoPaymentTransactionId).toBe('tx-999');
    expect(matchedOrderPackage.save).toHaveBeenCalledWith({ transaction: t });
    expect(lockedOrder.status).toBe('paid');
    expect(eventBus.emit).toHaveBeenCalledWith(ORDER_EVENTS.PAID, expect.objectContaining({ orderId: 1 }));
    expect(t.commit).toHaveBeenCalled();
    expect(result).toBe(lockedOrder);
  });

  it('itemTransactions\'da eşleşmeyen bir itemId varsa (bilinmeyen item) sessizce atlanır, hata vermez', async () => {
    const t = mockTransaction();
    const initialOrder = { id: 1, status: 'pending', checkoutToken: 'tok', paidPrice: 0 };
    const lockedOrder = { id: 1, status: 'pending', save: jest.fn().mockResolvedValue(true) };

    Order.findOne.mockResolvedValueOnce(initialOrder).mockResolvedValueOnce(lockedOrder);
    iyzicoService.retrieveCheckoutForm.mockResolvedValue({
      paymentStatus: 'SUCCESS',
      itemTransactions: [{ itemId: 'op-baska-siparis-0', paymentTransactionId: 'tx-alakasiz' }],
    });

    const orderPackage = { id: 10, packageId: 3, quantity: 1, iyzicoItemId: 'op-1-0', save: jest.fn() };
    OrderPackage.findAll.mockResolvedValue([orderPackage]);
    PackageUnit.findAll.mockResolvedValue([{ id: 200, isSold: false, save: jest.fn().mockResolvedValue(true) }]);
    PackageUnit.count.mockResolvedValue(0);
    Package.update.mockResolvedValue(true);

    await handleCheckoutCallback('tok');

    expect(orderPackage.save).not.toHaveBeenCalled();
    expect(orderPackage.iyzicoPaymentTransactionId).toBeUndefined();
  });

  it('transaction içinde lock alındığında order artık pending değilse (race condition) state değiştirmeden commit eder', async () => {
    const t = mockTransaction();
    const initialOrder = { id: 1, status: 'pending', checkoutToken: 'tok', paidPrice: 0 };
    const lockedOrder = { id: 1, status: 'paid' };

    Order.findOne.mockResolvedValueOnce(initialOrder).mockResolvedValueOnce(lockedOrder);
    iyzicoService.retrieveCheckoutForm.mockResolvedValue({ paymentStatus: 'SUCCESS', itemTransactions: [] });

    const result = await handleCheckoutCallback('tok');

    expect(t.commit).toHaveBeenCalled();
    expect(result).toBe(lockedOrder);
    expect(OrderPackage.findAll).not.toHaveBeenCalled();
  });

  it('transaction içinde bir hata oluşursa rollback yapar ve hatayı yeniden fırlatır', async () => {
    const t = mockTransaction();
    const initialOrder = { id: 1, status: 'pending', checkoutToken: 'tok', paidPrice: 0 };
    const lockedOrder = { id: 1, status: 'pending', save: jest.fn().mockRejectedValue(new Error('DB hatası')) };

    Order.findOne.mockResolvedValueOnce(initialOrder).mockResolvedValueOnce(lockedOrder);
    iyzicoService.retrieveCheckoutForm.mockResolvedValue({ paymentStatus: 'SUCCESS', itemTransactions: [] });
    OrderPackage.findAll.mockResolvedValue([]);

    await expect(handleCheckoutCallback('tok')).rejects.toThrow('DB hatası');
    expect(t.rollback).toHaveBeenCalled();
  });
});