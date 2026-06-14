const express = require('express');
const router = express.Router();
const auditController = require('../controllers/auditController');
const auth = require('../middlewares/auth');
const isAdmin = require('../middlewares/isAdmin');

router.get('/', auth, isAdmin, auditController.getAuditLogs);

module.exports = router;