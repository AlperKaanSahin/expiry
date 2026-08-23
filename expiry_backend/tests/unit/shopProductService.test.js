jest.mock('../../models', () => ({
  ShopProduct: {
    findAll: jest.fn(),
    findAndCountAll: jest.fn(),
    create: jest.fn(),
    findOne: jest.fn(),
  },
  Shop: { findOne: jest.fn() },
}));

const { ShopProduct, Shop } = require('../../models');
const shopProductService = require('../../services/shopProductService');

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

    await shopProductService.createProduct(42, { name: 'Elma', price: 5, quantity: 10, expiryDate: '2026-01-01' });

    expect(ShopProduct.create).toHaveBeenCalledWith({
      name: 'Elma', price: 5, quantity: 10, expiryDate: '2026-01-01', shopId: 7,
    });
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

    await shopProductService.updateProduct(42, 5, { name: 'Yeni', price: 20, quantity: 3, expiryDate: '2026-02-01' });

    expect(mockProduct.update).toHaveBeenCalledWith({
      name: 'Yeni', price: 20, quantity: 3, expiryDate: '2026-02-01',
    });
  });

  it('deleteProduct: başka bir market\'in ürününü silmeye çalışırsa AppError(404) fırlatır', async () => {
    Shop.findOne.mockResolvedValue({ id: 7, ownerId: 42 });
    ShopProduct.findOne.mockResolvedValue(null);

    await expect(shopProductService.deleteProduct(42, 99)).rejects.toMatchObject({ statusCode: 404 });
  });

  it('deleteProduct: kendi ürününü siler', async () => {
    Shop.findOne.mockResolvedValue({ id: 7, ownerId: 42 });
    const mockProduct = { id: 5, destroy: jest.fn().mockResolvedValue(true) };
    ShopProduct.findOne.mockResolvedValue(mockProduct);

    const result = await shopProductService.deleteProduct(42, 5);

    expect(mockProduct.destroy).toHaveBeenCalled();
    expect(result).toBe(true);
  });
});