const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const auth = require('../middlewares/auth');
const isAdmin = require('../middlewares/isAdmin');

router.get('/users', auth, isAdmin, adminController.getAllUsers);
router.delete('/users/:id', auth, isAdmin, adminController.deleteUser);
router.get('/markets', adminController.getAllMarkets);
router.delete('/markets/:id', auth, isAdmin, adminController.deleteMarket);
router.put('/markets/:id', auth, isAdmin, adminController.updateMarket);
router.post('/markets', auth, isAdmin, adminController.createMarketWithUser);








module.exports = router;