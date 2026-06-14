const { Package, PackageProduct, ShopProduct, PackageUnit } = require('../models');

exports.getPackageById = async (id) => {
  const pkg = await Package.findByPk(id, {
    include: [{
      model: PackageProduct,
      include: [{ model: ShopProduct }]
    }]
  });

  if (!pkg) throw new Error('Kutu bulunamadı');

  const products = pkg.PackageProducts.map(pp => ({
    name: pp.ShopProduct.name,
    imageUrl: pp.ShopProduct.imageUrl,
    quantity: pp.quantity,
    expiryDate: pp.ShopProduct.expiryDate,
    price: pp.ShopProduct.price
  }));

  return { ...pkg.toJSON(), products };
};

exports.getShopPackages = async (shopId) => {
  return await Package.findAll({
    where: { shopId },
    include: [{
      model: PackageProduct,
      include: [{ model: ShopProduct }]
    }]
  });
};