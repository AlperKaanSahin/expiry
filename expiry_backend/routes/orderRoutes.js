const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const auth = require('../middlewares/auth');
const devOnly = require('../middlewares/devOnly');
const validate = require('../middlewares/validate');
const orderValidator = require('../validators/order.validator');

router.get('/user/me', auth, orderController.getMyUserOrders);
router.get('/shop/me', auth, orderController.getMyShopOrders);
router.post('/', auth, orderValidator.createOrder, validate, orderController.createOrder);
// TODO(iyzico): Iyzico entegrasyonu tamamlanınca bu route'u kaldır, PaymentScreen.js'i
// gerçek ödeme akışına bağla.
router.post('/simulate-payment', auth, devOnly, orderController.simulatePayment);

router.post('/:id/checkout', auth, orderController.initiateCheckout);

// Public — Iyzico'nun sunucusu POST ediyor, JWT taşımıyor. express.urlencoded()
// sadece bu route'a özel: Iyzico callback'i form-urlencoded gönderiyor, app.js'teki
// global express.json() bunu parse edemez.
router.post(
  '/checkout/callback',
  express.urlencoded({ extended: true }),
  orderController.iyzicoCallback
);

// Public — asenkron webhook (checkout callback'ten AYRI mekanizma). JSON body
// gönderiyor, global express.json() yeterli — özel bir body parser gerekmiyor.
router.post('/webhook/iyzico', orderController.iyzicoWebhook);

// Public — WebView'in intercept edip asla gerçekten yüklemediği bir "sonuç" sayfası.
// Custom scheme (expiry://) yerine normal https path kullanıyoruz çünkü Android
// WebView bazı durumlarda kayıtsız custom scheme'lere navigasyonu sessizce yutuyor.
router.get('/payment-result', orderController.paymentResultPage);

router.post('/:id/status', auth, orderValidator.changeOrderStatus, validate, orderController.changeOrderStatus);
router.post('/:id/confirm', auth, orderController.confirmOrder);
router.post('/:id/deliver', auth, orderController.markDelivered);
router.post('/confirm-qr', auth, orderController.confirmByQRCode);

module.exports = router;