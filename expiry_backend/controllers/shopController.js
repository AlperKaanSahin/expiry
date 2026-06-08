const { PackageProduct, ShopProduct } = require('../models');
const { ShopRating } = require('../models');
const { User, Shop, Package, Order } = require('../models');
const shopService = require('../services/shopService');


async function getMyShop(req, res) {
  try {
    const shop = await Shop.findOne({
      where: { ownerId: req.user.id }
    });

    // SADECE 2 STATE
    if (shop.status === "pending") {
      return res.json({
        status: "PENDING",
        shop
      });
    }

    return res.json({
      status: "ACTIVE",
      shop
    });

  } catch (error) {
    return res.status(500).json({
      error: error.message
    });
  }
}
async function list(req, res) {
  try {
  const shops = await Shop.findAll({
    where: { status: 'active' }
  });

  res.json(shops);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
async function getShopWithPackages(req, res) {
  try {
    const shop = await shopService.getShopWithPackages(req.params.id);

    if (!shop) {
      return res.status(404).json({ error: 'Shop not found' });
    }

    return res.json(shop);

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
async function rateShop(req, res) {
  try {
    const result = await shopService.rateShop(
      req.user.id,
      req.body
    );

    return res.json(result);

  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
}
async function canRateShop(req, res) {
  try {
    const result = await shopService.canRateShop(
      req.user.id,
      req.params.shopId
    );

    return res.json(result);

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
async function applyShop(req, res) {
  try {
    const userId = req.user.id;

    const shop = await shopService.applyShop(userId, req.body);

    return res.json({
      message: 'Başvuru alındı',
      shop
    });

  } catch (err) {
  console.log("🔥 APPLY SHOP ERROR:", err);
  return res.status(500).json({
    message: err.message,
    stack: err.stack
  });
}
}
module.exports = {
  list,
  getShopWithPackages,
  rateShop,
  canRateShop,
  applyShop,
  getMyShop
};