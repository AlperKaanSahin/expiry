const { Shop, User } = require('../models');
const { createNotification } = require('./notificationService');

exports.applyShop = async (userId, data) => {
  const existingShop = await Shop.findOne({
    where: { ownerId: userId }
  });

  console.log("apply shop hit");
  console.log("userid:", userId);
  console.log("data:", data);

  // -------------------------
  // VALIDATION
  // -------------------------
  if (!data?.name || !data?.address || !data?.phone) {
    throw new Error("missing shop data");
  }

  // -------------------------
  // FIRST TIME APPLY
  // -------------------------
  if (!existingShop) {
    const shop = await Shop.create({
      name: data.name,
      address: data.address,
      phone: data.phone,
      ownerId: userId,
      status: 'pending'
    });
const admin = await User.findOne({
  where: { role: 'admin' }
});
    // 🔥 NOTIFICATION → ADMIN
await createNotification({
  userId: admin.id,
  type: 'SHOP_REAPPLY',
  title: 'Market Başvurusu Güncellendi',
  message: `${existingShop.name} tekrar başvuru yaptı`
});

    return shop;
  }

  const status = existingShop.status?.toLowerCase();

  // -------------------------
  // ACTIVE SHOP
  // -------------------------
  if (status === 'active') {
    throw new Error('zaten aktif bir marketiniz var');
  }

  // -------------------------
  // PENDING SHOP
  // -------------------------
  if (status === 'pending') {
    throw new Error('başvurunuz zaten inceleniyor');
  }

  // -------------------------
  // REJECTED → RE-APPLY
  // -------------------------
  if (status === 'rejected') {
    existingShop.name = data.name;
    existingShop.address = data.address;
    existingShop.phone = data.phone;
    existingShop.status = 'pending';

    await existingShop.save();
  const admin = await User.findOne({
    where: { role: 'admin' }
  });
    // 🔥 NOTIFICATION → ADMIN
    await createNotification({
      userId: admin.id,
      type: 'SHOP_REAPPLY',
      title: 'Market Başvurusu Güncellendi',
      message: `${existingShop.name} tekrar başvuru yaptı`
    });

    return existingShop;
  }

  throw new Error('invalid shop state');
};