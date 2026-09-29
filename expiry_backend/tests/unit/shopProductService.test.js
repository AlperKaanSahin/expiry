jest.mock('../../models', () => ({
  ShopProduct: {
    findAll: jest.fn(),
    findAndCountAll: jest.fn(),
    create: jest.fn(),
    findOne: jest.fn(),
    count: jest.fn(),
  },
  Shop: { findOne: jest.fn() },
  PackageProduct: { findAll: jest.fn() },
  sequelize: { transaction: jest.fn() },
}));

jest.mock('../../services/shopPackageService', () => ({
  hardDeletePackageIfSafe: jest.fn(),
}));

const { ShopProduct, Shop, PackageProduct, sequelize } = require('../../models');
const { hardDeletePackageIfSafe } = require('../../services/shopPackageService');
const shopProductService = require('../../services/shopProductService');

function mockTransaction() {
  const t = {
    commit: jest.fn().mockResolvedValue(true),
    rollback: jest.fn().mockResolvedValue(true),
  };
  sequelize.transaction.mockResolvedValue(t);
  return t;
}

describe('shopProductService — ownership sınırları', () => {
  beforeEach(() => jest.clearAllMocks());

  it('listAllProducts: shop yoksa boş array döner (hata fırlatmaz)', async () => {
    Shop.findOne.mockResolvedValue(null);

    const result = await shopProductService.listAllProducts(999);

    expect(result).toEqual([]);
    expect(ShopProduct.findAll).not.toHaveBeenCalled();
  });

  it('listAllProducts: sadece kendi shopId\'sine ait ürünleri sorgular', async () => {
    Shop.findOne.mockResolvedValue({ id: 7, ownerId: 42 });
    ShopProduct.findAll.mockResolvedValue([]);

    await shopProductService.listAllProducts(42);

    expect(ShopProduct.findAll).toHaveBeenCalledWith(
      expect.objectContaining({ where: { shopId: 7 } })
    );
  });

  it('createProduct: shop bulunamazsa AppError(404) fırlatır, ürün oluşturmaz', async () => {
    Shop.findOne.mockResolvedValue(null);

    await expect(
      shopProductService.createProduct(999, { name: 'X', price: 10, quantity: 1 })
    ).rejects.toMatchObject({ statusCode: 404 });

    expect(ShopProduct.create).not.toHaveBeenCalled();
  });

  it('createProduct: yeni ürünü doğru shopId ile oluşturur', async () => {
    Shop.findOne.mockResolvedValue({ id: 7, ownerId: 42 });
    ShopProduct.create.mockResolvedValue({ id: 1, name: 'Elma', shopId: 7 });

    await shopProductService.createProduct(42, { name: 'Elma', price: 5, quantity: 10, expiryDate: '2027-01-01' });

    expect(ShopProduct.create).toHaveBeenCalledWith({
      name: 'Elma', price: 5, quantity: 10, expiryDate: '2027-01-01', shopId: 7,
    });
  });

  it('createProduct: son kullanma tarihi geçmişse AppError(400) fırlatır, ürün oluşturmaz', async () => {
    Shop.findOne.mockResolvedValue({ id: 7, ownerId: 42 });

    await expect(
      shopProductService.createProduct(42, { name: 'Bayat', price: 5, quantity: 10, expiryDate: '2020-01-01' })
    ).rejects.toMatchObject({ statusCode: 400 });

    expect(ShopProduct.create).not.toHaveBeenCalled();
  });

  it('updateProduct: başka bir market\'in ürününü güncellemeye çalışırsa AppError(404) fırlatır', async () => {
    // 42 numaralı kullanıcının shop'u 7, ama 99 numaralı ürün başka bir shop'a ait
    Shop.findOne.mockResolvedValue({ id: 7, ownerId: 42 });
    ShopProduct.findOne.mockResolvedValue(null); // shopId: 7 filtresiyle bulunamadı

    await expect(
      shopProductService.updateProduct(42, 99, { name: 'Hacklenmiş İsim' })
    ).rejects.toMatchObject({ statusCode: 404 });

    expect(ShopProduct.findOne).toHaveBeenCalledWith({ where: { id: 99, shopId: 7 } });
  });

  it('updateProduct: kendi ürününü günceller', async () => {
    Shop.findOne.mockResolvedValue({ id: 7, ownerId: 42 });
    const mockProduct = { id: 5, name: 'Eski', update: jest.fn().mockResolvedValue(true) };
    ShopProduct.findOne.mockResolvedValue(mockProduct);

    await shopProductService.updateProduct(42, 5, { name: 'Yeni', price: 20, quantity: 3, expiryDate: '2027-02-01' });

    expect(mockProduct.update).toHaveBeenCalledWith({
      name: 'Yeni', price: 20, quantity: 3, expiryDate: '2027-02-01',
    });
  });

  it('updateProduct: son kullanma tarihi geçmiş bir tarihe ayarlanamaz (400), update çağrılmaz', async () => {
    Shop.findOne.mockResolvedValue({ id: 7, ownerId: 42 });
    const mockProduct = { id: 5, name: 'Eski', update: jest.fn() };
    ShopProduct.findOne.mockResolvedValue(mockProduct);

    await expect(
      shopProductService.updateProduct(42, 5, { name: 'Yeni', expiryDate: '2020-01-01' })
    ).rejects.toMatchObject({ statusCode: 400 });

    expect(mockProduct.update).not.toHaveBeenCalled();
  });

  it('deleteProduct: başka bir market\'in ürününü silmeye çalışırsa AppError(404) fırlatır', async () => {
    Shop.findOne.mockResolvedValue({ id: 7, ownerId: 42 });
    ShopProduct.findOne.mockResolvedValue(null);

    await expect(shopProductService.deleteProduct(42, 99)).rejects.toMatchObject({ statusCode: 404 });
  });

  it('deleteProduct: bu ürünü içeren paket yoksa direkt siler', async () => {
    Shop.findOne.mockResolvedValue({ id: 7, ownerId: 42 });
    const mockProduct = { id: 5, destroy: jest.fn().mockResolvedValue(true) };
    ShopProduct.findOne.mockResolvedValue(mockProduct);
    PackageProduct.findAll.mockResolvedValue([]); // bu ürünü içeren paket yok
    const t = mockTransaction();

    const result = await shopProductService.deleteProduct(42, 5);

    expect(hardDeletePackageIfSafe).not.toHaveBeenCalled();
    expect(mockProduct.destroy).toHaveBeenCalledWith({ transaction: t });
    expect(t.commit).toHaveBeenCalled();
    expect(result).toBe(true);
  });

  it('deleteProduct: ürünü içeren paketleri de siler (cascade), sonra ürünü siler', async () => {
    Shop.findOne.mockResolvedValue({ id: 7, ownerId: 42 });
    const mockProduct = { id: 5, destroy: jest.fn().mockResolvedValue(true) };
    ShopProduct.findOne.mockResolvedValue(mockProduct);
    PackageProduct.findAll.mockResolvedValue([{ packageId: 10 }]);
    hardDeletePackageIfSafe.mockResolvedValue(true);
    const t = mockTransaction();

    const result = await shopProductService.deleteProduct(42, 5);

    expect(hardDeletePackageIfSafe).toHaveBeenCalledWith(10, t);
    expect(mockProduct.destroy).toHaveBeenCalledWith({ transaction: t });
    expect(t.commit).toHaveBeenCalled();
    expect(result).toBe(true);
  });

  it('deleteProduct: paket tamamlanmamış siparişi olduğu için silinemezse AppError(409) fırlatır, rollback yapılır, ürün silinmez', async () => {
    Shop.findOne.mockResolvedValue({ id: 7, ownerId: 42 });
    const mockProduct = { id: 5, destroy: jest.fn() };
    ShopProduct.findOne.mockResolvedValue(mockProduct);
    PackageProduct.findAll.mockResolvedValue([{ packageId: 10 }]);
    hardDeletePackageIfSafe.mockResolvedValue(false); // paket kilitli
    const t = mockTransaction();

    await expect(shopProductService.deleteProduct(42, 5)).rejects.toMatchObject({ statusCode: 409 });

    expect(mockProduct.destroy).not.toHaveBeenCalled();
    expect(t.rollback).toHaveBeenCalled();
    expect(t.commit).not.toHaveBeenCalled();
  });
});