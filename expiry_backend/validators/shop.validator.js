const { body,param } = require('express-validator');

exports.applyShop = [
  body('name')
    .notEmpty()
    .withMessage('Market adı zorunlu'),
  body('address')
    .notEmpty()
    .withMessage('Adres zorunlu'),
  body('phone')
    .isMobilePhone()
    .withMessage('Geçerli bir telefon numarası giriniz'),
];

exports.rateShop = [
  body('shopId')
    .isInt({ min: 1 })
    .withMessage('Geçerli bir market ID giriniz'),
  body('rating')
    .isFloat({ min: 1, max: 5 })
    .withMessage('Puan 1 ile 5 arasında olmalı'),
  body('orderId')
    .isInt({ min: 1 })
    .withMessage('Geçerli bir sipariş ID giriniz'),
];

exports.updateShopStatus = [
  body('status')
    .isIn(['pending', 'active', 'rejected', 'inactive'])
    .withMessage('Geçersiz market durumu'),
];