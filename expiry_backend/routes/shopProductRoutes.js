const express = require('express');
const router = express.Router();
const shopProductController = require('../controllers/shopProductController');
const auth = require('../middlewares/auth');
const onlyMarket = require('../middlewares/onlyMarket');
const validate = require('../middlewares/validate');
const shopProductValidator = require('../validators/shopProduct.validator');

router.get('/', auth, onlyMarket, shopProductController.list);
router.post('/', auth, onlyMarket, shopProductValidator.createProduct, validate, shopProductController.create);
router.put('/:id', auth, onlyMarket, shopProductValidator.updateProduct, validate, shopProductController.update);
router.delete('/:id', auth, onlyMarket, shopProductController.delete);

module.exports = router;