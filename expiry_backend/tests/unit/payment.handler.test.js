jest.mock('../../models', () => ({
  Order: { findByPk: jest.fn() },
  OrderPackage: { findAll: jest.fn() },
}));
jest.mock('../../services/iyzicoService', () => ({
  approvePaymentTransaction: jest.fn(),
  retrieveCheckoutForm: jest.fn(),
}));
jest.mock('@sentry/node', () => ({
  captureMessage: jest.fn(),
  captureException: jest.fn(),
}));

const { Order, OrderPackage } = require('../../models');
const iyzicoService = require('../../services/iyzicoService');
const Sentry = require('@sentry/node');
const eventBus = require('../../events/eventBus');
const ORDER_EVENTS = require('../../events/order.events');
const { approveOrderPackages, MAX_APPROVAL_ATTEMPTS } = require('../../handlers/payment.handler');

// eventBus.emit senkron ama listener async — içindeki await'lerin tamamlanmasını
// beklemek için microtask kuyruğunu birkaç tur boşaltıyoruz.
const flush = async () => {
  await new Promise((resolve) => setImmediate(resolve));
  await new Promise((resolve) => setImmediate(resolve));
};

function makePackage(overrides = {}) {
  return {
    id: 1,
    iyzicoItemId: 'op-1-0',
    iyzicoPaymentTransactionId: 'tx-1',
    iyzicoApprovedAt: null,
    approvalAttempts: 0,
    lastApprovalError: null,
    save: jest.fn().mockResolvedValue(true),
    ...overrides,
  };
}

describe('payment.handler — ORDER_EVENTS.CONFIRMED (eventBus üzerinden)', () => {
  beforeEach(() => jest.clearAllMocks());

  it('confirmed event geldiğinde her OrderPackage için approvePaymentTransaction çağırır ve iyzicoApprovedAt\'i set eder', async () => {
    const pkg1 = makePackage({ id: 1, iyzicoPaymentTransactionId: 'tx-1' });
    const pkg2 = makePackage({ id: 2, iyzicoPaymentTransactionId: 'tx-2' });
    OrderPackage.findAll.mockResolvedValue([pkg1, pkg2]);
    iyzicoService.approvePaymentTransaction.mockResolvedValue({ status: 'success' });

    eventBus.emit(ORDER_EVENTS.CONFIRMED, { orderId: 99 });
    await flush();

    expect(OrderPackage.findAll).toHaveBeenCalledWith({ where: { orderId: 99 } });
    expect(iyzicoService.approvePaymentTransaction).toHaveBeenCalledWith('tx-1');
    expect(iyzicoService.approvePaymentTransaction).toHaveBeenCalledWith('tx-2');
    expect(pkg1.iyzicoApprovedAt).toBeInstanceOf(Date);
    expect(pkg2.iyzicoApprovedAt).toBeInstanceOf(Date);
    expect(pkg1.save).toHaveBeenCalled();
    expect(pkg2.save).toHaveBeenCalled();
  });

  it('approveOrderPackages hata fırlatırsa event listener\'dan dışarı taşmaz', async () => {
    OrderPackage.findAll.mockRejectedValue(new Error('DB bağlantı hatası'));

    expect(() => eventBus.emit(ORDER_EVENTS.CONFIRMED, { orderId: 103 })).not.toThrow();
    await flush();
  });
});

describe('approveOrderPackages', () => {
  beforeEach(() => jest.clearAllMocks());

  it('OrderPackage listesi boşsa hiçbir şey yapmadan true döner', async () => {
    OrderPackage.findAll.mockResolvedValue([]);

    const result = await approveOrderPackages(100);

    expect(iyzicoService.approvePaymentTransaction).not.toHaveBeenCalled();
    expect(result).toBe(true);
  });

  it('OrderPackage.findAll hata fırlatırsa exception yukarı fırlar (çağıran taraf yakalar)', async () => {
    OrderPackage.findAll.mockRejectedValue(new Error('DB bağlantı hatası'));

    await expect(approveOrderPackages(100)).rejects.toThrow('DB bağlantı hatası');
  });

  it('iyzicoApprovedAt zaten doluysa (idempotent) tekrar approve çağırmaz', async () => {
    const pkg = makePackage({ id: 1, iyzicoApprovedAt: new Date(), iyzicoPaymentTransactionId: 'tx-1' });
    OrderPackage.findAll.mockResolvedValue([pkg]);

    const result = await approveOrderPackages(100);

    expect(iyzicoService.approvePaymentTransaction).not.toHaveBeenCalled();
    expect(pkg.save).not.toHaveBeenCalled();
    expect(result).toBe(true);
  });

  it('paymentTransactionId olmayan ve backfill de sonuç vermeyen bir OrderPackage için approve çağırmadan atlar', async () => {
    const pkg = makePackage({ id: 1, iyzicoPaymentTransactionId: null });
    OrderPackage.findAll.mockResolvedValue([pkg]);
    Order.findByPk.mockResolvedValue({ id: 100, checkoutToken: null }); // backfill: token yok, hemen çıkar

    const result = await approveOrderPackages(100);

    expect(iyzicoService.approvePaymentTransaction).not.toHaveBeenCalled();
    expect(result).toBe(false);
  });

  it('paymentTransactionId eksikse ama iyzico\'dan retrieve edilebiliyorsa (backfill) doldurup approve eder', async () => {
    const pkg = makePackage({ id: 1, iyzicoItemId: 'op-100-0', iyzicoPaymentTransactionId: null });
    OrderPackage.findAll.mockResolvedValue([pkg]);
    Order.findByPk.mockResolvedValue({ id: 100, checkoutToken: 'tok-100' });
    iyzicoService.retrieveCheckoutForm.mockResolvedValue({
      paymentStatus: 'SUCCESS',
      itemTransactions: [{ itemId: 'op-100-0', paymentTransactionId: 'tx-backfilled' }],
    });
    iyzicoService.approvePaymentTransaction.mockResolvedValue({ status: 'success' });

    const result = await approveOrderPackages(100);

    expect(pkg.iyzicoPaymentTransactionId).toBe('tx-backfilled');
    expect(iyzicoService.approvePaymentTransaction).toHaveBeenCalledWith('tx-backfilled');
    expect(pkg.iyzicoApprovedAt).toBeInstanceOf(Date);
    expect(result).toBe(true);
  });

  it('approve başarısız olursa approvalAttempts artar, lastApprovalError set edilir, exception dışarı taşmaz', async () => {
    const pkg = makePackage({ id: 1, iyzicoPaymentTransactionId: 'tx-1', approvalAttempts: 3 });
    OrderPackage.findAll.mockResolvedValue([pkg]);
    iyzicoService.approvePaymentTransaction.mockRejectedValue(new Error('Iyzico hatası'));

    const result = await approveOrderPackages(100);

    expect(result).toBe(false);
    expect(pkg.approvalAttempts).toBe(4);
    expect(pkg.lastApprovalError).toBe('Iyzico hatası');
    expect(pkg.iyzicoApprovedAt).toBeNull();
    expect(pkg.save).toHaveBeenCalled();
  });

  it('approvalAttempts tam MAX_APPROVAL_ATTEMPTS\'e ulaştığı anda Sentry\'ye bir kez bildirir', async () => {
    const pkg = makePackage({ id: 1, iyzicoPaymentTransactionId: 'tx-1', approvalAttempts: MAX_APPROVAL_ATTEMPTS - 1 });
    OrderPackage.findAll.mockResolvedValue([pkg]);
    iyzicoService.approvePaymentTransaction.mockRejectedValue(new Error('sürekli başarısız'));

    await approveOrderPackages(100);

    expect(pkg.approvalAttempts).toBe(MAX_APPROVAL_ATTEMPTS);
    expect(Sentry.captureMessage).toHaveBeenCalledTimes(1);
    expect(Sentry.captureMessage.mock.calls[0][0]).toContain(String(MAX_APPROVAL_ATTEMPTS));
  });

  it('approvalAttempts zaten MAX_APPROVAL_ATTEMPTS\'e ulaşmışsa bir daha denemez, Sentry\'ye tekrar bildirmez', async () => {
    const pkg = makePackage({ id: 1, iyzicoPaymentTransactionId: 'tx-1', approvalAttempts: MAX_APPROVAL_ATTEMPTS });
    OrderPackage.findAll.mockResolvedValue([pkg]);

    const result = await approveOrderPackages(100);

    expect(iyzicoService.approvePaymentTransaction).not.toHaveBeenCalled();
    expect(Sentry.captureMessage).not.toHaveBeenCalled();
    expect(result).toBe(false);
  });

  it('bir OrderPackage\'ın approve\'u başarısız olsa bile diğer OrderPackage\'lar için deneme devam eder (bağımsız)', async () => {
    const pkg1 = makePackage({ id: 1, iyzicoPaymentTransactionId: 'tx-1' });
    const pkg2 = makePackage({ id: 2, iyzicoPaymentTransactionId: 'tx-2' });
    OrderPackage.findAll.mockResolvedValue([pkg1, pkg2]);
    iyzicoService.approvePaymentTransaction
      .mockRejectedValueOnce(new Error('ilk hata'))
      .mockResolvedValueOnce({ status: 'success' });

    const result = await approveOrderPackages(100);

    expect(iyzicoService.approvePaymentTransaction).toHaveBeenCalledTimes(2);
    expect(pkg1.iyzicoApprovedAt).toBeNull();
    expect(pkg2.iyzicoApprovedAt).toBeInstanceOf(Date);
    expect(result).toBe(false); // pkg1 hâlâ approve edilmedi
  });
});