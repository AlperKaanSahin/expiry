const express = require('express');
const router = express.Router();
const shopController = require('../controllers/shopController');
const auth = require('../middlewares/auth');

// 1. USER-SPECIFIC ROUTE (EN ÖNCE)
router.get('/me', auth, shopController.getMyShop);

// 2. PUBLIC ROUTES
router.get('/', shopController.list);

// 3. DYNAMIC ROUTES (EN SON)
router.get('/:id/packages', shopController.getShopWithPackages);

router.get('/:shopId/can-rate', auth, shopController.canRateShop);

router.post('/apply', auth, shopController.applyShop);
router.post('/rate', auth, shopController.rateShop);

module.exports = router;