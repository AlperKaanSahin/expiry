const { body } = require('express-validator');

exports.createOrder = [
  body('shopId')
    .isInt({ min: 1 })
    .withMessage('Geçerli bir market ID giriniz'),
  body('packages')
    .isArray({ min: 1 })
    .withMessage('En az bir paket seçilmeli'),
  body('packages.*.packageId')
    .isInt({ min: 1 })
    .withMessage('Geçerli bir paket ID giriniz'),
  body('packages.*.quantity')
    .isInt({ min: 1 })
    .withMessage('Miktar en az 1 olmalı'),
  // price kaldırıldı — artık server-side hesaplanıyor
];

exports.changeOrderStatus = [
  body('status')
    .isIn(['pending', 'paid', 'delivered', 'confirmed', 'released'])
    .withMessage('Geçersiz sipariş durumu'),
];