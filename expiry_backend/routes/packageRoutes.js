const express = require('express');
const router = express.Router();
const packageController = require('../controllers/packageController');

router.get('/:id', packageController.getById);
router.get('/shop/:shopId/packages', packageController.fetchShopPackages);

module.exports = router;