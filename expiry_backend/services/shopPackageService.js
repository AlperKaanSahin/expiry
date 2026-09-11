const { Op, fn, col } = require('sequelize');
const { Package, Shop, PackageProduct, ShopProduct, PackageUnit, sequelize } = require('../models');
const { QueryTypes } = require('sequelize');
const AppError = require('../utils/AppError');

const getShopByUserId = async (userId) => {
  const shop = await Shop.findOne({ where: { ownerId: userId } });
  if (!shop) throw new AppError('Market bulunamadı', 404);
  return shop;
};

// Bir `products` girdisini (var olan ürün referansı veya yeni ürün taslağı) çözümler.
// Yeni ürün oluşturuluyorsa stok miktarı client'tan alınmaz; unitCount * perPackageQty
// olarak sunucu tarafında hesaplanır (bu ürün sadece bu paket için var, tamamen tahsisli).
// SKT, platformun temel değer önerisi (son kullanmaya yakın ürün) olduğu için burada
// da zorunlu tutuluyor — client validasyonuna güvenmiyoruz.
const resolveProductEntry = async (p, shopId, unitCount, t) => {
  if (p.newProduct) {
    const { name, price, expiryDate } = p.newProduct;
    if (!name || !name.trim()) {
      throw new AppError('Yeni ürün için ad zorunlu', 400);
    }
    if (price == null || isNaN(Number(price)) || Number(price) < 0) {
      throw new AppError('Yeni ürün için geçerli bir fiyat zorunlu', 400);
    }
    if (!expiryDate || isNaN(new Date(expiryDate).getTime())) {
      throw new AppError('Yeni ürün için son kullanma tarihi zorunlu', 400);
    }

    const perPackageQty = Number(p.quantity) > 0 ? Number(p.quantity) : 1;

    const product = await ShopProduct.create({
      name: name.trim(),
      price: Number(price),
      quantity: unitCount * perPackageQty,
      expiryDate,
      shopId,
    }, { transaction: t });

    return { product, quantity: perPackageQty, price: Number(price), isNew: true };
  }

  const product = await ShopProduct.findOne({
    where: { id: p.id, shopId },
    transaction: t,
    lock: t.LOCK.UPDATE,
  });
  if (!product) throw new AppError(`Geçersiz ürün: ${p.id}`, 400);

  const qty = Number(p.quantity) > 0 ? Number(p.quantity) : 1;
  return { product, quantity: qty, price: p.price ?? product.price, isNew: false };
};

// Paket adı boş bırakılırsa ürün isimlerinden otomatik ve müşteriye anlamlı
// bir ad üretilir — sıra numarası gibi soğuk bir varsayım kullanmıyoruz,
// çünkü bu ad doğrudan müşteri-yüzü ekranlarında (HomeScreen vb.) görünüyor.
const buildAutoPackageName = (resolvedProducts) => {
  const names = resolvedProducts.map(rp => rp.product.name).filter(Boolean);
  if (names.length === 0) return 'Sürpriz Paket';
  if (names.length === 1) return names[0];
  if (names.length === 2) return `${names[0]} & ${names[1]}`;
  return `${names[0]}, ${names[1]} ve ${names.length - 2} ürün daha`;
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

  if (!Array.isArray(products) || products.length === 0) {
    throw new AppError('En az bir ürün gerekli', 400);
  }

  const unitCount = Number(quantity) || 1;

  const t = await sequelize.transaction();
  try {
    const resolvedProducts = [];
    for (const p of products) {
      resolvedProducts.push(await resolveProductEntry(p, shop.id, unitCount, t));
    }

    let calculatedPrice = 0;
    for (const rp of resolvedProducts) {
      calculatedPrice += (Number(rp.price) || 0) * (Number(rp.quantity) || 0);
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

    const finalName = name && name.trim() ? name.trim() : buildAutoPackageName(resolvedProducts);

    const newPackage = await Package.create({
      name: finalName, description, price: finalPrice, shopId: shop.id,
      deliveryStart, deliveryEnd, autoPriceDropEnabled,
      priceDropAmount, priceDropInterval, minPriceDropLimit, quantity
    }, { transaction: t });

    const unitRows = Array.from({ length: unitCount }, () => ({ packageId: newPackage.id, isSold: false }));
    await PackageUnit.bulkCreate(unitRows, { transaction: t });

    for (const rp of resolvedProducts) {
      await PackageProduct.create({
        packageId: newPackage.id,
        shopProductId: rp.product.id,
        quantity: rp.quantity,
        price: rp.price
      }, { transaction: t });

      // Yeni oluşturulan ürünün stoğu zaten unitCount * perPackageQty olarak
      // create sırasında ayarlandı (bu ürün sadece bu paket için var) — tekrar
      // düşmüyoruz, aksi halde çift düşüm olur.
      if (!rp.isNew) {
        const totalDeduct = unitCount * (Number(rp.quantity) || 1);
        rp.product.quantity = Math.max(0, (rp.product.quantity || 0) - totalDeduct);
        await rp.product.save({ transaction: t });
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

  const unitCount = Number(quantity) || 1;

  const t = await sequelize.transaction();
  try {
    let resolvedProducts = [];
    if (Array.isArray(products)) {
      for (const p of products) {
        resolvedProducts.push(await resolveProductEntry(p, shop.id, unitCount, t));
      }
    }

    let calculatedPrice = 0;
    for (const rp of resolvedProducts) {
      calculatedPrice += Number(rp.price) * Number(rp.quantity);
    }
    const finalPrice = price !== undefined && price !== null && price !== ''
      ? Number(price)
      : calculatedPrice;

    let finalName;
    if (name && name.trim()) {
      finalName = name.trim();
    } else if (resolvedProducts.length > 0) {
      finalName = buildAutoPackageName(resolvedProducts);
    } else {
      finalName = pkg.name;
    }

    await pkg.update({
      name: finalName, description, price: finalPrice, deliveryStart, deliveryEnd,
      autoPriceDropEnabled, priceDropAmount, priceDropInterval, minPriceDropLimit, quantity
    }, { transaction: t });

    if (Array.isArray(products)) {
      await PackageProduct.destroy({ where: { packageId: pkg.id }, transaction: t });
      for (const rp of resolvedProducts) {
        await PackageProduct.create({
          packageId: pkg.id,
          shopProductId: rp.product.id,
          quantity: rp.quantity,
          price: rp.price
        }, { transaction: t });

        if (!rp.isNew) {
          const totalDeduct = unitCount * (Number(rp.quantity) || 1);
          rp.product.quantity = Math.max(0, (rp.product.quantity || 0) - totalDeduct);
          await rp.product.save({ transaction: t });
        }
      }
    }

    const currentCount = await PackageUnit.count({ where: { packageId: pkg.id }, transaction: t });
    if (quantity > currentCount) {
      const rows = Array.from({ length: quantity - currentCount }, () => ({ packageId: pkg.id, isSold: false }));
      await PackageUnit.bulkCreate(rows, { transaction: t });
    } else if (quantity < currentCount) {
      const unitsToDelete = await PackageUnit.findAll({
        where: { packageId: pkg.id, isSold: false },
        order: [['id', 'DESC']],
        limit: currentCount - quantity,
        transaction: t,
      });
      for (const unit of unitsToDelete) await unit.destroy({ transaction: t });
    }

    const remainingUnits = await PackageUnit.count({ where: { packageId: pkg.id, isSold: false }, transaction: t });
    await pkg.update({ quantity: remainingUnits }, { transaction: t });

    await t.commit();
    return pkg;
  } catch (err) {
    await t.rollback();
    throw err;
  }
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