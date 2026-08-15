const { Shop, User, Package, PackageProduct, ShopProduct, ShopRating, Order } = require('../models');
const { createNotification } = require('./notificationService');
const { Op } = require('sequelize');
const iyzicoService = require('./iyzicoService');
const AppError = require('../utils/AppError');

exports.applyShop = async (userId, data) => {
  if (!data?.name || !data?.address || !data?.phone) {
    throw new AppError('Eksik market bilgisi', 400);
  }

  const existingShop = await Shop.findOne({ where: { ownerId: userId } });

  if (!existingShop) {
    const shop = await Shop.create({
      name: data.name,
      address: data.address,
      phone: data.phone,
      ownerId: userId,
      status: 'pending'
    });

    await notifyAdmin(`${data.name} yeni market başvurusu yaptı`, 'SHOP_APPLY');
    return shop;
  }

  const status = existingShop.status?.toLowerCase();

  if (status === 'active') throw new AppError('Zaten aktif bir marketiniz var', 409);
  if (status === 'pending') throw new AppError('Başvurunuz zaten inceleniyor', 409);

  if (status === 'rejected') {
    existingShop.name = data.name;
    existingShop.address = data.address;
    existingShop.phone = data.phone;
    existingShop.status = 'pending';
    await existingShop.save();

    await notifyAdmin(`${existingShop.name} tekrar başvuru yaptı`, 'SHOP_REAPPLY');
    return existingShop;
  }

  throw new AppError('Geçersiz market durumu', 500);
};

async function notifyAdmin(message, type) {
  const admin = await User.findOne({ where: { role: 'admin' } });
  if (!admin) return;

  await createNotification({
    userId: admin.id,
    type,
    title: 'Market Başvurusu',
    message
  });
}

exports.getMyShop = async (userId) => {
  const shop = await Shop.findOne({ where: { ownerId: userId } });
  if (!shop) return null;
  return shop;
};

exports.getMyShopProfile = async (userId) => {
  const shop = await Shop.findOne({ where: { ownerId: userId } });
  if (!shop) return null;
  return shop;
};

exports.listActiveShops = async () => {
  return await Shop.findAll({ where: { status: 'active' } });
};

exports.getShopWithPackages = async (shopId) => {
  return await Shop.findByPk(shopId, {
    include: [{
      model: Package,
      include: [{
        model: PackageProduct,
        include: [{ model: ShopProduct }]
      }]
    }]
  });
};

exports.updateShopProfile = async (userId, data) => {
  const shop = await Shop.findOne({ where: { ownerId: userId } });
  if (!shop) throw new AppError('Market bulunamadı', 404);

  const { name, address, phone } = data;
  shop.name = name || shop.name;
  shop.address = address || shop.address;
  shop.phone = phone || shop.phone;
  await shop.save();

  return shop;
};

exports.canRateShop = async (userId, shopId) => {
  const completedOrder = await Order.findOne({
    where: {
      userId,
      shopId,
      status: { [Op.in]: ['confirmed', 'released'] },
    },
  });

  if (!completedOrder) {
    return { canRate: false, reason: 'Henüz tamamlanmış siparişiniz yok' };
  }

  const existingRating = await ShopRating.findOne({
    where: { userId, shopId, orderId: completedOrder.id },
  });

  if (existingRating) {
    return { canRate: false, reason: 'Bu sipariş için zaten puan verdiniz' };
  }

  return { canRate: true, orderId: completedOrder.id };
};

exports.rateShop = async (userId, shopId, rating, orderId) => {
  if (!rating || rating < 1 || rating > 5) {
    throw new AppError('Puan 1 ile 5 arasında olmalı', 400);
  }

  const shop = await Shop.findByPk(shopId);
  if (!shop) throw new AppError('Market bulunamadı', 404);

  const order = await Order.findOne({
    where: { id: orderId, userId, shopId, status: ['confirmed', 'released'] }
  });

  if (!order) {
    throw new AppError('Geçersiz sipariş', 404);
  }

  const existing = await ShopRating.findOne({ where: { userId, shopId, orderId } });

  if (existing) {
    throw new AppError('Bu sipariş için zaten puan verdiniz', 409);
  }

  await ShopRating.create({ shopId, userId, rating, orderId });

  const newCount = shop.ratingCount + 1;
  const newAverage = ((shop.ratingAverage * shop.ratingCount) + rating) / newCount;

  await shop.update({
    ratingCount: newCount,
    ratingAverage: parseFloat(newAverage.toFixed(2))
  });

  return {
    success: true,
    ratingAverage: shop.ratingAverage,
    ratingCount: newCount
  };
};

exports.getPaymentSettings = async (userId) => {
  const shop = await Shop.findOne({ where: { ownerId: userId } });
  if (!shop) throw new AppError('Market bulunamadı', 404);

  return {
    subMerchantType: shop.subMerchantType,
    iban: shop.iban,
    identityNumber: shop.identityNumber,
    taxNumber: shop.taxNumber,
    taxOffice: shop.taxOffice,
    legalCompanyTitle: shop.legalCompanyTitle,
    subMerchantStatus: shop.subMerchantStatus,
  };
};

exports.updatePaymentSettings = async (userId, data) => {
  const shop = await Shop.findOne({
    where: { ownerId: userId },
    include: [{ model: User, as: 'owner' }],
  });
  if (!shop) throw new AppError('Market bulunamadı', 404);
  if (shop.status !== 'active') {
    throw new AppError('Ödeme bilgilerini yalnızca onaylı marketler ekleyebilir', 403);
  }

  const { subMerchantType, iban, identityNumber, taxNumber, taxOffice, legalCompanyTitle, email } = data;

  if (!subMerchantType || !['PERSONAL', 'LIMITED_OR_JOINT_STOCK_COMPANY'].includes(subMerchantType)) {
    throw new AppError('Geçersiz işletme tipi', 400);
  }
  if (!iban) throw new AppError('IBAN zorunlu', 400);
  if (!email) throw new AppError('Email zorunlu', 400);

  if (subMerchantType === 'PERSONAL') {
    if (!identityNumber) throw new AppError('Kimlik numarası zorunlu', 400);
  } else {
    if (!taxNumber || !taxOffice || !legalCompanyTitle) {
      throw new AppError('Vergi numarası, vergi dairesi ve şirket unvanı zorunlu', 400);
    }
  }

  const iyzicoResult = await iyzicoService.createOrUpdateSubMerchant(shop, {
    subMerchantType,
    iban,
    identityNumber,
    taxNumber,
    taxOffice,
    legalCompanyTitle,
    email,
    contactName: shop.owner?.firstName || '',
    contactSurname: shop.owner?.lastName || '',
  });
  console.log('=== IYZICO RESULT ===', iyzicoResult);

  shop.subMerchantType = subMerchantType;
  shop.iban = iban;
  shop.identityNumber = identityNumber || null;
  shop.taxNumber = taxNumber || null;
  shop.taxOffice = taxOffice || null;
  shop.legalCompanyTitle = legalCompanyTitle || null;

  if (iyzicoResult.status === 'success') {
    shop.subMerchantKey = iyzicoResult.subMerchantKey;
    shop.subMerchantStatus = 'active';
  } else {
    shop.subMerchantStatus = 'failed';
  }

  await shop.save();

  if (iyzicoResult.status !== 'success') {
    // 502: hata bizim doğrulamamızdan değil, dış servisten (Iyzico) geliyor
    throw new AppError(iyzicoResult.errorMessage || 'Iyzico kaydı başarısız oldu', 502);
  }

  return {
    subMerchantStatus: shop.subMerchantStatus,
    subMerchantKey: shop.subMerchantKey,
  };
};