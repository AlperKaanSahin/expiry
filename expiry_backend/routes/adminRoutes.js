const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const auth = require('../middlewares/auth');
const isAdmin = require('../middlewares/isAdmin');

router.get('/users', auth, isAdmin, adminController.getAllUsers);
router.get('/users/:id', auth, isAdmin, adminController.getUserById);

router.get('/shops', auth, isAdmin, adminController.getAllShops);
router.put('/shops/:id', auth, isAdmin, adminController.updateShop);
router.delete('/shops/:id', auth, isAdmin, adminController.deleteShop);

router.put('/users/:id/role', auth, isAdmin, adminController.updateUserRole);
router.put('/shops/:id/status',auth, isAdmin, adminController.updateShopStatus);

router.delete('/users/:id', auth, isAdmin, adminController.deleteUser);

module.exports = router;