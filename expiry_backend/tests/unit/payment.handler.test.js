jest.mock('../../models', () => ({
  OrderPackage: { findAll: jest.fn() },
}));
jest.mock('../../services/iyzicoService', () => ({
  approvePaymentTransaction: jest.fn(),
}));

const { OrderPackage } = require('../../models');
const iyzicoService = require('../../services/iyzicoService');
const eventBus = require('../../events/eventBus');
const ORDER_EVENTS = require('../../events/order.events');

// Listener'ı register etmek için — bu satır olmadan eventBus.emit hiçbir şeyi tetiklemez.
require('../../handlers/payment.handler');

// eventBus.emit senkron ama listener async — içindeki await'lerin tamamlanmasını
// beklemek için microtask kuyruğunu birkaç tur boşaltıyoruz.
const flush = async () => {
  await new Promise((resolve) => setImmediate(resolve));
  await new Promise((resolve) => setImmediate(resolve));
};

describe('payment.handler — ORDER_EVENTS.CONFIRMED', () => {
  beforeEach(() => jest.clearAllMocks());

  it('confirmed event geldiğinde her OrderPackage için approvePaymentTransaction çağırır', async () => {
    OrderPackage.findAll.mockResolvedValue([
      { id: 1, iyzicoPaymentTransactionId: 'tx-1' },
      { id: 2, iyzicoPaymentTransactionId: 'tx-2' },
    ]);
    iyzicoService.approvePaymentTransaction.mockResolvedValue({ status: 'success' });

    eventBus.emit(ORDER_EVENTS.CONFIRMED, { orderId: 99 });
    await flush();

    expect(OrderPackage.findAll).toHaveBeenCalledWith({ where: { orderId: 99 } });
    expect(iyzicoService.approvePaymentTransaction).toHaveBeenCalledWith('tx-1');
    expect(iyzicoService.approvePaymentTransaction).toHaveBeenCalledWith('tx-2');
    expect(iyzicoService.approvePaymentTransaction).toHaveBeenCalledTimes(2);
  });

  it('paymentTransactionId olmayan bir OrderPackage için approve çağırmadan atlar', async () => {
    OrderPackage.findAll.mockResolvedValue([
      { id: 1, iyzicoPaymentTransactionId: null },
    ]);

    eventBus.emit(ORDER_EVENTS.CONFIRMED, { orderId: 100 });
    await flush();

    expect(iyzicoService.approvePaymentTransaction).not.toHaveBeenCalled();
  });

  it('approvePaymentTransaction hata fırlatırsa exception dışarı taşmaz (event listener çökmez)', async () => {
    OrderPackage.findAll.mockResolvedValue([
      { id: 1, iyzicoPaymentTransactionId: 'tx-1' },
    ]);
    iyzicoService.approvePaymentTransaction.mockRejectedValue(new Error('Iyzico hatası'));

    expect(() => eventBus.emit(ORDER_EVENTS.CONFIRMED, { orderId: 101 })).not.toThrow();
    await flush();
  });

  it('bir OrderPackage\'ın approve\'u başarısız olsa bile diğer OrderPackage\'lar için deneme devam eder (bağımsız try/catch)', async () => {
    OrderPackage.findAll.mockResolvedValue([
      { id: 1, iyzicoPaymentTransactionId: 'tx-1' },
      { id: 2, iyzicoPaymentTransactionId: 'tx-2' },
    ]);
    iyzicoService.approvePaymentTransaction
      .mockRejectedValueOnce(new Error('ilk hata'))
      .mockResolvedValueOnce({ status: 'success' });

    eventBus.emit(ORDER_EVENTS.CONFIRMED, { orderId: 102 });
    await flush();

    expect(iyzicoService.approvePaymentTransaction).toHaveBeenCalledTimes(2);
    expect(iyzicoService.approvePaymentTransaction).toHaveBeenNthCalledWith(1, 'tx-1');
    expect(iyzicoService.approvePaymentTransaction).toHaveBeenNthCalledWith(2, 'tx-2');
  });

  it('OrderPackage.findAll hata fırlatırsa exception dışarı taşmaz, approve hiç denenmez', async () => {
    OrderPackage.findAll.mockRejectedValue(new Error('DB bağlantı hatası'));

    expect(() => eventBus.emit(ORDER_EVENTS.CONFIRMED, { orderId: 103 })).not.toThrow();
    await flush();

    expect(iyzicoService.approvePaymentTransaction).not.toHaveBeenCalled();
  });

  it('OrderPackage listesi boşsa hiçbir şey yapmadan sessizce biter', async () => {
    OrderPackage.findAll.mockResolvedValue([]);

    eventBus.emit(ORDER_EVENTS.CONFIRMED, { orderId: 104 });
    await flush();

    expect(iyzicoService.approvePaymentTransaction).not.toHaveBeenCalled();
  });
});