const express = require('express');
const router = express.Router();
const adminDashboardController = require('../controllers/adminDashboardController');
const auth = require('../middlewares/auth');
const isAdmin = require('../middlewares/isAdmin');

router.get('/summary', auth, isAdmin, adminDashboardController.getSummary);

module.exports = router;