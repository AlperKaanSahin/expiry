jest.mock('../../models', () => ({
  Order: { findOne: jest.fn(), create: jest.fn() },
  OrderPackage: { findAll: jest.fn(), create: jest.fn() },
  PackageUnit: { findAll: jest.fn(), count: jest.fn() },
  Package: { update: jest.fn(), findOne: jest.fn() },
  PackageProduct: { findAll: jest.fn() },
  ShopProduct: {},
  Shop: { findOne: jest.fn(), findByPk: jest.fn() },
  User: { findByPk: jest.fn() },
  sequelize: { transaction: jest.fn() },
}));

jest.mock('../../events/eventBus', () => ({ emit: jest.fn() }));

const { calculatePlatformFee } = require('../../services/orderService');

describe('orderService.calculatePlatformFee', () => {
  it('50 TL\'nin altındaki bir tutar için sabit 10 TL fee döner', () => {
    expect(calculatePlatformFee(30)).toBe(10);
  });

  it('tam 50 TL için hâlâ sabit 10 TL fee döner (sınır dahil, ≤50 kuralı)', () => {
    expect(calculatePlatformFee(50)).toBe(10);
  });

  it('50.01 TL için %20\'lik dilime geçer — yuvarlama sonrası tam 10 TL çıkar (50 TL sınırında sabit dilimle sıçramasız birleşiyor: %20×50=10)', () => {
    expect(calculatePlatformFee(50.01)).toBe(10);
  });

  it('55 TL için %20 fee hesaplar (11 TL) — sandbox test siparişimizle eşleşen senaryo', () => {
    expect(calculatePlatformFee(55)).toBe(11);
  });

  it('100 TL için %20 fee hesaplar (20 TL)', () => {
    expect(calculatePlatformFee(100)).toBe(20);
  });

  it('0 TL için sabit 10 TL fee döner (teorik sınır durumu)', () => {
    expect(calculatePlatformFee(0)).toBe(10);
  });

  it('sonucu her zaman 2 ondalık basamağa yuvarlar (kuruş hassasiyeti)', () => {
    const fee = calculatePlatformFee(33.33);
    const decimals = (String(fee).split('.')[1] || '').length;
    expect(decimals).toBeLessThanOrEqual(2);
  });
});