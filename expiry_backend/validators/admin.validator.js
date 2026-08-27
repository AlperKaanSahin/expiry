const { body } = require('express-validator');

exports.updateUserRole = [
  body('role')
    .isIn(['user', 'market', 'admin'])
    .withMessage('Geçersiz rol'),
];

exports.updateShopStatus = [
  body('status')
    .isIn(['pending', 'active', 'rejected', 'inactive'])
    .withMessage('Geçersiz market durumu'),
];
exports.updateShop = [
  body('name').notEmpty().withMessage('Market adı zorunlu'),
  body('address').notEmpty().withMessage('Adres zorunlu'),
  body('phone').isMobilePhone().withMessage('Geçerli bir telefon numarası giriniz'),
];