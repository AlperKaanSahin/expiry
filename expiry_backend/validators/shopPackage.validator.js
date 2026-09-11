const { body } = require('express-validator');

// Her ürün girdisi ya { id, quantity } (var olan ürün) ya da
// { newProduct: { name, price, expiryDate }, quantity } (yeni ürün) formatında
// olmalı. Wildcard zincirler (products.*.id) koşullu "ya biri ya diğeri" mantığını
// ifade edemediği için dizinin tamamı tek bir custom validator ile kontrol ediliyor.
// SKT (expiryDate), platformun temel değer önerisi olduğu için yeni ürün path'inde
// zorunlu tutuluyor.
const validateProductsArray = (products) => {
  if (!Array.isArray(products) || products.length === 0) {
    throw new Error('En az bir ürün seçilmeli');
  }

  products.forEach((p, index) => {
    if (p == null || typeof p !== 'object') {
      throw new Error(`Ürün ${index + 1}: geçersiz format`);
    }

    const hasId = p.id !== undefined && p.id !== null;
    const hasNewProduct = p.newProduct !== undefined && p.newProduct !== null;

    if (hasId && hasNewProduct) {
      throw new Error(`Ürün ${index + 1}: "id" ve "newProduct" aynı anda gönderilemez`);
    }

    if (!hasId && !hasNewProduct) {
      throw new Error(`Ürün ${index + 1}: "id" veya "newProduct" zorunlu`);
    }

    if (hasId) {
      const idNum = Number(p.id);
      if (!Number.isInteger(idNum) || idNum < 1) {
        throw new Error(`Ürün ${index + 1}: geçerli bir ürün ID giriniz`);
      }
    }

    if (hasNewProduct) {
      const { name, price, expiryDate } = p.newProduct;
      if (typeof name !== 'string' || !name.trim()) {
        throw new Error(`Ürün ${index + 1}: yeni ürün adı zorunlu`);
      }
      const priceNum = Number(price);
      if (price === undefined || price === null || isNaN(priceNum) || priceNum < 0) {
        throw new Error(`Ürün ${index + 1}: yeni ürün için geçerli bir fiyat zorunlu`);
      }
      if (!expiryDate || isNaN(new Date(expiryDate).getTime())) {
        throw new Error(`Ürün ${index + 1}: yeni ürün için son kullanma tarihi zorunlu`);
      }
    }

    const qtyNum = Number(p.quantity);
    if (!Number.isInteger(qtyNum) || qtyNum < 1) {
      throw new Error(`Ürün ${index + 1}: ürün miktarı en az 1 olmalı`);
    }
  });

  return true;
};

exports.createPackage = [
  body('name')
    .optional({ nullable: true, checkFalsy: true })
    .notEmpty()
    .withMessage('Paket adı boş bırakılamaz (belirtilmezse otomatik oluşturulur)'),
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
    .custom(validateProductsArray),
];

exports.updatePackage = [
  body('name')
    .optional({ nullable: true, checkFalsy: true })
    .isString()
    .withMessage('Paket adı metin olmalı'),
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
  body('products')
    .optional()
    .custom(validateProductsArray),
];