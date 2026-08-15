
require('dotenv').config();
const iyzipay = require('../config/iyzico');
const Iyzipay = require('iyzipay');

const request = {
  locale: Iyzipay.LOCALE.TR,
  conversationId: 'test-' + Date.now(),
  binNumber: '552879', // sandbox test kartının ilk 6 hanesi
};

iyzipay.binNumber.retrieve(request, (err, result) => {
  if (err) {
    console.error('HATA:', err);
    return;
  }
  console.log('SONUÇ:', result);
});