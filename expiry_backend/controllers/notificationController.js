const notificationService = require('../services/notificationService');

exports.getMyNotifications = async (req, res) => {
  try {
    const userId = req.user.id;

    const notifications = await notificationService.getUserNotifications(userId);

    return res.json({
      success: true,
      data: notifications
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
};
exports.getUnreadCount = async (req, res) => {
  try {
    const userId = req.user.id;

    const count = await notificationService.getUnreadCount(userId);

    return res.json({
      success: true,
      count
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
};
exports.markAsRead = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const notification = await notificationService.markAsRead(id, userId);

    return res.json({
      success: true,
      data: notification
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
};
exports.markAllAsRead = async (req, res) => {
  try {
    const userId = req.user.id;

    await notificationService.markAllAsRead(userId);

    return res.json({
      success: true,
      message: 'All notifications marked as read'
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
};