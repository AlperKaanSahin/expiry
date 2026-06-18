const shopService = require('../services/shopService');

async function getMyShop(req, res) {
  try {
    const shop = await shopService.getMyShop(req.user.id);

    if (!shop) {
      return res.status(404).json({ error: 'Market bulunamadı' });
    }

    const status = shop.status === 'pending' ? 'PENDING' : 'ACTIVE';
    res.json({ status, shop });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function list(req, res) {
  try {
    const shops = await shopService.listActiveShops();
    res.json(shops);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function getShopWithPackages(req, res) {
  try {
    const shop = await shopService.getShopWithPackages(req.params.id);
    if (!shop) return res.status(404).json({ error: 'Shop not found' });
    res.json(shop);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function rateShop(req, res) {
  try {
    const result = await shopService.rateShop(
      req.user.id,
      req.body.shopId,
      req.body.rating,
      req.body.orderId
    );
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

async function canRateShop(req, res) {
  try {
    const result = await shopService.canRateShop(req.user.id, req.params.shopId);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function applyShop(req, res) {
  try {
    const shop = await shopService.applyShop(req.user.id, req.body);
    res.json({ message: 'Başvuru alındı', shop });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}
async function updateShopProfile(req, res) {
  try {
    const shop = await shopService.updateShopProfile(req.user.id, req.body);
    res.json({ message: 'Profil güncellendi', shop });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

module.exports = { list, getShopWithPackages, rateShop, canRateShop, applyShop, getMyShop, updateShopProfile };