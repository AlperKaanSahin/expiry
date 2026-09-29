const { body } = require('express-validator');
const { isDateExpired } = require('../utils/expiry');

const notExpired = (value) => {
  if (isDateExpired(value)) {
    throw new Error('Son kullanma tarihi geçmiş bir tarih olamaz');
  }
  return true;
};

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
    .withMessage('Geçerli bir tarih giriniz')
    .bail()
    .custom(notExpired),
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
    .withMessage('Geçerli bir tarih giriniz')
    .bail()
    .custom(notExpired),
];