const { Notification } = require('../models');
const AppError = require('../utils/AppError');

exports.createNotification = async ({ userId, title, message, type, targetId = null, orderId = null }) => {
  if (!userId || !title) {
    throw new AppError('Eksik alanlar', 400);
  }

  return await Notification.create({
    userId, title, message, type, targetId, orderId, isRead: false
  });
};

exports.getUserNotifications = async (userId) => {
  if (!userId) throw new AppError('userId gerekli', 400);

  return await Notification.findAll({
    where: { userId },
    order: [['createdAt', 'DESC']]
  });
};

exports.getUnreadCount = async (userId) => {
  if (!userId) throw new AppError('userId gerekli', 400);

  return await Notification.count({
    where: { userId, isRead: false }
  });
};

exports.markAsRead = async (notificationId, userId) => {
  if (!notificationId || !userId) throw new AppError('Eksik alanlar', 400);

  const notification = await Notification.findOne({
    where: { id: notificationId, userId }
  });

  if (!notification) {
    throw new AppError('Bildirim bulunamadı', 404);
  }

  notification.isRead = true;
  await notification.save();

  return notification;
};

exports.markAllAsRead = async (userId) => {
  if (!userId) throw new AppError('userId gerekli', 400);

  return await Notification.update(
    { isRead: true },
    { where: { userId, isRead: false } }
  );
};