const orderService = require('../services/orderService');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');

const createOrder = catchAsync(async (req, res) => {
  const order = await orderService.createOrder(req.user.id, req.body);
  res.status(201).json(order);
});

const simulatePayment = catchAsync(async (req, res) => {
  const result = await orderService.simulatePayment(req.user.id, req.body.orderId);
  res.json(result);
});

const changeOrderStatus = catchAsync(async (req, res) => {
  const isMarket = req.user.role === 'market';

  const order = await orderService.changeStatus(
    req.params.id,
    req.body.status,
    isMarket ? 'market' : 'user',
    req.user.id
  );

  res.json(order);
});

const confirmOrder = catchAsync(async (req, res) => {
  const order = await orderService.changeStatus(req.params.id, 'confirmed', 'user', req.user.id);
  res.json(order);
});

const confirmByQRCode = catchAsync(async (req, res) => {
  const { deliveryToken } = req.body;
  const order = await orderService.confirmByQRCode(req.user.id, deliveryToken);
  res.json(order);
});

const markDelivered = catchAsync(async (req, res) => {
  const order = await orderService.changeStatus(req.params.id, 'delivered', 'market', req.user.id);
  res.json(order);
});

const getMyShopOrders = catchAsync(async (req, res) => {
  const shop = await orderService.getShopByOwner(req.user.id);
  if (!shop) throw new AppError('Market bulunamadı', 404);

  const statusGroup = req.query.tab === 'past' ? 'past' : 'active';
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;

  const result = await orderService.listShopOrders(shop.id, statusGroup, page, limit);
  res.json(result);
});

const getMyUserOrders = catchAsync(async (req, res) => {
  const statusGroup = req.query.tab === 'past' ? 'past' : 'active';
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;

  const result = await orderService.listUserOrders(req.user.id, statusGroup, page, limit);
  res.json(result);
});

module.exports = {
  createOrder,
  simulatePayment,
  changeOrderStatus,
  markDelivered,
  confirmOrder,
  confirmByQRCode,
  getMyShopOrders,
  getMyUserOrders
};