jest.mock('../../models', () => ({
  Package: { findByPk: jest.fn(), findAll: jest.fn() },
  PackageProduct: {},
  ShopProduct: {},
  PackageUnit: { findAll: jest.fn() },
  sequelize: {},
}));

const { Package, PackageUnit } = require('../../models');
const packageService = require('../../services/packageService');

describe('packageService', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('getPackageById', () => {
    it('paket bulunamazsa AppError(404) fırlatır', async () => {
      Package.findByPk.mockResolvedValue(null);

      await expect(packageService.getPackageById(999)).rejects.toMatchObject({ statusCode: 404 });
    });

    it('bulunan paketin ürünlerini düz bir listeye çevirir', async () => {
      Package.findByPk.mockResolvedValue({
        id: 1,
        toJSON: () => ({ id: 1, name: 'Paket' }),
        PackageProducts: [
          { quantity: 2, ShopProduct: { name: 'Elma', imageUrl: 'x', expiryDate: '2026-01-01', price: 5 } },
        ],
      });

      const result = await packageService.getPackageById(1);

      expect(result.products).toEqual([
        { name: 'Elma', imageUrl: 'x', quantity: 2, expiryDate: '2026-01-01', price: 5 },
      ]);
    });
  });

  describe('getShopPackages — stok filtresi', () => {
    it('hiç paket yoksa boş array döner', async () => {
      Package.findAll.mockResolvedValue([]);

      const result = await packageService.getShopPackages(7);

      expect(result).toEqual([]);
      expect(PackageUnit.findAll).not.toHaveBeenCalled();
    });

    it('stoğu (quantity) 0 olan paketleri sonuçtan çıkarır', async () => {
      Package.findAll.mockResolvedValue([
        { id: 1, toJSON: () => ({ id: 1 }), PackageProducts: [] },
        { id: 2, toJSON: () => ({ id: 2 }), PackageProducts: [] },
      ]);
      // sadece paket 1 için stok kaydı var, paket 2'nin hiç satılmamış ünitesi yok
      PackageUnit.findAll.mockResolvedValue([{ packageId: 1, remaining: 5 }]);

      const result = await packageService.getShopPackages(7);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(1);
      expect(result[0].quantity).toBe(5);
    });
  });
});