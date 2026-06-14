const packageService = require('../services/packageService');

module.exports = {
  async getById(req, res) {
    try {
      const pkg = await packageService.getPackageById(req.params.id);
      res.json(pkg);
    } catch (err) {
      const status = err.message === 'Kutu bulunamadı' ? 404 : 500;
      res.status(status).json({ error: err.message });
    }
  },

  async fetchShopPackages(req, res) {
    try {
      const packages = await packageService.getShopPackages(req.params.shopId);
      res.json(packages);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
};