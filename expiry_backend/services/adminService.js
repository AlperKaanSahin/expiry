const { User, Shop, AuditLog } = require('../models');
const { sequelize } = require('../models');
const eventBus = require('../events/eventBus');
const AUDIT_EVENTS = require('../events/audit.events');
const SHOP_EVENTS = require('../events/shop.events');
const AppError = require('../utils/AppError');

exports.getAllUsers = async (page = 1, limit = 10) => {
  const offset = (page - 1) * limit;

  const users = await User.findAndCountAll({
    attributes: { exclude: ['password', 'deletedAt'] },
    limit,
    offset
  });

  return users;
};

exports.getUserById = async (id) => {
  return await User.findByPk(id, {
    attributes: { exclude: ['password', 'deletedAt'] }
  });
};

exports.updateUserRole = async (userId, role, currentUserId) => {
  const validRoles = ['user', 'market', 'admin'];
  if (!validRoles.includes(role)) {
    throw new AppError('Geçersiz rol', 400);
  }

  const user = await User.findByPk(userId);
  if (!user) throw new AppError('Kullanıcı bulunamadı', 404);

  const oldRole = user.role;
  user.role = role;
  await user.save();

  eventBus.emit(AUDIT_EVENTS.ROLE_CHANGED, {
    actorId: currentUserId,
    user: { id: user.id, email: user.email },
    oldRole,
    newRole: role
  });

  return user;
};

exports.deleteUser = async (targetUserId, currentUserId) => {
  if (targetUserId === currentUserId) {
    throw new AppError('Kendi hesabınızı silemezsiniz', 400);
  }

  const user = await User.findByPk(targetUserId);
  if (!user) throw new AppError('Kullanıcı bulunamadı', 404);

  await user.destroy();

  eventBus.emit(AUDIT_EVENTS.USER_DELETED, {
    actorId: currentUserId,
    user: { id: user.id, email: user.email }
  });

  return true;
};

exports.getAllShops = async (page = 1, limit = 10) => {
  const offset = (page - 1) * limit;

  const { count, rows } = await Shop.findAndCountAll({
    include: [{
      model: User,
      as: 'owner',
      attributes: ['id', 'firstName', 'lastName', 'email'],
    }],
    order: [['createdAt', 'DESC']],
    limit,
    offset
  });

  return {
    total: count,
    page,
    limit,
    shops: rows
  };
};

exports.updateShop = async (id, data, currentUserId) => {
  const shop = await Shop.findByPk(id);
  if (!shop) throw new AppError('Market bulunamadı', 404);

  const oldShop = { ...shop.dataValues };

  shop.name = data.name;
  shop.address = data.address;
  shop.phone = data.phone;

  try {
    await shop.save();
  } catch (err) {
    if (err.name === 'SequelizeUniqueConstraintError') {
      throw new AppError('Bu market adı zaten kullanılıyor', 409);
    }
    throw err;
  }

  eventBus.emit(AUDIT_EVENTS.SHOP_UPDATED, {
    actorId: currentUserId,
    shop: { id: shop.id, name: shop.name, address: shop.address, phone: shop.phone },
    oldShop,
    newShop: shop.dataValues
  });

  return shop;
};

exports.deleteShop = async (id, currentUserId) => {
  const shop = await Shop.findByPk(id);
  if (!shop) throw new AppError('Market bulunamadı', 404);

  const shopSnapshot = {
    id: shop.id,
    name: shop.name,
    address: shop.address,
    ownerId: shop.ownerId
  };

  const t = await sequelize.transaction();
  try {
    await User.destroy({ where: { id: shop.ownerId }, transaction: t });
    await Shop.destroy({ where: { id }, transaction: t }); // düzeltildi
    await t.commit();
  } catch (err) {
    await t.rollback();
    throw err;
  }

  eventBus.emit(AUDIT_EVENTS.SHOP_DELETED, {
    actorId: currentUserId,
    shop: shopSnapshot
  });

  eventBus.emit(AUDIT_EVENTS.USER_DELETED, {
    actorId: currentUserId,
    user: { id: shop.ownerId },
    reason: 'Shop deleted by admin'
  });

  return true;
};

exports.updateShopStatus = async (id, status, currentUserId) => {
  const shop = await Shop.findByPk(id);
  if (!shop) throw new AppError('Market bulunamadı', 404);

  if (!status) throw new AppError('Status zorunlu', 400);

  const allowed = ['pending', 'active', 'rejected', 'inactive'];
  if (!allowed.includes(status)) throw new AppError('Geçersiz status', 400);

  const transitions = {
    pending: ['active', 'rejected'],
    active: ['inactive'],
    inactive: ['active'],
    rejected: []
  };

  if (!transitions[shop.status].includes(status)) {
    throw new AppError(`Geçersiz geçiş: ${shop.status} → ${status}`, 400);
  }

  const fromStatus = shop.status;
  shop.status = status;
  await shop.save();

  const user = await User.findByPk(shop.ownerId);
  let previousRole = null;
  let newRole = null;

  if (user) {
    previousRole = user.role;
    user.role = status === 'rejected' ? 'user' : 'market';
    newRole = user.role;
    await user.save();
  }

  eventBus.emit(SHOP_EVENTS.STATUS_CHANGED, {
    actorId: currentUserId,
    shop: { id: shop.id, name: shop.name },
    status: { from: fromStatus, to: status },
    user: user ? { id: user.id, fromRole: previousRole, toRole: newRole } : null
  });

  return shop;
};

exports.getAuditLogs = async (page = 1, limit = 20) => {
  const offset = (page - 1) * limit;

  return await AuditLog.findAndCountAll({
    order: [['createdAt', 'DESC']],
    limit,
    offset
  });
};