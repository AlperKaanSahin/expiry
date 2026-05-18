// packageController.js
const { Package, PackageProduct, ShopProduct } = require('../models');

module.exports = {
  async getById(req, res) {
    try {
      const pkg = await Package.findByPk(req.params.id, {
        include: [{
          model: PackageProduct,
          include: [{ model: ShopProduct }]
        }]
      });
      if (!pkg) return res.status(404).json({ error: 'Kutu bulunamadı' });

      // Paket içindeki ürünleri sadeleştir
      const products = pkg.PackageProducts.map(pp => ({
        name: pp.ShopProduct.name,
        imageUrl: pp.ShopProduct.imageUrl,
        quantity: pp.quantity,
        expiryDate: pp.ShopProduct.expiryDate,
        price: pp.ShopProduct.price
      }));

      return res.json({
        ...pkg.toJSON(),
        products
      });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  },
    async fetchShopPackages(req, res) {
    const { shopId } = req.params;
    const packages = await Package.findAll({
      where: { shopId, isSold: 0 },
      include: [
        {
          model: PackageProduct,
          include: [{ model: ShopProduct }]
        }
      ]
    });
    res.json(packages);
  }
};
