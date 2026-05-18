const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const auth = require('../middlewares/auth');


router.post('/', auth, orderController.createOrder);
router.post('/simulate-payment', auth, orderController.simulatePayment);
router.get('/shop/:shopId', orderController.listShopOrders);
router.get('/user/:userId', auth, orderController.listUserOrders)
router.post('/:id/confirm-user', auth, orderController.confirmReceivedByUser);
router.post('/:id/confirm-market', auth, orderController.confirmReceivedByMarket);

module.exports = router;