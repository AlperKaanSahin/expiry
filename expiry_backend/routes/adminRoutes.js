const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const auth = require('../middlewares/auth');
const isAdmin = require('../middlewares/isAdmin');

router.get('/users', auth, isAdmin, adminController.getAllUsers);
router.get('/users/:id', auth, isAdmin, adminController.getUserById);
router.get('/markets', auth, isAdmin, adminController.getAllMarkets);

router.post('/markets', auth, isAdmin, adminController.createMarketWithUser);

router.put('/markets/:id', auth, isAdmin, adminController.updateMarket);
router.put('/users/:id/role', auth, isAdmin, adminController.updateUserRole);

router.delete('/users/:id', auth, isAdmin, adminController.deleteUser);
router.delete('/markets/:id', auth, isAdmin, adminController.deleteMarket);

module.exports = router;