require('dotenv').config();
const getIyzico = require('../config/iyzico');
const iyzipay = getIyzico();

const request = {
  locale: 'tr',
  conversationId: 'test-submerchant-' + Date.now(),
  subMerchantExternalId: 'test-shop-001',
  subMerchantType: 'PERSONAL',
  address: 'Test Adres, Samsun',
  contactName: 'Test',
  contactSurname: 'Kullanici',
  email: 'test@example.com',
  gsmNumber: '+905000000000',
  name: 'Test İşletme',
  iban: 'TR180006200119000006672315',
  identityNumber: '11111111111',
  currency: 'TRY',
};

iyzipay.subMerchant.create(request, (err, result) => {
  if (err) {
    console.error('HATA:', err);
    return;
  }
  console.log('SONUÇ:', result);
});