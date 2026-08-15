const { Package, Shop, PackageProduct, ShopProduct, PackageUnit, sequelize } = require('../models');
const { QueryTypes } = require('sequelize');
const AppError = require('../utils/AppError');

const getShopByUserId = async (userId) => {
  const shop = await Shop.findOne({ where: { ownerId: userId } });
  if (!shop) throw new AppError('Market bulunamadı', 404);
  return shop;
};

exports.listPackages = async (userId, page = 1, limit = 10) => {
  const shop = await Shop.findOne({ where: { ownerId: userId } });
  if (!shop) return { total: 0, page, limit, packages: [] };

  const offset = (page - 1) * limit;

  const unitCounts = await sequelize.query(`
    SELECT pu.packageId, COUNT(pu.id) as remaining
    FROM \`PackageUnits\` pu
    INNER JOIN \`Packages\` p ON p.id = pu.packageId
    WHERE p.shopId = :shopId AND pu.isSold = false
    GROUP BY pu.packageId
    HAVING COUNT(pu.id) > 0
    ORDER BY pu.packageId DESC
    LIMIT :limit OFFSET :offset
  `, {
    replacements: { shopId: shop.id, limit, offset },
    type: QueryTypes.SELECT,
  });

  const [{ total }] = await sequelize.query(`
    SELECT COUNT(*) as total FROM (
      SELECT pu.packageId
      FROM \`PackageUnits\` pu
      INNER JOIN \`Packages\` p ON p.id = pu.packageId
      WHERE p.shopId = :shopId AND pu.isSold = false
      GROUP BY pu.packageId
      HAVING COUNT(pu.id) > 0
    ) as filtered
  `, {
    replacements: { shopId: shop.id },
    type: QueryTypes.SELECT,
  });

  if (unitCounts.length === 0) {
    return { total: Number(total), page, limit, packages: [] };
  }

  const packageIds = unitCounts.map(u => u.packageId);
  const countMap = new Map(unitCounts.map(u => [u.packageId, Number(u.remaining)]));

  const packages = await Package.findAll({
    where: { id: packageIds },
    include: [
      {
        model: PackageProduct,
        include: [{ model: ShopProduct, attributes: ['id', 'name', 'price'] }],
      },
    ],
  });

  const packageMap = new Map(packages.map(pkg => [pkg.id, pkg]));

  const orderedPackages = packageIds
    .map(id => packageMap.get(id))
    .filter(Boolean)
    .map(pkg => {
      const products = (pkg.PackageProducts || [])
        .filter(pp => pp && pp.ShopProduct)
        .map(pp => ({
          id: pp.ShopProduct.id,
          name: pp.ShopProduct.name,
          price: pp.ShopProduct.price,
          quantity: pp.quantity,
        }));

      const totalPrice = products.reduce((sum, p) => sum + p.price * p.quantity, 0);

      return {
        id: pkg.id,
        name: pkg.name,
        price: pkg.price,
        description: pkg.description,
        deliveryStart: pkg.deliveryStart,
        deliveryEnd: pkg.deliveryEnd,
        products,
        totalPrice,
        autoPriceDropEnabled: pkg.autoPriceDropEnabled ?? false,
        priceDropInterval: pkg.priceDropInterval ?? '',
        priceDropAmount: pkg.priceDropAmount ?? '',
        minPriceDropLimit: pkg.minPriceDropLimit ?? '',
        quantity: countMap.get(pkg.id) || 0,
      };
    });

  return { total: Number(total), page, limit, packages: orderedPackages };
};

exports.createPackage = async (userId, data) => {
  const shop = await getShopByUserId(userId);

  const { name, description, price, products, deliveryStart, deliveryEnd,
    autoPriceDropEnabled, priceDropAmount, priceDropInterval, minPriceDropLimit, quantity } = data;

  let calculatedPrice = 0;
  if (Array.isArray(products)) {
    for (const p of products) {
      const price = Number(p.price) || 0;
      const qty = Number(p.quantity) || 0;
      calculatedPrice += price * qty;
    }
  }

  const finalPrice =
    price !== undefined &&
    price !== null &&
    String(price).trim() !== '' &&
    !isNaN(Number(price))
      ? Number(price)
      : calculatedPrice;

  if (isNaN(finalPrice)) {
    throw new AppError('Price hesaplanamadı (NaN)', 400);
  }

  const t = await sequelize.transaction();
  try {
    const newPackage = await Package.create({
      name, description, price: finalPrice, shopId: shop.id,
      deliveryStart, deliveryEnd, autoPriceDropEnabled,
      priceDropAmount, priceDropInterval, minPriceDropLimit, quantity
    }, { transaction: t });

    const unitCount = Number(quantity) || 1;
    for (let i = 0; i < unitCount; i++) {
      await PackageUnit.create({ packageId: newPackage.id, isSold: false }, { transaction: t });
    }

    if (Array.isArray(products)) {
      for (const p of products) {
        const product = await ShopProduct.findOne({
          where: { id: p.id, shopId: shop.id },
          transaction: t
        });
        if (!product) throw new AppError(`Geçersiz ürün: ${p.id}`, 400);

        await PackageProduct.create({
          packageId: newPackage.id,
          shopProductId: p.id,
          quantity: p.quantity,
          price: p.price
        }, { transaction: t });

        const totalDeduct = unitCount * (Number(p.quantity) || 1);
        product.quantity = Math.max(0, (product.quantity || 0) - totalDeduct);
        await product.save({ transaction: t });
      }
    }

    await t.commit();
    return newPackage;
  } catch (err) {
    await t.rollback();
    throw err;
  }
};

exports.updatePackage = async (userId, packageId, data) => {
  const shop = await getShopByUserId(userId);
  const { name, description, price, products, deliveryStart, deliveryEnd,
    autoPriceDropEnabled, priceDropAmount, priceDropInterval, minPriceDropLimit, quantity } = data;

  const pkg = await Package.findOne({ where: { id: packageId, shopId: shop.id } });
  if (!pkg) throw new AppError('Paket bulunamadı', 404);

  let calculatedPrice = 0;
  if (Array.isArray(products)) {
    calculatedPrice = products.reduce((sum, p) => sum + Number(p.price) * Number(p.quantity), 0);
  }
  const finalPrice = price !== undefined && price !== null && price !== '' ? Number(price) : calculatedPrice;

  await pkg.update({
    name, description, price: finalPrice, deliveryStart, deliveryEnd,
    autoPriceDropEnabled, priceDropAmount, priceDropInterval, minPriceDropLimit, quantity
  });

  if (Array.isArray(products)) {
    await PackageProduct.destroy({ where: { packageId: pkg.id } });
    for (const p of products) {
      const product = await ShopProduct.findOne({ where: { id: p.id, shopId: shop.id } });
      if (!product) throw new AppError(`Geçersiz ürün: ${p.id}`, 400);

      await PackageProduct.create({
        packageId: pkg.id,
        shopProductId: p.id,
        quantity: p.quantity,
        price: p.price
      });
    }
  }

  const currentCount = await PackageUnit.count({ where: { packageId: pkg.id } });
  if (quantity > currentCount) {
    for (let i = 0; i < quantity - currentCount; i++) {
      await PackageUnit.create({ packageId: pkg.id, isSold: false });
    }
  } else if (quantity < currentCount) {
    const unitsToDelete = await PackageUnit.findAll({
      where: { packageId: pkg.id, isSold: false },
      order: [['id', 'DESC']],
      limit: currentCount - quantity
    });
    for (const unit of unitsToDelete) await unit.destroy();
  }

  const remainingUnits = await PackageUnit.count({ where: { packageId: pkg.id, isSold: false } });
  await pkg.update({ quantity: remainingUnits });

  return pkg;
};

exports.deletePackage = async (userId, packageId, count) => {
  const shop = await getShopByUserId(userId);

  const pkg = await Package.findOne({ where: { id: packageId, shopId: shop.id } });
  if (!pkg) throw new AppError('Paket bulunamadı', 404);

  const remainingUnits = await PackageUnit.count({ where: { packageId: pkg.id, isSold: false } });

  if (remainingUnits <= 1 || !count) {
    const t = await sequelize.transaction();
    try {
      await PackageProduct.destroy({ where: { packageId: pkg.id }, transaction: t });
      await PackageUnit.destroy({ where: { packageId: pkg.id }, transaction: t });
      await Package.destroy({ where: { id: pkg.id }, transaction: t });
      await t.commit();
      return { deletedAll: true };
    } catch (err) {
      await t.rollback();
      throw err;
    }
  }

  const unitsToDelete = await PackageUnit.findAll({
    where: { packageId: pkg.id, isSold: false },
    order: [['id', 'DESC']],
    limit: Number(count)
  });
  for (const unit of unitsToDelete) await unit.destroy();

  const newQuantity = await PackageUnit.count({ where: { packageId: pkg.id, isSold: false } });
  await pkg.update({ quantity: newQuantity });

  return { deletedAll: false, deletedCount: unitsToDelete.length, remaining: newQuantity };
};