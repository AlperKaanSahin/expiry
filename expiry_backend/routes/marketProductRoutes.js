const express = require('express');
const router = express.Router();

const auth = require('../middlewares/auth');
const onlyMarket = require('../middlewares/onlyMarket');
const marketProductController = require('../controllers/marketProductController');

router.get('/market/products', auth, onlyMarket, marketProductController.list);
router.post('/market/products', auth, onlyMarket, marketProductController.create);
router.put('/market/products/:id', auth, onlyMarket, marketProductController.update);
router.delete('/market/products/:id', auth, onlyMarket, marketProductController.delete);

module.exports = router;