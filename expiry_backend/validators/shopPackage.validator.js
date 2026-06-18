const { body } = require('express-validator');

exports.createPackage = [
  body('name')
    .notEmpty()
    .withMessage('Paket adı zorunlu'),
  body('price')
    .optional({ nullable: true })
    .isFloat({ min: 0 })
    .withMessage('Geçerli bir fiyat giriniz'),
  body('quantity')
    .isInt({ min: 1 })
    .withMessage('Miktar en az 1 olmalı'),
  body('deliveryStart')
    .isISO8601()
    .withMessage('Geçerli bir başlangıç tarihi giriniz'),
  body('deliveryEnd')
    .isISO8601()
    .withMessage('Geçerli bir bitiş tarihi giriniz'),
  body('products')
    .isArray({ min: 1 })
    .withMessage('En az bir ürün seçilmeli'),
  body('products.*.id')
    .isInt({ min: 1 })
    .withMessage('Geçerli bir ürün ID giriniz'),
  body('products.*.quantity')
    .isInt({ min: 1 })
    .withMessage('Ürün miktarı en az 1 olmalı'),
];

exports.updatePackage = [
  body('name')
    .optional()
    .notEmpty()
    .withMessage('Paket adı boş olamaz'),
  body('price')
    .optional({ nullable: true })
    .isFloat({ min: 0 })
    .withMessage('Geçerli bir fiyat giriniz'),
  body('quantity')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Miktar en az 1 olmalı'),
  body('deliveryStart')
    .optional()
    .isISO8601()
    .withMessage('Geçerli bir başlangıç tarihi giriniz'),
  body('deliveryEnd')
    .optional()
    .isISO8601()
    .withMessage('Geçerli bir bitiş tarihi giriniz'),
];
