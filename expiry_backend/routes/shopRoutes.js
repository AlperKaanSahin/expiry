const express = require('express');
const router = express.Router();
const shopController = require('../controllers/shopController');
const auth = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const shopValidator = require('../validators/shop.validator');
const onlyMarket = require('../middlewares/onlyMarket');
const upload = require('../middlewares/upload');

router.get('/me', auth, shopController.getMyShop);

router.get('/me/profile', auth, onlyMarket, shopController.getMyShopProfile);
router.patch('/me/profile', auth, onlyMarket, shopController.updateShopProfile);
router.patch('/me/cover-photo', auth, upload.single('photo'), shopController.updateCoverPhoto);

router.get('/me/payment-settings', auth, onlyMarket, shopController.getPaymentSettings);
router.patch('/me/payment-settings', auth, onlyMarket, shopController.updatePaymentSettings);

router.get('/', shopController.list);
router.get('/:id/packages', shopController.getShopWithPackages);
router.get('/:shopId/can-rate', auth, shopController.canRateShop);

router.post('/apply', auth, shopValidator.applyShop, validate, shopController.applyShop);
router.post('/rate', auth, shopValidator.rateShop, validate, shopController.rateShop);



module.exports = router;