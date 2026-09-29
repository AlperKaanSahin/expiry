const express = require('express');
const router = express.Router();
const shopPackageController = require('../controllers/shopPackageController');
const auth = require('../middlewares/auth');
const onlyMarket = require('../middlewares/onlyMarket');
const validate = require('../middlewares/validate');
const shopPackageValidator = require('../validators/shopPackage.validator');

router.get('/', auth, onlyMarket, shopPackageController.list);
router.post('/', auth, onlyMarket, shopPackageValidator.createPackage, validate, shopPackageController.create);

// /:id'den ÖNCE tanımlanmalı — yoksa Express bunu id='expired' sanır.
router.delete('/expired', auth, onlyMarket, shopPackageController.deleteExpired);

router.put('/:id', auth, onlyMarket, shopPackageValidator.updatePackage, validate, shopPackageController.update);
router.delete('/:id', auth, onlyMarket, shopPackageController.delete);

module.exports = router;