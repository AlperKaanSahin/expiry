jest.mock('../../models', () => ({
  OrderPackage: { findAll: jest.fn() },
  Order: {},
}));
jest.mock('../../handlers/payment.handler', () => ({
  approveOrderPackages: jest.fn(),
  MAX_APPROVAL_ATTEMPTS: 10,
}));
jest.mock('@sentry/node', () => ({
  captureException: jest.fn(),
}));

const { OrderPackage } = require('../../models');
const { approveOrderPackages } = require('../../handlers/payment.handler');
const Sentry = require('@sentry/node');
const { start, stop, runApprovalRetrySweep } = require('../../services/approvalRetryJob');

describe('approvalRetryJob.runApprovalRetrySweep', () => {
  beforeEach(() => jest.clearAllMocks());

  it('approve edilmemiş ve deneme hakkı tükenmemiş her order için approveOrderPackages çağırır', async () => {
    OrderPackage.findAll.mockResolvedValue([{ orderId: 10 }, { orderId: 11 }]);
    approveOrderPackages.mockResolvedValue(true);

    await runApprovalRetrySweep();

    expect(approveOrderPackages).toHaveBeenCalledWith(10);
    expect(approveOrderPackages).toHaveBeenCalledWith(11);
    expect(approveOrderPackages).toHaveBeenCalledTimes(2);
  });

  it('tarama sonucu boşsa hiçbir şey yapmadan biter', async () => {
    OrderPackage.findAll.mockResolvedValue([]);

    await runApprovalRetrySweep();

    expect(approveOrderPackages).not.toHaveBeenCalled();
  });

  it('bir order için approveOrderPackages hata fırlatırsa diğer order\'lar için deneme devam eder, Sentry\'ye bildirir', async () => {
    OrderPackage.findAll.mockResolvedValue([{ orderId: 10 }, { orderId: 11 }]);
    approveOrderPackages
      .mockRejectedValueOnce(new Error('iyzico zaman aşımı'))
      .mockResolvedValueOnce(true);

    await runApprovalRetrySweep();

    expect(approveOrderPackages).toHaveBeenCalledTimes(2);
    expect(Sentry.captureException).toHaveBeenCalledTimes(1);
  });

  it('bir tur hâlâ çalışırken eşzamanlı ikinci çağrı overlap guard tarafından atlanır', async () => {
    OrderPackage.findAll.mockResolvedValue([{ orderId: 10 }]);
    approveOrderPackages.mockResolvedValue(true);

    const firstSweep = runApprovalRetrySweep();
    const secondSweep = runApprovalRetrySweep(); // isRunning bayrağı ilk çağrıda senkron set edildiği için bu atlanır

    await Promise.all([firstSweep, secondSweep]);

    expect(approveOrderPackages).toHaveBeenCalledTimes(1);
  });

  it('tarama sorgusu (OrderPackage.findAll) hata fırlatırsa Sentry\'ye bildirir, exception dışarı taşmaz', async () => {
    OrderPackage.findAll.mockRejectedValue(new Error('DB bağlantı hatası'));

    await expect(runApprovalRetrySweep()).resolves.toBeUndefined();

    expect(Sentry.captureException).toHaveBeenCalledTimes(1);
    expect(approveOrderPackages).not.toHaveBeenCalled();
  });
});

describe('approvalRetryJob.start / stop', () => {
  const originalNodeEnv = process.env.NODE_ENV;

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
    stop();
  });

  it('NODE_ENV=test iken hiç setInterval başlatmaz', () => {
    process.env.NODE_ENV = 'test';
    const spy = jest.spyOn(global, 'setInterval');

    start();

    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });

  it('NODE_ENV production iken setInterval başlatır, ikinci start() çağrısı yeni bir interval açmaz', () => {
    process.env.NODE_ENV = 'production';
    const spy = jest.spyOn(global, 'setInterval');

    start();
    start();

    expect(spy).toHaveBeenCalledTimes(1);
    spy.mockRestore();
  });
});