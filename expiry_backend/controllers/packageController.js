const packageService = require('../services/packageService');
const catchAsync = require('../utils/catchAsync');

module.exports = {
  getById: catchAsync(async (req, res) => {
    const pkg = await packageService.getPackageById(req.params.id);
    res.json(pkg);
  }),

  fetchShopPackages: catchAsync(async (req, res) => {
    const packages = await packageService.getShopPackages(req.params.shopId);
    res.json(packages);
  }),
};