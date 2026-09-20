const util = require('util');
const crypto = require('crypto');
const Iyzipay = require('iyzipay');
const getIyzico = require('../config/iyzico');
const AppError = require('../utils/AppError');

// ---------------------------------------------------------------
// Doğrulama yardımcıları (submerchant onboarding için)
// ---------------------------------------------------------------

function isValidTcNo(tcNo) {
  if (typeof tcNo !== 'string' || !/^[1-9][0-9]{10}$/.test(tcNo)) return false;

  const digits = tcNo.split('').map(Number);
  const oddSum = digits[0] + digits[2] + digits[4] + digits[6] + digits[8];
  const evenSum = digits[1] + digits[3] + digits[5] + digits[7];

  const digit10 = (oddSum * 7 - evenSum) % 10;
  const digit11 = (oddSum + evenSum + digits[9]) % 10;

  return digit10 === digits[9] && digit11 === digits[10];
}

function isValidTurkishIban(iban) {
  if (typeof iban !== 'string') return false;
  const cleaned = iban.replace(/\s/g, '').toUpperCase();
  if (!/^TR[0-9]{24}$/.test(cleaned)) return false;

  const rearranged = cleaned.slice(4) + cleaned.slice(0, 4);
  const numericString = rearranged.replace(/[A-Z]/g, (ch) => (ch.charCodeAt(0) - 55).toString());

  return BigInt(numericString) % 97n === 1n;
}

function isValidVkn(vkn) {
  return typeof vkn === 'string' && /^[0-9]{10}$/.test(vkn);
}

// ---------------------------------------------------------------
// Submerchant create / update
// ---------------------------------------------------------------

function buildSubMerchantRequest(shop, data) {
  const base = {
    locale: Iyzipay.LOCALE.TR,
    conversationId: `submerchant-${shop.id}-${Date.now()}`,
    subMerchantExternalId: `shop-${shop.id}`,
    subMerchantType: data.subMerchantType,
    address: shop.address,
    iban: data.iban,
    email: data.email,
    gsmNumber: shop.phone,
    name: shop.name,
    currency: Iyzipay.CURRENCY.TRY,
    contactName: data.contactName,
    contactSurname: data.contactSurname,
  };

  if (data.subMerchantType === 'PERSONAL') {
    return { ...base, identityNumber: data.identityNumber };
  }

  return {
    ...base,
    taxOffice: data.taxOffice,
    taxNumber: data.taxNumber,
    identityNumber: data.taxNumber,
    legalCompanyTitle: data.legalCompanyTitle,
  };
}

async function createOrUpdateSubMerchant(shop, data) {
  const iyzipay = getIyzico();

  const createSubMerchantAsync = util
    .promisify(iyzipay.subMerchant.create)
    .bind(iyzipay.subMerchant);
  const updateSubMerchantAsync = util
    .promisify(iyzipay.subMerchant.update)
    .bind(iyzipay.subMerchant);

  const request = buildSubMerchantRequest(shop, data);
  const isUpdate = !!shop.subMerchantKey;

  try {
    if (isUpdate) {
      const { subMerchantType, subMerchantExternalId, ...updateRequest } = request;
      return await updateSubMerchantAsync({
        ...updateRequest,
        subMerchantKey: shop.subMerchantKey,
      });
    }
    return await createSubMerchantAsync(request);
  } catch (err) {
    throw new AppError(`Iyzico submerchant hatası: ${err.message || err}`, 502);
  }
}

// ---------------------------------------------------------------
// Checkout Form — gerçek ödeme akışı
// ---------------------------------------------------------------

// Iyzico'nun buyer.identityNumber / registrationAddress / city / country alanları
// zorunlu ama gerçek zamanlı doğrulanmıyor (fraud-scoring amaçlı, submerchant
// onboarding'deki gibi gerçek kimlik kontrolü YOK). Kullanıcıdan bunları
// istemiyoruz — sabit, checksum'ı geçerli bir placeholder gönderiyoruz.
// Iyzico'nun kendi demo değerini (74300864791) KULLANMIYORUZ, ayırt edici olsun diye.
const PLACEHOLDER_BUYER_IDENTITY_NUMBER = '12345678950';
const PLACEHOLDER_BUYER_CITY = 'İstanbul';
const PLACEHOLDER_BUYER_COUNTRY = 'Turkey';
const PLACEHOLDER_BUYER_ADDRESS = 'Expiry kullanıcı adresi belirtilmedi';

function buildBuyer(user, requestIp) {
  return {
    id: String(user.id),
    name: user.firstName,
    surname: user.lastName,
    email: user.email,
    identityNumber: PLACEHOLDER_BUYER_IDENTITY_NUMBER,
    registrationAddress: user.address || PLACEHOLDER_BUYER_ADDRESS,
    city: PLACEHOLDER_BUYER_CITY,
    country: PLACEHOLDER_BUYER_COUNTRY,
    ip: requestIp || '0.0.0.0',
  };
}

function buildBillingAddress(user) {
  return {
    contactName: `${user.firstName} ${user.lastName}`,
    city: PLACEHOLDER_BUYER_CITY,
    country: PLACEHOLDER_BUYER_COUNTRY,
    address: user.address || PLACEHOLDER_BUYER_ADDRESS,
  };
}

/**
 * Bir order için Iyzico Checkout Form başlatır.
 *
 * @param {Object} order - Order instance (id, paidPrice set edilmiş olmalı)
 * @param {Array} basketItems - [{ id, name, price, subMerchantKey?, subMerchantPrice? }]
 *   Not: subMerchantKey/subMerchantPrice OLMAYAN item'lar (örn. platform fee)
 *   otomatik olarak ana Iyzico hesabına (senin hesabına) düşer.
 * @param {Object} user - Order sahibi User instance
 * @param {String} requestIp - req.ip (Express) — Docker/nginx arkasındaysan
 *   app.set('trust proxy', 1) ayarının açık olduğundan emin ol, yoksa proxy IP'si gelir.
 * @param {String} callbackUrl - Iyzico'nun ödeme sonrası POST edeceği backend endpoint'i
 */
async function initializeCheckoutForm(order, basketItems, user, requestIp, callbackUrl) {
  const iyzipay = getIyzico();
  const initializeAsync = util
    .promisify(iyzipay.checkoutFormInitialize.create)
    .bind(iyzipay.checkoutFormInitialize);

  const request = {
    locale: Iyzipay.LOCALE.TR,
    conversationId: `order-${order.id}-${Date.now()}`,
    price: basketItems.reduce((sum, item) => sum + item.price, 0).toFixed(2),
    paidPrice: Number(order.paidPrice).toFixed(2),
    currency: Iyzipay.CURRENCY.TRY,
    basketId: `order-${order.id}`,
    paymentGroup: Iyzipay.PAYMENT_GROUP.PRODUCT,
    callbackUrl,
    buyer: buildBuyer(user, requestIp),
    billingAddress: buildBillingAddress(user),
    basketItems: basketItems.map((item) => ({
      id: item.id,
      name: item.name,
      category1: 'Gıda',
      itemType: Iyzipay.BASKET_ITEM_TYPE.PHYSICAL,
      price: item.price.toFixed(2),
      ...(item.subMerchantKey ? { subMerchantKey: item.subMerchantKey } : {}),
      ...(item.subMerchantPrice != null
        ? { subMerchantPrice: item.subMerchantPrice.toFixed(2) }
        : {}),
    })),
  };

  try {
    const result = await initializeAsync(request);
    if (result.status !== 'success') {
      throw new AppError(result.errorMessage || 'Ödeme başlatılamadı', 502);
    }
    return result; // { token, paymentPageUrl, ... }
  } catch (err) {
    if (err instanceof AppError) throw err;
    throw new AppError(`Iyzico checkout başlatma hatası: ${err.message || err}`, 502);
  }
}

/**
 * Checkout Form sonucunu token ile sorgular. callbackUrl'e POST geldiğinde
 * bu ÇAĞRILMADAN önce ödeme durumuna GÜVENME — tek doğru kaynak bu fonksiyon.
 */
async function retrieveCheckoutForm(token) {
  const iyzipay = getIyzico();
  const retrieveAsync = util
    .promisify(iyzipay.checkoutForm.retrieve)
    .bind(iyzipay.checkoutForm);

  const request = {
    locale: Iyzipay.LOCALE.TR,
    conversationId: `retrieve-${token}-${Date.now()}`,
    token,
  };

  try {
    return await retrieveAsync(request);
    // result.paymentStatus: 'SUCCESS' | 'FAILURE' | ...
    // result.itemTransactions: [{ itemId, paymentTransactionId, price, ... }]
  } catch (err) {
    throw new AppError(`Iyzico checkout sorgulama hatası: ${err.message || err}`, 502);
  }
}

/**
 * Marketplace escrow'unu serbest bırakır — bir payment item'ı approve eder.
 * `confirmed` durumuna geçildiğinde her OrderPackage için çağrılmalı.
 */
async function approvePaymentTransaction(paymentTransactionId) {
  const iyzipay = getIyzico();
  const approveAsync = util.promisify(iyzipay.approval.create).bind(iyzipay.approval);

  const request = {
    locale: Iyzipay.LOCALE.TR,
    conversationId: `approve-${paymentTransactionId}-${Date.now()}`,
    paymentTransactionId,
  };

  try {
    const result = await approveAsync(request);
    if (result.status !== 'success') {
      throw new AppError(result.errorMessage || 'Ödeme onayı (approve) başarısız', 502);
    }
    return result;
  } catch (err) {
    if (err instanceof AppError) throw err;
    throw new AppError(`Iyzico approve hatası: ${err.message || err}`, 502);
  }
}

// ---------------------------------------------------------------
// Webhook signature verification (X-IYZ-SIGNATURE-V3)
// ---------------------------------------------------------------

// NOT: Checkout Form kullandığımız için "HPP Format" imza formülü geçerli
// (Direct Format ve Subscription Format'tan farklı alan sırası kullanıyor).
// Bu özelliğin hesapta aktif olması gerekiyor — bkz. entegrasyon@iyzico.com.
function verifyWebhookSignature(payload, signatureHeader) {
  if (!signatureHeader) return false;

  const secretKey = process.env.IYZICO_SECRET_KEY;
  const { iyziEventType, iyziPaymentId, token, paymentConversationId, status } = payload;

  const key = `${secretKey}${iyziEventType}${iyziPaymentId}${token}${paymentConversationId}${status}`;
  const expected = crypto.createHmac('sha256', secretKey).update(key).digest('hex');

  const expectedBuf = Buffer.from(expected, 'utf8');
  const providedBuf = Buffer.from(String(signatureHeader), 'utf8');

  // Uzunluk farklıysa timingSafeEqual exception fırlatır — önce kontrol et.
  if (expectedBuf.length !== providedBuf.length) return false;

  return crypto.timingSafeEqual(expectedBuf, providedBuf);
}

module.exports = {
  createOrUpdateSubMerchant,
  isValidTcNo,
  isValidTurkishIban,
  isValidVkn,
  initializeCheckoutForm,
  retrieveCheckoutForm,
  approvePaymentTransaction,
  verifyWebhookSignature,
};