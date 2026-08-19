const Iyzipay = require('iyzipay');

let iyzipay;

function getIyzico() {
  if (!iyzipay) {
    iyzipay = new Iyzipay({
      apiKey: process.env.IYZICO_API_KEY,
      secretKey: process.env.IYZICO_SECRET_KEY,
      uri: process.env.IYZICO_BASE_URL,
    });
  }

  return iyzipay;
}

module.exports = getIyzico;