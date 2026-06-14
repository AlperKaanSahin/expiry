const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const auth = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const orderValidator = require('../validators/order.validator');

router.get('/user/me', auth, orderController.getMyUserOrders);
router.get('/shop/me', auth, orderController.getMyShopOrders);
router.post('/', auth, orderValidator.createOrder, validate, orderController.createOrder);
router.post('/simulate-payment', auth, orderController.simulatePayment);
router.post('/:id/status', auth, orderValidator.changeOrderStatus, validate, orderController.changeOrderStatus);

module.exports = router;