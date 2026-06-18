const { Shop, User, Package, PackageProduct, ShopProduct,  ShopRating, Order } = require('../models');
const { createNotification } = require('./notificationService');

exports.applyShop = async (userId, data) => {
  if (!data?.name || !data?.address || !data?.phone) {
    throw new Error('Eksik market bilgisi');
  }

  const existingShop = await Shop.findOne({ where: { ownerId: userId } });

  // İlk başvuru
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

  if (status === 'active') throw new Error('Zaten aktif bir marketiniz var');
  if (status === 'pending') throw new Error('Başvurunuz zaten inceleniyor');

  if (status === 'rejected') {
    existingShop.name = data.name;
    existingShop.address = data.address;
    existingShop.phone = data.phone;
    existingShop.status = 'pending';
    await existingShop.save();

    await notifyAdmin(`${existingShop.name} tekrar başvuru yaptı`, 'SHOP_REAPPLY');
    return existingShop;
  }

  throw new Error('Geçersiz market durumu');
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
  if (!shop) throw new Error('Market bulunamadı');

  const { name, address, phone } = data;
  shop.name = name || shop.name;
  shop.address = address || shop.address;
  shop.phone = phone || shop.phone;
  await shop.save();

  return shop;
};


exports.canRateShop = async (userId, shopId) => {
  // Kullanıcının o marketten tamamlanmış siparişi var mı?
  const completedOrder = await Order.findOne({
    where: {
      userId,
      shopId,
      status: 'confirmed'
    }
  });

  if (!completedOrder) {
    return { canRate: false, reason: 'Henüz tamamlanmış siparişiniz yok' };
  }

  // Daha önce bu sipariş için puan vermiş mi?
  const existingRating = await ShopRating.findOne({
    where: { userId, shopId, orderId: completedOrder.id }
  });

  if (existingRating) {
    return { canRate: false, reason: 'Bu sipariş için zaten puan verdiniz' };
  }

  return { canRate: true, orderId: completedOrder.id };
};


exports.rateShop = async (userId, shopId, rating, orderId) => {
  if (!rating || rating < 1 || rating > 5) {
    throw new Error('Puan 1 ile 5 arasında olmalı');
  }

  const shop = await Shop.findByPk(shopId);
  if (!shop) throw new Error('Market bulunamadı');

  // Sipariş kontrolü (bu user + shop + order uyumlu mu?)
  const order = await Order.findOne({
    where: {
      id: orderId,
      userId,
      shopId,
      status: 'confirmed'
    }
  });

  if (!order) {
    throw new Error('Geçersiz sipariş');
  }

  // Daha önce rating verilmiş mi?
  const existing = await ShopRating.findOne({
    where: { userId, shopId, orderId }
  });

  if (existing) {
    throw new Error('Bu sipariş için zaten puan verdiniz');
  }

  // Rating oluştur
  await ShopRating.create({
    shopId,
    userId,
    rating,
    orderId
  });

  // Ortalama güncelle
  const newCount = shop.ratingCount + 1;
  const newAverage =
    ((shop.ratingAverage * shop.ratingCount) + rating) / newCount;

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