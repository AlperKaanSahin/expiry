const adminService = require('../services/adminService');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');

exports.getAllUsers = catchAsync(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;

  const result = await adminService.getAllUsers(page, limit);

  res.json({
    total: result.count,
    page,
    limit,
    users: result.rows
  });
});

exports.getUserById = catchAsync(async (req, res) => {
  const user = await adminService.getUserById(req.params.id);
  if (!user) throw new AppError('Kullanıcı bulunamadı', 404);
  res.json(user);
});

exports.updateUserRole = catchAsync(async (req, res) => {
  const user = await adminService.updateUserRole(
    req.params.id,
    req.body.role,
    req.user.id
  );

  res.json({
    id: user.id,
    email: user.email,
    role: user.role
  });
});

exports.deleteUser = catchAsync(async (req, res) => {
  await adminService.deleteUser(Number(req.params.id), req.user.id);
  res.json({ success: true });
});

exports.getAllShops = catchAsync(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const result = await adminService.getAllShops(page, limit);
  res.json(result);
});

exports.updateShop = catchAsync(async (req, res) => {
  const updated = await adminService.updateShop(req.params.id, req.body, req.user.id);
  res.json(updated);
});

exports.deleteShop = catchAsync(async (req, res) => {
  await adminService.deleteShop(req.params.id, req.user.id);
  res.json({ success: true });
});

exports.updateShopStatus = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const shop = await adminService.updateShopStatus(id, status, req.user.id);

  res.json({ message: 'Status updated', shop });
});