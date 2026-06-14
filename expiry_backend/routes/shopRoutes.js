const express = require('express');
const router = express.Router();
const shopController = require('../controllers/shopController');
const auth = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const shopValidator = require('../validators/shop.validator');
const onlyMarket = require('../middlewares/onlyMarket');

router.get('/me', auth, shopController.getMyShop);
router.get('/', shopController.list);
router.get('/:id/packages', shopController.getShopWithPackages);
router.get('/:shopId/can-rate', auth, shopController.canRateShop);
router.post('/apply', auth, shopValidator.applyShop, validate, shopController.applyShop);
router.post('/rate', auth, shopValidator.rateShop, validate, shopController.rateShop);
router.put('/profile', auth, onlyMarket, shopController.updateShopProfile);

module.exports = router;