const { ShopProduct, Shop } = require('../models');

module.exports = {
  list: async (req, res) => {
    try {
      // Önce kullanıcının marketini bul
      const shop = await Shop.findOne({ where: { ownerId: req.user.id } });
      if (!shop) return res.json([]);

      // Sadece o markete ait ürünleri getir
      const products = await ShopProduct.findAll({ where: { shopId: shop.id } });
      res.json(products);
    } catch (err) {
      res.status(500).json({ error: 'Ürünler yüklenemedi' });
    }
  },
create: async (req, res) => {
  try {
    const shop = await Shop.findOne({ where: { ownerId: req.user.id } });
    if (!shop) return res.status(400).json({ error: 'Market bulunamadı' });

    const { name, price, quantity, expiryDate } = req.body;
    const newProduct = await ShopProduct.create({
      name,
      price,
      quantity,
      expiryDate, 
      shopId: shop.id
    });
    res.json(newProduct);
  } catch (err) {
    res.status(500).json({ error: 'Ürün eklenemedi' });
  }
},
update: async (req, res) => {
  try {
    const shop = await Shop.findOne({ where: { ownerId: req.user.id } });
    if (!shop) return res.status(400).json({ error: 'Market bulunamadı' });

    const { name, price, quantity, expiryDate } = req.body;
    const product = await ShopProduct.findOne({ where: { id: req.params.id, shopId: shop.id } });
    if (!product) return res.status(404).json({ error: 'Ürün bulunamadı' });

    await product.update({ name, price, quantity, expiryDate });
    res.json(product);
  } catch (err) {
    res.status(500).json({ error: 'Ürün güncellenemedi' });
  }
},
delete: async (req, res) => {
  try {
    const shop = await Shop.findOne({ where: { ownerId: req.user.id } });
    if (!shop) return res.status(400).json({ error: 'Market bulunamadı' });

    const product = await ShopProduct.findOne({ where: { id: req.params.id, shopId: shop.id } });
    if (!product) return res.status(404).json({ error: 'Ürün bulunamadı' });

    await product.destroy();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Ürün silinemedi' });
  }
},
};