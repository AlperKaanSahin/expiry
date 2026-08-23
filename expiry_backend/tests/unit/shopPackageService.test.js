jest.mock('../../models', () => ({
  Package: { findAll: jest.fn(), create: jest.fn(), findOne: jest.fn() },
  Shop: { findOne: jest.fn() },
  PackageProduct: { destroy: jest.fn(), create: jest.fn() },
  ShopProduct: { findOne: jest.fn() },
  PackageUnit: { create: jest.fn(), count: jest.fn(), findAll: jest.fn() },
  sequelize: {
    transaction: jest.fn(),
    query: jest.fn(),
  },
}));

const { Shop, PackageProduct, ShopProduct, PackageUnit, Package, sequelize } = require('../../models');
const shopPackageService = require('../../services/shopPackageService');

// Her testte sahte bir transaction objesi kullanacağız
function mockTransaction() {
  const t = { commit: jest.fn().mockResolvedValue(true), rollback: jest.fn().mockResolvedValue(true) };
  sequelize.transaction.mockResolvedValue(t);
  return t;
}

describe('shopPackageService.createPackage — ownership ve stok', () => {
  beforeEach(() => jest.clearAllMocks());

  it('shop bulunamazsa AppError(404) fırlatır', async () => {
    Shop.findOne.mockResolvedValue(null);

    await expect(
      shopPackageService.createPackage(999, { name: 'X', products: [] })
    ).rejects.toMatchObject({ statusCode: 404 });
  });

  it('başka bir market\'in ürününü pakete eklemeye çalışırsa AppError(400) fırlatır ve rollback yapar', async () => {
    const t = mockTransaction();
    Shop.findOne.mockResolvedValue({ id: 7, ownerId: 42 });
    Package.create.mockResolvedValue({ id: 1 });
    PackageUnit.create.mockResolvedValue({});
    ShopProduct.findOne.mockResolvedValue(null); // shopId: 7 filtresiyle bulunamadı, başkasının ürünü

    await expect(
      shopPackageService.createPackage(42, {
        name: 'Paket', price: 10, quantity: 1,
        products: [{ id: 999, quantity: 1, price: 5 }],
      })
    ).rejects.toMatchObject({ statusCode: 400 });

    expect(t.rollback).toHaveBeenCalled();
    expect(t.commit).not.toHaveBeenCalled();
  });

  it('quantity kadar PackageUnit oluşturur', async () => {
    const t = mockTransaction();
    Shop.findOne.mockResolvedValue({ id: 7, ownerId: 42 });
    Package.create.mockResolvedValue({ id: 1 });
    PackageUnit.create.mockResolvedValue({});

    await shopPackageService.createPackage(42, {
      name: 'Paket', price: 10, quantity: 3, products: [],
    });

    expect(PackageUnit.create).toHaveBeenCalledTimes(3);
    expect(t.commit).toHaveBeenCalled();
  });

  it('ürünlerden hesaplanan fiyat, price boşsa kullanılır', async () => {
    const t = mockTransaction();
    Shop.findOne.mockResolvedValue({ id: 7, ownerId: 42 });
    let capturedPackageData;
    Package.create.mockImplementation((data) => {
      capturedPackageData = data;
      return Promise.resolve({ id: 1 });
    });
    PackageUnit.create.mockResolvedValue({});
    ShopProduct.findOne.mockResolvedValue({ id: 1, shopId: 7, quantity: 100, save: jest.fn().mockResolvedValue(true) });

    await shopPackageService.createPackage(42, {
      name: 'Paket',
      quantity: 1,
      products: [{ id: 1, quantity: 2, price: 15 }], // 2 * 15 = 30
    });

    expect(capturedPackageData.price).toBe(30);
  });
});

describe('shopPackageService.updatePackage — ownership', () => {
  beforeEach(() => jest.clearAllMocks());

  it('başka bir market\'in paketini güncellemeye çalışırsa AppError(404) fırlatır', async () => {
    Shop.findOne.mockResolvedValue({ id: 7, ownerId: 42 });
    Package.findOne.mockResolvedValue(null);

    await expect(
      shopPackageService.updatePackage(42, 999, { name: 'Hacklenmiş' })
    ).rejects.toMatchObject({ statusCode: 404 });
  });
});

describe('shopPackageService.deletePackage — ownership', () => {
  beforeEach(() => jest.clearAllMocks());

  it('başka bir market\'in paketini silmeye çalışırsa AppError(404) fırlatır', async () => {
    Shop.findOne.mockResolvedValue({ id: 7, ownerId: 42 });
    Package.findOne.mockResolvedValue(null);

    await expect(shopPackageService.deletePackage(42, 999)).rejects.toMatchObject({ statusCode: 404 });
  });
});