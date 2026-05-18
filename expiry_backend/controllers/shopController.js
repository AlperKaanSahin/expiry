const { User, Shop, Package } = require('../models');
const { PackageProduct, ShopProduct } = require('../models');
const { ShopRating } = require('../models');


async function getMarketProfile(req, res) {
  try {
    const shop = await Shop.findOne({ where: { ownerId: req.user.id } });
    if (!shop) return res.status(404).json({ error: 'Market bulunamadı' });
    res.json(shop);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
module.exports = {

  async list(req, res) {
    try {
      const shops = await Shop.findAll({
        attributes: [
          'id',
          'name',
          'address',
          'phone',
          'ratingAverage',
          'ratingCount'
        ]
      });
      return res.json(shops);
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  },
  async getShopWithPackages(req, res) {
    try {
      const shop = await Shop.findOne({
        where: { id: req.params.id },
        include: [{
          model: Package,
          include: [{
            model: PackageProduct,
            include: [{ model: ShopProduct }]
          }]
        }]
      });
      if (!shop) return res.status(404).json({ error: 'Market bulunamadı' });

      // Paketlerin products dizisini oluştur
      const shopJson = shop.toJSON();
      shopJson.Packages = shopJson.Packages.map(pkg => ({
        ...pkg,
        products: pkg.PackageProducts.map(pp => ({
          name: pp.ShopProduct.name,
          price: pp.ShopProduct.price,
          quantity: pp.quantity,
          imageUrl: pp.ShopProduct.imageUrl,
          expiryDate: pp.ShopProduct.expiryDate
        }))
      }));

      return res.json(shopJson);
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  },
  async rateShop(req, res) {

    const { shopId, rating } = req.body;
    const userId = req.user?.id || 1;

    if (!shopId || !rating || !userId) {
      return res.status(400).json({ error: 'Eksik veri' });
    }

    try {
      // Her puan için yeni kayıt ekle
      console.log('rateShop gelen shopId:', shopId);
      await ShopRating.create({ shopId, userId, rating });

      // Ortalama puanı hesapla
      const ratings = await ShopRating.findAll({ where: { shopId } });
      const ratingCount = ratings.length;
      const ratingAverage = ratingCount > 0
        ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratingCount
        : 0;

      await Shop.update({ ratingAverage, ratingCount }, { where: { id: shopId } });
      const [affectedRows] = await Shop.update({ ratingAverage, ratingCount }, { where: { id: shopId } });
      console.log('Güncellenen satır sayısı:', affectedRows);

      res.json({ ratingAverage, ratingCount });
    } catch (err) {
      console.error('rateShop error:', err);
      res.status(500).json({ error: 'Something went wrong!' });
    }
  },
  async canRateShop(req, res) {
    try {
      const { shopId } = req.params;
      const userId = req.user.id;

      // Kullanıcının bu marketten başarılı (ör: 'paid') siparişi var mı kontrol et
      const order = await Order.findOne({
        where: {
          shopId,
          userId,
          status: 'paid' // Siparişin başarılı/ödenmiş olduğunu belirten status
        }
      });

      res.json({ canRate: !!order });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
  getMarketProfile


};
