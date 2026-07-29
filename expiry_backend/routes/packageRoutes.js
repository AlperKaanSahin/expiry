const express = require('express');
const router = express.Router();
const packageController = require('../controllers/packageController');
const auth = require('../middlewares/auth');

router.get('/:id', auth, packageController.getById);
router.get('/shop/:shopId/packages', auth, packageController.fetchShopPackages);

module.exports = router;  