const util = require('util');
const Iyzipay = require('iyzipay');
const getIyzico = require('../config/iyzico');

async function createOrUpdateSubMerchant(shop, data) {
  const iyzipay = getIyzico();

  const createSubMerchantAsync = util
    .promisify(iyzipay.subMerchant.create)
    .bind(iyzipay.subMerchant);

  const updateSubMerchantAsync = util
    .promisify(iyzipay.subMerchant.update)
    .bind(iyzipay.subMerchant);

  const isCompany =
    data.subMerchantType === 'LIMITED_OR_JOINT_STOCK_COMPANY';

  const baseRequest = {
    locale: Iyzipay.LOCALE.TR,
    conversationId: `shop-${shop.id}-${Date.now()}`,
    subMerchantExternalId: `shop-${shop.id}`,
    subMerchantType: data.subMerchantType,
    address: shop.address,
    iban: data.iban,
    email: data.email,
    gsmNumber: shop.phone,
    name: shop.name,
    currency: Iyzipay.CURRENCY.TRY,
  };

  const request = isCompany
    ? {
        ...baseRequest,
        taxOffice: data.taxOffice,
        taxNumber: data.taxNumber,
        legalCompanyTitle: data.legalCompanyTitle,
      }
    : {
        ...baseRequest,
        identityNumber: data.identityNumber,
        contactName: data.contactName,
        contactSurname: data.contactSurname,
      };

  const isUpdate = !!shop.subMerchantKey;

  if (isUpdate) {
    const { subMerchantType, ...updateRequest } = request;

    return updateSubMerchantAsync({
      ...updateRequest,
      subMerchantKey: shop.subMerchantKey,
    });
  }

  return createSubMerchantAsync(request);
}

module.exports = { createOrUpdateSubMerchant };