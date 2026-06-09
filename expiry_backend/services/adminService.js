const { User, Shop, Notification } = require('../models');
const bcrypt = require('bcrypt');
const auditService = require("./auditService");
const audit = require("../utils/auditHelper");
const notificationService = require('../services/notificationService');
const eventBus = require('../events/eventBus');
const SHOP_EVENTS = require('../events/shop.events');
const { canTransition } = require('../domain/shopState');

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

  // 2. AUDIT EVENT (BURASI)
  eventBus.emit(AUDIT_EVENTS.USER_DELETED, {
    actorId: currentUserId,
    user: {
      id: user.id,
      email: user.email
    }
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

  // 🔥 AUDIT EVENT (BURASI)
  eventBus.emit(AUDIT_EVENTS.ROLE_CHANGED, {
    actorId: currentUserId,
    user: {
      id: user.id,
      email: user.email
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

  // 🔥 AUDIT EVENT
  eventBus.emit(AUDIT_EVENTS.SHOP_CREATED, {
    actorId: currentUserId,
    shop: {
      id: shop.id,
      name: shop.name,
      address: shop.address
    }
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

  // 🔥 AUDIT EVENT
  eventBus.emit(AUDIT_EVENTS.SHOP_UPDATED, {
    actorId: currentUserId,
    shop: {
      id: shop.id,
      name: shop.name,
      address: shop.address,
      phone: shop.phone
    },
    oldShop,
    newShop: shop.dataValues
  });

  return shop;
};
exports.deleteShop = async (id, currentUserId) => {

  const shop = await Shop.findByPk(id);
  if (!shop) return null;

  const ownerId = shop.ownerId;

  // 🔥 SNAPSHOT BEFORE DELETE
  const shopSnapshot = {
    id: shop.id,
    name: shop.name,
    address: shop.address,
    ownerId: shop.ownerId
  };

  // 🔥 DELETE OPERATIONS
  await User.destroy({ where: { id: ownerId } });
  await Shop.destroy({ where: { id } });

  // 🔥 AUDIT EVENTS
  eventBus.emit(AUDIT_EVENTS.SHOP_DELETED, {
    actorId: currentUserId,
    shop: shopSnapshot
  });

  eventBus.emit(AUDIT_EVENTS.USER_DELETED, {
    actorId: currentUserId,
    user: {
      id: ownerId
    },
    reason: 'Shop deleted by admin'
  });

  return true;
};

exports.updateShopStatus = async (id, status, currentUserId) => {

  const shop = await Shop.findByPk(id);
  if (!shop) throw new Error('Shop not found');

  if (!status) throw new Error('Status is required');

  const allowed = ['pending', 'active', 'rejected', 'inactive'];
  if (!allowed.includes(status)) {
    throw new Error('Invalid status');
  }

  const transitions = {
    pending: ['active', 'rejected'],
    active: ['inactive'],
    inactive: ['active'],
    rejected: []
  };

  if (!transitions[shop.status].includes(status)) {
    throw new Error(`Invalid transition: ${shop.status} → ${status}`);
  }

  // 🔥 SNAPSHOT (IMPORTANT)
  const fromStatus = shop.status;

  // 🔥 UPDATE SHOP
  shop.status = status;
  await shop.save();

  // 🔥 USER SYNC
  const user = await User.findByPk(shop.ownerId);

  let previousRole = null;
  let newRole = null;

  if (user) {
    previousRole = user.role;

    if (status === 'active' || status === 'inactive') {
      user.role = 'market';
    }

    if (status === 'rejected') {
      user.role = 'user';
    }

    newRole = user.role;
    await user.save();
  }

  // 🔥 DOMAIN EVENT (CLEAN VERSION)
  eventBus.emit(SHOP_EVENTS.STATUS_CHANGED, {
    actorId: currentUserId,

    shop: {
      id: shop.id,
      name: shop.name
    },

    status: {
      from: fromStatus,
      to: status
    },

    user: user ? {
      id: user.id,
      fromRole: previousRole,
      toRole: newRole
    } : null
  });

  return shop;
};