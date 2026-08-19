const shopPackageService = require('../services/shopPackageService');
const catchAsync = require('../utils/catchAsync');

module.exports = {
  list: catchAsync(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const result = await shopPackageService.listPackages(req.user.id, page, limit);
    res.json(result);
  }),

  create: catchAsync(async (req, res) => {
    const pkg = await shopPackageService.createPackage(req.user.id, req.body);
    res.status(201).json(pkg);
  }),

  update: catchAsync(async (req, res) => {
    const pkg = await shopPackageService.updatePackage(req.user.id, req.params.id, req.body);
    res.json({ success: true, package: pkg });
  }),

  delete: catchAsync(async (req, res) => {
    const result = await shopPackageService.deletePackage(req.user.id, req.params.id, req.body.count);
    res.json({ success: true, ...result });
  }),
};