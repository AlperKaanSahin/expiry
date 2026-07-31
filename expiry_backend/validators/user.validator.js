const { body } = require('express-validator');

exports.register = [
  body('email')
    .isEmail()
    .withMessage('Geçerli bir email giriniz'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Şifre en az 6 karakter olmalı'),
  body('firstName')
    .notEmpty()
    .withMessage('İsim zorunlu'),
  body('lastName')
    .notEmpty()
    .withMessage('Soyisim zorunlu'),
];

exports.login = [
  body('email')
    .isEmail()
    .withMessage('Geçerli bir email giriniz'),
  body('password')
    .notEmpty()
    .withMessage('Şifre zorunlu'),
];
exports.forgotPassword = [
  body('email')
    .isEmail()
    .withMessage('Geçerli bir email giriniz'),
];

exports.resetPassword = [
  body('email')
    .isEmail()
    .withMessage('Geçerli bir email giriniz'),
  body('token')
    .isLength({ min: 6, max: 6 })
    .withMessage('Geçerli bir kod giriniz'),
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('Şifre en az 6 karakter olmalı'),
];