const { Package, Shop, PackageProduct, ShopProduct, PackageUnit, sequelize } = require('../models');

const getShopByUserId = async (userId) => {
  const shop = await Shop.findOne({
  where: { ownerId: userId },
  paranoid: false
});

console.log("RAW SHOP:", shop);
  if (!shop) throw new Error('Market bulunamadı');
  return shop;
};

exports.listPackages = async (userId) => {
  const shop = await Shop.findOne({ where: { ownerId: userId } });
  if (!shop) return [];

  const packages = await Package.findAll({
    where: { shopId: shop.id },
    include: [
      {
        model: PackageProduct,
        include: [{ model: ShopProduct, attributes: ['id', 'name', 'price'] }]
      }
    ]
  });

  const result = [];
  for (const pkg of packages) {
    const products = (pkg.PackageProducts || [])
      .filter(pp => pp && pp.ShopProduct)
      .map(pp => ({
        id: pp.ShopProduct.id,
        name: pp.ShopProduct.name,
        price: pp.ShopProduct.price,
        quantity: pp.quantity
      }));

    const remainingUnits = await PackageUnit.count({
      where: { packageId: pkg.id, isSold: false }
    });

    if (remainingUnits > 0) {
      const totalPrice = products.reduce((sum, p) => sum + p.price * p.quantity, 0);
      result.push({
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
        quantity: remainingUnits
      });
    }
  }

  return result;
};

exports.createPackage = async (userId, data) => {
  console.log("➡️ CREATE PACKAGE START");
console.log("USER ID:", userId);
  const shop = await getShopByUserId(userId);
console.log("SHOP FOUND:", shop);

if (!shop) {
  console.log("❌ SHOP NOT FOUND FOR USER");
  throw new Error("Shop bulunamadı");
}
  const { name, description, price, products, deliveryStart, deliveryEnd,
    autoPriceDropEnabled, priceDropAmount, priceDropInterval, minPriceDropLimit, quantity } = data;

console.log("PRODUCTS RAW:", products);

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

// 🔥 safety net
if (isNaN(finalPrice)) {
  throw new Error("Price hesaplanamadı (NaN)");
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
        await PackageProduct.create({
          packageId: newPackage.id,
          shopProductId: p.id,
          quantity: p.quantity,
          price: p.price
        }, { transaction: t });

        const product = await ShopProduct.findByPk(p.id, { transaction: t });
        if (product) {
          const totalDeduct = unitCount * (Number(p.quantity) || 1);
          product.quantity = Math.max(0, (product.quantity || 0) - totalDeduct);
          await product.save({ transaction: t });
        }
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
  if (!pkg) throw new Error('Paket bulunamadı');

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
  if (!pkg) throw new Error('Paket bulunamadı');

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