const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const auth = require('../middlewares/auth');
const { listUserOrders } = require('../controllers/orderController');

router.post('/register', userController.register);
router.post('/login', userController.login);
router.get('/profile', auth, userController.getProfile);
router.get('/orders', require('../middlewares/auth'), listUserOrders);

module.exports = router;
