const shopProductService = require('../services/shopProductService');

module.exports = {
  list: async (req, res) => {
    try {
      const products = await shopProductService.listProducts(req.user.id);
      res.json(products);
    } catch (err) {
      res.status(500).json({ error: 'Ürünler yüklenemedi' });
    }
  },

  create: async (req, res) => {
    try {
      const product = await shopProductService.createProduct(req.user.id, req.body);
      res.status(201).json(product);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  },

  update: async (req, res) => {
    try {
      const product = await shopProductService.updateProduct(req.user.id, req.params.id, req.body);
      res.json(product);
    } catch (err) {
      const status = err.message === 'Ürün bulunamadı' ? 404 : 400;
      res.status(status).json({ error: err.message });
    }
  },

  delete: async (req, res) => {
    try {
      await shopProductService.deleteProduct(req.user.id, req.params.id);
      res.json({ success: true });
    } catch (err) {
      const status = err.message === 'Ürün bulunamadı' ? 404 : 400;
      res.status(status).json({ error: err.message });
    }
  }
};