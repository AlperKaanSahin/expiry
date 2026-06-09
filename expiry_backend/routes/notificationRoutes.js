const express = require('express');
const router = express.Router();

const notificationController = require('../controllers/notificationController');
const authMiddleware = require('../middlewares/auth');

router.get('/',authMiddleware,notificationController.getMyNotifications);
router.get('/unread-count',authMiddleware,notificationController.getUnreadCount);
router.patch('/:id/read',authMiddleware,notificationController.markAsRead);
router.patch('/read-all',authMiddleware,notificationController.markAllAsRead);
module.exports = router;