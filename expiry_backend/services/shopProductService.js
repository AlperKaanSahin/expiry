const { Op } = require('sequelize');
const { ShopProduct, Shop, PackageProduct, sequelize } = require('../models');
const AppError = require('../utils/AppError');
const { isDateExpired, startOfDay } = require('../utils/expiry');
const { hardDeletePackageIfSafe } = require('./shopPackageService');

const getShopByUserId = async (userId) => {
  const shop = await Shop.findOne({ where: { ownerId: userId } });
  if (!shop) throw new AppError('Market bulunamadı', 404);
  return shop;
};

const withExpiryFlag = (product) => {
  const plain = product.toJSON ? product.toJSON() : product;
  return { ...plain, isExpired: isDateExpired(plain.expiryDate) };
};

exports.listAllProducts = async (userId) => {
  const shop = await Shop.findOne({ where: { ownerId: userId } });
  if (!shop) return [];
  const products = await ShopProduct.findAll({ where: { shopId: shop.id }, order: [['createdAt', 'DESC']] });
  return products.map(withExpiryFlag);
};

exports.listProducts = async (userId, page = 1, limit = 10) => {
  const shop = await Shop.findOne({ where: { ownerId: userId } });
  if (!shop) return { total: 0, page, limit, products: [], expiredCount: 0 };

  const offset = (page - 1) * limit;

  const { count, rows } = await ShopProduct.findAndCountAll({
    where: { shopId: shop.id },
    order: [['createdAt', 'DESC']],
    limit,
    offset
  });

  // Sayfa dışındaki SKT'si geçmiş ürünleri de kapsasın diye ayrı bir sayım —
  // "SKT geçenleri sil" butonunun görünürlüğü mevcut sayfaya değil, marketin
  // TÜM ürünlerine bakmalı.
  const expiredCount = await ShopProduct.count({
    where: { shopId: shop.id, expiryDate: { [Op.lt]: startOfDay(new Date()) } },
  });

  return { total: count, page, limit, products: rows.map(withExpiryFlag), expiredCount };
};

exports.createProduct = async (userId, data) => {
  const shop = await getShopByUserId(userId);
  const { name, price, quantity, expiryDate } = data;

  if (expiryDate && isDateExpired(expiryDate)) {
    throw new AppError('Son kullanma tarihi geçmiş bir ürün eklenemez', 400);
  }

  return await ShopProduct.create({ name, price, quantity, expiryDate, shopId: shop.id });
};

exports.updateProduct = async (userId, productId, data) => {
  const shop = await getShopByUserId(userId);
  const { name, price, quantity, expiryDate } = data;

  const product = await ShopProduct.findOne({ where: { id: productId, shopId: shop.id } });
  if (!product) throw new AppError('Ürün bulunamadı', 404);

  if (expiryDate && isDateExpired(expiryDate)) {
    throw new AppError('Son kullanma tarihi geçmiş bir tarihe ayarlanamaz', 400);
  }

  await product.update({ name, price, quantity, expiryDate });
  return product;
};

// Bir ürün silindiğinde onu içeren paketler de silinir — paket bileşiminden bir
// kalem eksilirse fiyat/ad/açıklama tutarsız kalır, bu yüzden paket "eksik"
// bırakılmaz, tamamen kaldırılır. Paketlerden biri hardDeletePackageIfSafe
// tarafından (aktif siparişi olduğu için) engellenirse, TÜM işlem geri alınır
// ve ürün de silinmez — paket hâlâ bu ürüne referans veriyorken ürünü silmek
// paketin verisini bozardı.
exports.deleteProduct = async (userId, productId) => {
  const shop = await getShopByUserId(userId);

  const product = await ShopProduct.findOne({ where: { id: productId, shopId: shop.id } });
  if (!product) throw new AppError('Ürün bulunamadı', 404);

  const packageRows = await PackageProduct.findAll({
    where: { shopProductId: product.id },
    attributes: ['packageId'],
    group: ['packageId'],
    raw: true,
  });
  const affectedPackageIds = packageRows.map(r => r.packageId);

  const t = await sequelize.transaction();
  try {
    for (const packageId of affectedPackageIds) {
      const deleted = await hardDeletePackageIfSafe(packageId, t);
      if (!deleted) {
        throw new AppError(
          'Bu ürünü içeren, tamamlanmamış siparişi olan bir paket var; ürün silinemedi',
          409
        );
      }
    }

    await product.destroy({ transaction: t });
    await t.commit();
    return true;
  } catch (err) {
    await t.rollback();
    throw err;
  }
};

// "SKT geçenleri sil" toplu işlemi. Bir ürünün paketlerinden biri aktif siparişi
// olduğu için silinemiyorsa, o ürün de silinmez (paket hâlâ ona referans veriyor)
// — ama diğer ürünler bundan etkilenmeden silinmeye devam eder (hep-ya-da-hiç
// SADECE ürün bazında, tüm işlem bazında değil).
exports.deleteExpiredProducts = async (userId) => {
  const shop = await getShopByUserId(userId);

  const expiredProducts = await ShopProduct.findAll({
    where: { shopId: shop.id, expiryDate: { [Op.lt]: startOfDay(new Date()) } },
  });

  if (expiredProducts.length === 0) {
    return { deletedProductsCount: 0, deletedPackagesCount: 0, blockedProductsCount: 0 };
  }

  const t = await sequelize.transaction();
  try {
    const productPackageIds = new Map();

    for (const product of expiredProducts) {
      const rows = await PackageProduct.findAll({
        where: { shopProductId: product.id },
        attributes: ['packageId'],
        group: ['packageId'],
        transaction: t,
        raw: true,
      });
      productPackageIds.set(product.id, rows.map(r => r.packageId));
    }

    // Her paketi sadece bir kez silmeyi dene — birden fazla süresi geçmiş ürün
    // aynı paketi paylaşabilir, tekrar tekrar silmeye çalışmaya gerek yok.
    const allPackageIds = [...new Set([...productPackageIds.values()].flat())];
    const packageDeletionResult = new Map();
    for (const packageId of allPackageIds) {
      packageDeletionResult.set(packageId, await hardDeletePackageIfSafe(packageId, t));
    }

    let deletedProductsCount = 0;
    let blockedProductsCount = 0;

    for (const product of expiredProducts) {
      const packageIds = productPackageIds.get(product.id);
      const anyBlocked = packageIds.some((id) => packageDeletionResult.get(id) === false);

      if (anyBlocked) {
        blockedProductsCount += 1;
        continue;
      }

      await product.destroy({ transaction: t });
      deletedProductsCount += 1;
    }

    const deletedPackagesCount = [...packageDeletionResult.values()].filter(Boolean).length;

    await t.commit();
    return { deletedProductsCount, deletedPackagesCount, blockedProductsCount };
  } catch (err) {
    await t.rollback();
    throw err;
  }
};