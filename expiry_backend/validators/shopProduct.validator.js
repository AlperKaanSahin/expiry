const { body } = require('express-validator');

exports.createProduct = [
  body('name')
    .notEmpty()
    .withMessage('Ürün adı zorunlu'),
  body('price')
    .isFloat({ min: 0 })
    .withMessage('Geçerli bir fiyat giriniz'),
  body('quantity')
    .isInt({ min: 0 })
    .withMessage('Geçerli bir miktar giriniz'),
  body('expiryDate')
    .isISO8601()
    .withMessage('Geçerli bir tarih giriniz'),
];

exports.updateProduct = [
  body('name')
    .optional()
    .notEmpty()
    .withMessage('Ürün adı boş olamaz'),
  body('price')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Geçerli bir fiyat giriniz'),
  body('quantity')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Geçerli bir miktar giriniz'),
  body('expiryDate')
    .optional()
    .isISO8601()
    .withMessage('Geçerli bir tarih giriniz'),
];