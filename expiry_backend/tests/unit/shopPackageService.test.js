jest.mock('../../models', () => ({
  Package: { findAll: jest.fn(), create: jest.fn(), findOne: jest.fn() },
  Shop: { findOne: jest.fn() },
  PackageProduct: { destroy: jest.fn(), create: jest.fn() },
  ShopProduct: { findOne: jest.fn(), create: jest.fn() },
  PackageUnit: { bulkCreate: jest.fn(), count: jest.fn(), findAll: jest.fn() },
  sequelize: {
    transaction: jest.fn(),
    query: jest.fn(),
  },
}));

const { Shop, PackageProduct, ShopProduct, PackageUnit, Package, sequelize } = require('../../models');
const shopPackageService = require('../../services/shopPackageService');

// Her testte sahte bir transaction objesi kullanacağız. LOCK, resolveProductEntry
// içinde var olan ürünü kilitlerken (`lock: t.LOCK.UPDATE`) kullanılıyor — mock'ta
// bulunmazsa "Cannot read properties of undefined (reading 'UPDATE')" ile patlar.
function mockTransaction() {
  const t = {
    commit: jest.fn().mockResolvedValue(true),
    rollback: jest.fn().mockResolvedValue(true),
    LOCK: { UPDATE: 'UPDATE' },
  };
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

  it('products boş/eksikse AppError(400) fırlatır (transaction hiç açılmaz)', async () => {
    Shop.findOne.mockResolvedValue({ id: 7, ownerId: 42 });

    await expect(
      shopPackageService.createPackage(42, { name: 'X', quantity: 1, products: [] })
    ).rejects.toMatchObject({ statusCode: 400 });

    expect(sequelize.transaction).not.toHaveBeenCalled();
  });

  it('başka bir market\'in ürününü pakete eklemeye çalışırsa AppError(400) fırlatır ve rollback yapar', async () => {
    const t = mockTransaction();
    Shop.findOne.mockResolvedValue({ id: 7, ownerId: 42 });
    Package.create.mockResolvedValue({ id: 1 });
    PackageUnit.bulkCreate.mockResolvedValue([]);
    ShopProduct.findOne.mockResolvedValue(null); // shopId: 7 filtresiyle bulunamadı, başkasının ürünü

    await expect(
      shopPackageService.createPackage(42, {
        name: 'Paket', price: 10, quantity: 1,
        products: [{ id: 999, quantity: 1, price: 5 }],
      })
    ).rejects.toMatchObject({ statusCode: 400 });

    expect(t.rollback).toHaveBeenCalled();
    expect(t.commit).not.toHaveBeenCalled();
    expect(Package.create).not.toHaveBeenCalled();
  });

  it('quantity kadar PackageUnit tek bulkCreate çağrısıyla oluşturur', async () => {
    const t = mockTransaction();
    Shop.findOne.mockResolvedValue({ id: 7, ownerId: 42 });
    Package.create.mockResolvedValue({ id: 1 });
    PackageUnit.bulkCreate.mockResolvedValue([]);
    ShopProduct.findOne.mockResolvedValue({
      id: 1, shopId: 7, name: 'Elma', quantity: 100, price: 5,
      save: jest.fn().mockResolvedValue(true),
    });

    await shopPackageService.createPackage(42, {
      name: 'Paket', price: 10, quantity: 3,
      products: [{ id: 1, quantity: 1, price: 5 }],
    });

    expect(PackageUnit.bulkCreate).toHaveBeenCalledTimes(1);
    const [rows] = PackageUnit.bulkCreate.mock.calls[0];
    expect(rows).toHaveLength(3);
    expect(rows.every(r => r.packageId === 1 && r.isSold === false)).toBe(true);
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
    PackageUnit.bulkCreate.mockResolvedValue([]);
    ShopProduct.findOne.mockResolvedValue({
      id: 1, shopId: 7, name: 'Elma', quantity: 100,
      save: jest.fn().mockResolvedValue(true),
    });

    await shopPackageService.createPackage(42, {
      name: 'Paket',
      quantity: 1,
      products: [{ id: 1, quantity: 2, price: 15 }], // 2 * 15 = 30
    });

    expect(capturedPackageData.price).toBe(30);
  });

  it('var olan ürün için stok doğru miktarda düşülür (unitCount * perPackageQty)', async () => {
    const t = mockTransaction();
    Shop.findOne.mockResolvedValue({ id: 7, ownerId: 42 });
    Package.create.mockResolvedValue({ id: 1 });
    PackageUnit.bulkCreate.mockResolvedValue([]);
    const existingProduct = {
      id: 1, shopId: 7, name: 'Elma', quantity: 100,
      save: jest.fn().mockResolvedValue(true),
    };
    ShopProduct.findOne.mockResolvedValue(existingProduct);

    // unitCount: 4 kutu, her kutuda 2 adet elma -> toplam 8 düşülmeli
    await shopPackageService.createPackage(42, {
      name: 'Paket', price: 10, quantity: 4,
      products: [{ id: 1, quantity: 2, price: 5 }],
    });

    expect(existingProduct.quantity).toBe(92); // 100 - 8
    expect(existingProduct.save).toHaveBeenCalledTimes(1);
  });

  it('var olan ürün seçilirken kilit (FOR UPDATE) ile sorgulanır', async () => {
    mockTransaction();
    Shop.findOne.mockResolvedValue({ id: 7, ownerId: 42 });
    Package.create.mockResolvedValue({ id: 1 });
    PackageUnit.bulkCreate.mockResolvedValue([]);
    ShopProduct.findOne.mockResolvedValue({
      id: 1, shopId: 7, name: 'Elma', quantity: 100,
      save: jest.fn().mockResolvedValue(true),
    });

    await shopPackageService.createPackage(42, {
      name: 'Paket', quantity: 1,
      products: [{ id: 1, quantity: 1, price: 5 }],
    });

    expect(ShopProduct.findOne).toHaveBeenCalledWith(
      expect.objectContaining({ lock: 'UPDATE' })
    );
  });

  describe('newProduct — pakete direkt yeni ürün ekleme', () => {
    it('yeni ürün SKT olmadan gönderilirse AppError(400) fırlatır ve rollback yapar, ShopProduct.create çağrılmaz', async () => {
      const t = mockTransaction();
      Shop.findOne.mockResolvedValue({ id: 7, ownerId: 42 });

      await expect(
        shopPackageService.createPackage(42, {
          name: 'Paket', quantity: 1,
          products: [{ newProduct: { name: 'Taze Ekmek', price: 20 }, quantity: 1 }],
        })
      ).rejects.toMatchObject({ statusCode: 400 });

      expect(t.rollback).toHaveBeenCalled();
      expect(Package.create).not.toHaveBeenCalled();
    });

    it('yeni ürünün stoğu unitCount * perPackageQty olarak hesaplanır, ikinci kez düşülmez', async () => {
      const t = mockTransaction();
      Shop.findOne.mockResolvedValue({ id: 7, ownerId: 42 });

      let capturedProductCreateData;
      const createdProduct = { id: 55, name: 'Taze Ekmek', price: 20 };
      ShopProduct.create.mockImplementation((data) => {
        capturedProductCreateData = data;
        return Promise.resolve(createdProduct);
      });

      Package.create.mockResolvedValue({ id: 1 });
      PackageUnit.bulkCreate.mockResolvedValue([]);

      // unitCount: 2 kutu, pakette 3 ekmek -> stok = 2 * 3 = 6
      await shopPackageService.createPackage(42, {
        name: 'Paket', quantity: 2,
        products: [{
          newProduct: { name: 'Taze Ekmek', price: 20, expiryDate: '2027-01-01' },
          quantity: 3,
        }],
      });

      expect(capturedProductCreateData.quantity).toBe(6);
      expect(capturedProductCreateData.expiryDate).toBe('2027-01-01');
      // Var olan ürün path'indeki gibi ayrıca stoktan düşülmemeli — createdProduct
      // objesinde save() hiç yok, çağrılmaya çalışılsaydı test zaten patlardı.
      expect(t.commit).toHaveBeenCalled();
    });

    it('name boş bırakılırsa yeni ürünün adından otomatik paket adı üretilir', async () => {
      mockTransaction();
      Shop.findOne.mockResolvedValue({ id: 7, ownerId: 42 });
      ShopProduct.create.mockResolvedValue({ id: 55, name: 'Taze Ekmek', price: 20 });

      let capturedPackageData;
      Package.create.mockImplementation((data) => {
        capturedPackageData = data;
        return Promise.resolve({ id: 1 });
      });
      PackageUnit.bulkCreate.mockResolvedValue([]);

      await shopPackageService.createPackage(42, {
        quantity: 1,
        products: [{
          newProduct: { name: 'Taze Ekmek', price: 20, expiryDate: '2027-01-01' },
          quantity: 1,
        }],
      });

      expect(capturedPackageData.name).toBe('Taze Ekmek');
    });

    it('3 ve üzeri üründe otomatik isim "X, Y ve N ürün daha" formatında üretilir', async () => {
      mockTransaction();
      Shop.findOne.mockResolvedValue({ id: 7, ownerId: 42 });

      ShopProduct.findOne.mockImplementation(({ where }) => {
        const names = { 1: 'Ekmek', 2: 'Simit' };
        return Promise.resolve({
          id: where.id, shopId: 7, name: names[where.id], quantity: 100,
          save: jest.fn().mockResolvedValue(true),
        });
      });
      ShopProduct.create.mockResolvedValue({ id: 3, name: 'Poğaça', price: 10 });

      let capturedPackageData;
      Package.create.mockImplementation((data) => {
        capturedPackageData = data;
        return Promise.resolve({ id: 1 });
      });
      PackageUnit.bulkCreate.mockResolvedValue([]);

      await shopPackageService.createPackage(42, {
        quantity: 1,
        products: [
          { id: 1, quantity: 1, price: 5 },
          { id: 2, quantity: 1, price: 5 },
          { newProduct: { name: 'Poğaça', price: 10, expiryDate: '2027-01-01' }, quantity: 1 },
        ],
      });

      expect(capturedPackageData.name).toBe('Ekmek, Simit ve 1 ürün daha');
    });
  });
});

describe('shopPackageService.updatePackage — ownership ve isim davranışı', () => {
  beforeEach(() => jest.clearAllMocks());

  it('başka bir market\'in paketini güncellemeye çalışırsa AppError(404) fırlatır', async () => {
    Shop.findOne.mockResolvedValue({ id: 7, ownerId: 42 });
    Package.findOne.mockResolvedValue(null);

    await expect(
      shopPackageService.updatePackage(42, 999, { name: 'Hacklenmiş' })
    ).rejects.toMatchObject({ statusCode: 404 });
  });

  it('products gönderilip name boşsa otomatik isim üretilir', async () => {
    mockTransaction();
    Shop.findOne.mockResolvedValue({ id: 7, ownerId: 42 });

    const pkg = {
      id: 1, name: 'Eski Ad',
      update: jest.fn().mockResolvedValue(true),
    };
    Package.findOne.mockResolvedValue(pkg);
    ShopProduct.findOne.mockResolvedValue({
      id: 1, shopId: 7, name: 'Simit', quantity: 100,
      save: jest.fn().mockResolvedValue(true),
    });
    PackageUnit.count.mockResolvedValue(1);
    PackageUnit.bulkCreate.mockResolvedValue([]);

    await shopPackageService.updatePackage(42, 1, {
      name: '', quantity: 1,
      products: [{ id: 1, quantity: 1, price: 5 }],
    });

    // pkg.update iki kez çağrılıyor: önce ana alanlarla, sonda sadece quantity
    // (remainingUnits) ile — isim bilgisini taşıyan ilk çağrıyı kontrol ediyoruz.
    expect(pkg.update.mock.calls[0][0].name).toBe('Simit');
  });

  it('products gönderilmeyip name boşsa mevcut isim korunur', async () => {
    mockTransaction();
    Shop.findOne.mockResolvedValue({ id: 7, ownerId: 42 });

    const pkg = {
      id: 1, name: 'Korunması Gereken Ad',
      update: jest.fn().mockResolvedValue(true),
    };
    Package.findOne.mockResolvedValue(pkg);
    PackageUnit.count.mockResolvedValue(1);
    PackageUnit.bulkCreate.mockResolvedValue([]);

    await shopPackageService.updatePackage(42, 1, {
      name: '', quantity: 1,
    });

    expect(pkg.update.mock.calls[0][0].name).toBe('Korunması Gereken Ad');
  });

  it('newProduct ile ürün güncellemede eklenirse doğru quantity ile ShopProduct oluşturulur', async () => {
    mockTransaction();
    Shop.findOne.mockResolvedValue({ id: 7, ownerId: 42 });

    const pkg = { id: 1, name: 'Paket', update: jest.fn().mockResolvedValue(true) };
    Package.findOne.mockResolvedValue(pkg);

    let capturedProductCreateData;
    ShopProduct.create.mockImplementation((data) => {
      capturedProductCreateData = data;
      return Promise.resolve({ id: 99, name: 'Yeni Ürün', price: 12 });
    });
    PackageUnit.count.mockResolvedValue(2);
    PackageUnit.bulkCreate.mockResolvedValue([]);

    await shopPackageService.updatePackage(42, 1, {
      quantity: 2,
      products: [{
        newProduct: { name: 'Yeni Ürün', price: 12, expiryDate: '2027-01-01' },
        quantity: 5,
      }],
    });

    expect(capturedProductCreateData.quantity).toBe(10); // 2 * 5
    expect(PackageProduct.create).toHaveBeenCalledWith(
      expect.objectContaining({ shopProductId: 99, quantity: 5, price: 12 }),
      expect.anything()
    );
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