const express = require('express');
const router = express.Router();
const shopController = require('../controllers/shopController');
const auth = require('../middlewares/auth');
const { getMarketProfile } = require('../controllers/shopController');

router.get('/', shopController.list);
router.get('/:id/packages', shopController.getShopWithPackages);
router.post('/rate',auth, shopController.rateShop);
router.get('/market/profile', auth, getMarketProfile);
router.get('/profile', auth, shopController.getMarketProfile);
router.get('/shops/:shopId/can-rate', auth, shopController.canRateShop);

module.exports = router;