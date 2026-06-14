const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const auth = require('../middlewares/auth');
const isAdmin = require('../middlewares/isAdmin');
const validate = require('../middlewares/validate');
const adminValidator = require('../validators/admin.validator');

router.get('/users', auth, isAdmin, adminController.getAllUsers);
router.get('/users/:id', auth, isAdmin, adminController.getUserById);
router.put('/users/:id/role', auth, isAdmin, adminValidator.updateUserRole, validate, adminController.updateUserRole);
router.delete('/users/:id', auth, isAdmin, adminController.deleteUser);

router.get('/shops', auth, isAdmin, adminController.getAllShops);
router.put('/shops/:id', auth, isAdmin, adminController.updateShop);
router.put('/shops/:id/status', auth, isAdmin, adminValidator.updateShopStatus, validate, adminController.updateShopStatus);
router.delete('/shops/:id', auth, isAdmin, adminController.deleteShop);

module.exports = router;