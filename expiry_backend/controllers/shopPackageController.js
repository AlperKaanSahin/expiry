const shopPackageService = require('../services/ShopPackageService');

module.exports = {
  list: async (req, res) => {
    try {
      const packages = await shopPackageService.listPackages(req.user.id);
      res.json(packages);
    } catch (err) {
      res.status(500).json({ error: 'Paketler yüklenemedi' });
    }
  },

  create: async (req, res) => {
    try {
      const pkg = await shopPackageService.createPackage(req.user.id, req.body);
      res.status(201).json(pkg);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  },

  update: async (req, res) => {
    try {
      const pkg = await shopPackageService.updatePackage(req.user.id, req.params.id, req.body);
      res.json({ success: true, package: pkg });
    } catch (err) {
      const status = err.message === 'Paket bulunamadı' ? 404 : 400;
      res.status(status).json({ error: err.message });
    }
  },

  delete: async (req, res) => {
    try {
      const result = await shopPackageService.deletePackage(req.user.id, req.params.id, req.body.count);
      res.json({ success: true, ...result });
    } catch (err) {
      const status = err.message === 'Paket bulunamadı' ? 404 : 400;
      res.status(status).json({ error: err.message });
    }
  }
};