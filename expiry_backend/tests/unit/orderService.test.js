jest.mock('../../models', () => ({
  OrderPackage: { findAll: jest.fn() },
  PackageUnit: { findAll: jest.fn(), count: jest.fn() },
  Package: { update: jest.fn() },
  Order: {},
  Shop: {},
  User: {},
  sequelize: {},
}));

const { OrderPackage, PackageUnit, Package } = require('../../models');
const { reserveStock } = require('../../services/orderService');
const AppError = require('../../utils/AppError');

describe('reserveStock', () => {
  const fakeTransaction = { LOCK: { UPDATE: 'UPDATE' } };
  const fakeOrder = { id: 1 };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('stok yeterliyse üniteleri isSold=true yapıp Package.quantity günceller', async () => {
    OrderPackage.findAll.mockResolvedValue([{ packageId: 10, quantity: 2 }]);

    const mockUnit1 = { id: 100, isSold: false, save: jest.fn().mockResolvedValue(true) };
    const mockUnit2 = { id: 101, isSold: false, save: jest.fn().mockResolvedValue(true) };
    PackageUnit.findAll.mockResolvedValue([mockUnit1, mockUnit2]);
    PackageUnit.count.mockResolvedValue(5); // rezervasyon sonrası kalan

    await reserveStock(fakeOrder, fakeTransaction);

    expect(mockUnit1.isSold).toBe(true);
    expect(mockUnit1.save).toHaveBeenCalledWith({ transaction: fakeTransaction });
    expect(mockUnit2.isSold).toBe(true);
    expect(Package.update).toHaveBeenCalledWith(
      { quantity: 5 },
      { where: { id: 10 }, transaction: fakeTransaction }
    );
  });

  it('stok yetersizse AppError(409) fırlatır ve hiçbir üniteyi güncellemez', async () => {
    OrderPackage.findAll.mockResolvedValue([{ packageId: 10, quantity: 3 }]);

    const mockUnit1 = { id: 100, isSold: false, save: jest.fn() };
    // sadece 1 ünite dönüyor, istenen 3
    PackageUnit.findAll.mockResolvedValue([mockUnit1]);

    await expect(reserveStock(fakeOrder, fakeTransaction)).rejects.toThrow(AppError);
    await expect(reserveStock(fakeOrder, fakeTransaction)).rejects.toMatchObject({
      statusCode: 409,
    });

    expect(mockUnit1.save).not.toHaveBeenCalled();
    expect(Package.update).not.toHaveBeenCalled();
  });

  it('PackageUnit.findAll çağrısına doğru lock ve order parametrelerini geçirir (race condition koruması)', async () => {
    OrderPackage.findAll.mockResolvedValue([{ packageId: 10, quantity: 1 }]);
    PackageUnit.findAll.mockResolvedValue([{ id: 100, isSold: false, save: jest.fn() }]);
    PackageUnit.count.mockResolvedValue(0);

    await reserveStock(fakeOrder, fakeTransaction);

    expect(PackageUnit.findAll).toHaveBeenCalledWith(
      expect.objectContaining({
        lock: 'UPDATE',
        order: [['id', 'ASC']],
      })
    );
  });
});