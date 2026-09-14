const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const auth = require('../middlewares/auth');
const onlyMarket = require('../middlewares/onlyMarket');

router.get('/summary', auth, onlyMarket, dashboardController.getSummary);

module.exports = router;