const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const auth = require('../middlewares/auth');

router.post('/', auth, orderController.createOrder);

router.post('/simulate-payment', auth, orderController.simulatePayment);

// TEK STATE ENDPOINT
router.post('/:id/status', auth, orderController.changeOrderStatus);

router.get('/shop/:shopId', auth, orderController.listShopOrders);
router.get('/user/:userId', auth, orderController.listUserOrders);

module.exports = router;