const shopProductService = require('../services/shopProductService');
const catchAsync = require('../utils/catchAsync');

module.exports = {
  listAll: catchAsync(async (req, res) => {
    const products = await shopProductService.listAllProducts(req.user.id);
    res.json(products);
  }),

  list: catchAsync(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const result = await shopProductService.listProducts(req.user.id, page, limit);
    res.json(result);
  }),

  create: catchAsync(async (req, res) => {
    const product = await shopProductService.createProduct(req.user.id, req.body);
    res.status(201).json(product);
  }),

  update: catchAsync(async (req, res) => {
    const product = await shopProductService.updateProduct(req.user.id, req.params.id, req.body);
    res.json(product);
  }),

  delete: catchAsync(async (req, res) => {
    await shopProductService.deleteProduct(req.user.id, req.params.id);
    res.json({ success: true });
  }),
};