const shopService = require('../services/shopService');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');

const getMyShop = catchAsync(async (req, res) => {
  const shop = await shopService.getMyShop(req.user.id);
  if (!shop) throw new AppError('Market bulunamadı', 404);

  const status = shop.status === 'pending' ? 'PENDING' : 'ACTIVE';
  res.json({ status, shop });
});

const getMyShopProfile = catchAsync(async (req, res) => {
  const shop = await shopService.getMyShopProfile(req.user.id);
  if (!shop) throw new AppError('Market bulunamadı', 404);
  res.json({ shop });
});

const list = catchAsync(async (req, res) => {
  const shops = await shopService.listActiveShops();
  res.json(shops);
});

const getShopWithPackages = catchAsync(async (req, res) => {
  const shop = await shopService.getShopWithPackages(req.params.id);
  if (!shop) throw new AppError('Market bulunamadı', 404);
  res.json(shop);
});

const rateShop = catchAsync(async (req, res) => {
  const result = await shopService.rateShop(
    req.user.id,
    req.body.shopId,
    req.body.rating,
    req.body.orderId
  );
  res.json(result);
});

const canRateShop = catchAsync(async (req, res) => {
  const result = await shopService.canRateShop(req.user.id, req.params.shopId);
  res.json(result);
});

const applyShop = catchAsync(async (req, res) => {
  const shop = await shopService.applyShop(req.user.id, req.body);
  res.json({ message: 'Başvuru alındı', shop });
});

const updateShopProfile = catchAsync(async (req, res) => {
  const shop = await shopService.updateShopProfile(req.user.id, req.body);
  res.json({ message: 'Profil güncellendi', shop });
});

const getPaymentSettings = catchAsync(async (req, res) => {
  const settings = await shopService.getPaymentSettings(req.user.id);
  res.json({ settings });
});

const updatePaymentSettings = catchAsync(async (req, res) => {
  const result = await shopService.updatePaymentSettings(req.user.id, req.body);
  res.json({ message: 'Ödeme bilgileri güncellendi', ...result });
});
const updateCoverPhoto = catchAsync(async (req, res) => {
  if (!req.file) {
    throw new AppError('Fotoğraf dosyası gerekli', 400);
  }

  const shop = await shopService.updateCoverPhoto(
    req.user.id,
    req.file.buffer,
    req.file.originalname,
    req.file.mimetype
  );

  res.json({ message: 'Kapak fotoğrafı güncellendi', shop });
});
module.exports = {
  list, getShopWithPackages, rateShop, canRateShop, applyShop,
  getMyShop, getMyShopProfile, updateShopProfile,
  getPaymentSettings, updatePaymentSettings, updateCoverPhoto
};