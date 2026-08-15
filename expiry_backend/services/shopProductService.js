const { ShopProduct, Shop } = require('../models');
const AppError = require('../utils/AppError');

const getShopByUserId = async (userId) => {
  const shop = await Shop.findOne({ where: { ownerId: userId } });
  if (!shop) throw new AppError('Market bulunamadı', 404);
  return shop;
};

exports.listAllProducts = async (userId) => {
  const shop = await Shop.findOne({ where: { ownerId: userId } });
  if (!shop) return [];
  return ShopProduct.findAll({ where: { shopId: shop.id }, order: [['createdAt', 'DESC']] });
};

exports.listProducts = async (userId, page = 1, limit = 10) => {
  const shop = await Shop.findOne({ where: { ownerId: userId } });
  if (!shop) return { total: 0, page, limit, products: [] };

  const offset = (page - 1) * limit;

  const { count, rows } = await ShopProduct.findAndCountAll({
    where: { shopId: shop.id },
    order: [['createdAt', 'DESC']],
    limit,
    offset
  });

  return { total: count, page, limit, products: rows };
};

exports.createProduct = async (userId, data) => {
  const shop = await getShopByUserId(userId);
  const { name, price, quantity, expiryDate } = data;
  return await ShopProduct.create({ name, price, quantity, expiryDate, shopId: shop.id });
};

exports.updateProduct = async (userId, productId, data) => {
  const shop = await getShopByUserId(userId);
  const { name, price, quantity, expiryDate } = data;

  const product = await ShopProduct.findOne({ where: { id: productId, shopId: shop.id } });
  if (!product) throw new AppError('Ürün bulunamadı', 404);

  await product.update({ name, price, quantity, expiryDate });
  return product;
};

exports.deleteProduct = async (userId, productId) => {
  const shop = await getShopByUserId(userId);

  const product = await ShopProduct.findOne({ where: { id: productId, shopId: shop.id } });
  if (!product) throw new AppError('Ürün bulunamadı', 404);

  await product.destroy();
  return true;
};