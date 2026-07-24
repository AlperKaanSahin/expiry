const { Op, fn, col } = require('sequelize');
const {
  sequelize,
  Package,
  PackageProduct,
  ShopProduct,
  PackageUnit,
} = require('../models');

exports.getPackageById = async (id) => {
  const pkg = await Package.findByPk(id, {
    include: [
      {
        model: PackageProduct,
        include: [{ model: ShopProduct }],
      },
    ],
  });

  if (!pkg) {
    throw new Error('Kutu bulunamadı');
  }

  const products = pkg.PackageProducts.map(pp => ({
    name: pp.ShopProduct.name,
    imageUrl: pp.ShopProduct.imageUrl,
    quantity: pp.quantity,
    expiryDate: pp.ShopProduct.expiryDate,
    price: pp.ShopProduct.price,
  }));

  return {
    ...pkg.toJSON(),
    products,
  };
};

exports.getShopPackages = async (shopId) => {
  const packages = await Package.findAll({
    where: { shopId },
    include: [
      {
        model: PackageProduct,
        include: [{ model: ShopProduct }],
      },
    ],
  });

  if (packages.length === 0) {
    return [];
  }

  const packageIds = packages.map(pkg => pkg.id);

  const packageCounts = await PackageUnit.findAll({
    attributes: [
      'packageId',
      [fn('COUNT', col('id')), 'remaining'],
    ],
    where: {
      packageId: {
        [Op.in]: packageIds,
      },
      isSold: false,
    },
    group: ['packageId'],
    raw: true,
  });

  const counts = new Map(
    packageCounts.map(item => [
      item.packageId,
      Number(item.remaining),
    ])
  );

  return packages
    .map(pkg => ({
      ...pkg.toJSON(),
      quantity: counts.get(pkg.id) ?? 0,
    }))
    .filter(pkg => pkg.quantity > 0);
};