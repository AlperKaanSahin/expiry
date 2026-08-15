const notificationService = require('../services/notificationService');
const catchAsync = require('../utils/catchAsync');

exports.getMyNotifications = catchAsync(async (req, res) => {
  const notifications = await notificationService.getUserNotifications(req.user.id);
  res.json({ success: true, data: notifications });
});

exports.getUnreadCount = catchAsync(async (req, res) => {
  const count = await notificationService.getUnreadCount(req.user.id);
  res.json({ success: true, count });
});

exports.markAsRead = catchAsync(async (req, res) => {
  const notification = await notificationService.markAsRead(req.params.id, req.user.id);
  res.json({ success: true, data: notification });
});

exports.markAllAsRead = catchAsync(async (req, res) => {
  await notificationService.markAllAsRead(req.user.id);
  res.json({ success: true, message: 'Tüm bildirimler okundu olarak işaretlendi' });
});