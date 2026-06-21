const { ShopProduct, Shop } = require('../models');

const getShopByUserId = async (userId) => {
  const shop = await Shop.findOne({ where: { ownerId: userId } });
  if (!shop) throw new Error('Market bulunamadı');
  return shop;
};

exports.listProducts = async (userId) => {
  const shop = await Shop.findOne({ where: { ownerId: userId } });
  if (!shop) return [];

  return await ShopProduct.findAll({ where: { shopId: shop.id } });
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
  if (!product) throw new Error('Ürün bulunamadı');

  await product.update({ name, price, quantity, expiryDate });
  return product;
};

exports.deleteProduct = async (userId, productId) => {
  const shop = await getShopByUserId(userId);

  const product = await ShopProduct.findOne({ where: { id: productId, shopId: shop.id } });
  if (!product) throw new Error('Ürün bulunamadı');

  await product.destroy();
  return true;
};