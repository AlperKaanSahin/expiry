const { Notification } = require('../models');

exports.createNotification = async ({ userId, title, message, type, targetId = null, orderId = null }) => {
  if (!userId || !title) {
    throw new Error('Missing required fields');
  }

  return await Notification.create({
    userId,
    title,
    message,
    type,
    targetId,
    orderId,
    isRead: false
  });
};

exports.getUserNotifications = async (userId) => {
  if (!userId) throw new Error('userId required');

  return await Notification.findAll({
    where: { userId },
    order: [['createdAt', 'DESC']]
  });
};
exports.getUnreadCount = async (userId) => {
  if (!userId) throw new Error('userId required');

  return await Notification.count({
    where: {
      userId,
      isRead: false
    }
  });
};
exports.markAsRead = async (notificationId, userId) => {
  if (!notificationId || !userId) throw new Error('Missing required fields');

  const notification = await Notification.findOne({
    where: {
      id: notificationId,
      userId
    }
  });

  if (!notification) {
    throw new Error('Notification not found');
  }

  notification.isRead = true;
  await notification.save();

  return notification;
};
exports.markAllAsRead = async (userId) => {
  if (!userId) throw new Error('userId required');

  return await Notification.update(
    { isRead: true },
    {
      where: {
        userId,
        isRead: false
      }
    }
  );
};