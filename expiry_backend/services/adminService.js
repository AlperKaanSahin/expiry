const { User, Shop, Notification } = require('../models');
const bcrypt = require('bcrypt');
const auditService = require("./auditService");
const audit = require("../utils/auditHelper");
  const notificationService = require('../services/notificationService');

// USERS
exports.getAllUsers = async (page = 1, limit = 10) => {
  const offset = (page - 1) * limit;

  const users = await User.findAndCountAll({
    attributes: { exclude: ['password', 'deletedAt'] },
    limit,
    offset
  });


  return users;
};

exports.deleteUser = async (targetUserId, currentUserId) => {

  if (targetUserId === currentUserId) {
    throw new Error('You cannot delete your own account');
  }

  const user = await User.findByPk(targetUserId);

  if (!user) {
    throw new Error('User not found');
  }

  // 1. delete
  await user.destroy();

  // 2. audit (1 satır!)
  await audit.userDeleted({
    actorId: currentUserId,
    user
  });

  return true;
};

exports.getUserById = async (id) => {
  return await User.findByPk(id, {
    attributes: { exclude: ['password', 'deletedAt'] }
  });
};


exports.updateUserRole = async (userId, role, currentUserId) => {

  const user = await User.findByPk(userId);

  if (!user) {
    throw new Error('User not found');
  }

const oldRole = user.role;

user.role = role;
await user.save();

await audit.roleChanged({
  actorId: currentUserId,
  user: {
    id: user.id,
    email: user.email,
    role: user.role
  },
  oldRole,
  newRole: role
});

  return user;
};

// MARKETS
exports.getAllShops = async () => {
  return await Shop.findAll({
    order: [['createdAt', 'DESC']]
  });
};

exports.createShop = async ({ name, address, phone }, currentUserId) => {

  const shop = await Shop.create({ name, address, phone });

  await audit.shopCreated({
    actorId: currentUserId,
    shop
  });

  return shop;
};

exports.updateShop = async (id, data, currentUserId) => {

  const shop = await Shop.findByPk(id);
  if (!shop) return null;

  // 1. old snapshot
  const oldShop = { ...shop.dataValues };

  // 2. update
  shop.name = data.name;
  shop.address = data.address;
  shop.phone = data.phone;

  await shop.save();

  // 3. audit
  await audit.shopUpdated({
    actorId: currentUserId,
    oldShop,
    newShop: shop
  });

  return shop;
};
exports.deleteShop = async (id, currentUserId) => {

  const shop = await Shop.findByPk(id);
  if (!shop) return null;

  // 1. audit BEFORE delete (data lazım olduğu için)
  const ownerId = shop.ownerId;

  // 2. delete user + shop
  await User.destroy({ where: { id: ownerId } });
  await Shop.destroy({ where: { id } });

  // 3. audit AFTER delete
  await audit.shopDeleted({
    actorId: currentUserId,
    shop
  });

  await audit.userDeleted({
    actorId: currentUserId,
    user: {
      id: ownerId,
      email: null // çünkü user silindi
    }
  });

  return true;
};

exports.updateShopStatus = async (id, status) => {

  const allowed = ['pending', 'active', 'rejected'];
  if (!allowed.includes(status)) {
    throw new Error('Invalid status');
  }

  const shop = await Shop.findByPk(id);
  if (!shop) throw new Error('Shop not found');

  shop.status = status;
  await shop.save();

  // 🔥 USER ROLE SYNC
  const user = await User.findByPk(shop.ownerId);

  if (user) {
    if (status === 'active') {
      user.role = 'market';
    } else {
      user.role = 'user';
    }

    await user.save();
  }

  // 🔔 NOTIFICATION (BURASI EKLENİYOR)


  if (status === 'active') {
    await notificationService.createNotification({
      userId: shop.ownerId,
      title: 'Market Başvurusu Onaylandı',
      message: 'Market başvurunuz onaylandı. Artık market paneline erişebilirsiniz.',
      type: 'SHOP_APPROVED',
      targetId: shop.id
    });
  }

  if (status === 'rejected') {
    await notificationService.createNotification({
      userId: shop.ownerId,
      title: 'Market Başvurusu Reddedildi',
      message: 'Market başvurunuz reddedildi.',
      type: 'SHOP_REJECTED',
      targetId: shop.id
    });
  }

  return shop;
};