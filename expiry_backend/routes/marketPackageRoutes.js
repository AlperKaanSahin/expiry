const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const onlyMarket = require('../middlewares/onlyMarket');
const marketPackageController = require('../controllers/marketPackageController');

router.get('/market/packages', auth, onlyMarket, marketPackageController.list);
router.post('/market/packages', auth, onlyMarket, marketPackageController.create);
router.put('/market/packages/:id', auth, onlyMarket, marketPackageController.update);
router.delete('/market/packages/:id', auth, onlyMarket, marketPackageController.delete);

module.exports = router;