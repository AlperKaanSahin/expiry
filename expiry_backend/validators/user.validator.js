const { body } = require('express-validator');

exports.register = [
  body('email')
    .isEmail()
    .withMessage('Geçerli bir email giriniz'),
  body('password')
    .isLength({ min: 4 })
    .withMessage('Şifre en az 4 karakter olmalı'),
  body('firstName')
    .notEmpty()
    .withMessage('İsim zorunlu'),
  body('lastName')
    .notEmpty()
    .withMessage('Soyisim zorunlu'),
  body('phone')
    .optional()
    .isMobilePhone()
    .withMessage('Geçerli bir telefon numarası giriniz'),
];

exports.login = [
  body('email')
    .isEmail()
    .withMessage('Geçerli bir email giriniz'),
  body('password')
    .notEmpty()
    .withMessage('Şifre zorunlu'),
];