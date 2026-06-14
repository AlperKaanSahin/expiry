const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const auth = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const userValidator = require('../validators/user.validator');

router.post('/register', userValidator.register, validate, userController.register);
router.post('/login', userValidator.login, validate, userController.login);
router.get('/profile', auth, userController.getProfile);
router.put('/change-password', auth, userController.changePassword);

module.exports = router;