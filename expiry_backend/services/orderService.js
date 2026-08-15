const {
  Order, OrderPackage, Package, PackageUnit, Shop, User, sequelize
} = require('../models');
const eventBus = require('../events/eventBus');
const ORDER_EVENTS = require('../events/order.events');
const crypto = require('crypto');
const AppError = require('../utils/AppError');

const transitions = {
  pending: ['paid'],
  paid: ['delivered'],
  delivered: ['confirmed'],
  confirmed: ['released']
};
const STATUS_GROUPS = {
  active: ['pending', 'paid', 'delivered'],
  past: ['confirmed', 'released'],
};

function canTransition(current, next) {
  return transitions[current]?.includes(next);
}

async function runSideEffects(order, status, transaction) {
  switch (status) {
    case 'paid':
      await reserveStock(order, transaction);

      const orderPackages = await OrderPackage.findAll({
        where: { orderId: order.id },
        include: [{ model: Package, attributes: ['deliveryStart', 'deliveryEnd', 'name'] }],
        transaction
      });

      const firstPackage = orderPackages[0]?.Package;
      const deliveryStart = firstPackage?.deliveryStart;
      const deliveryEnd = firstPackage?.deliveryEnd;

      eventBus.emit(ORDER_EVENTS.PAID, {
        orderId: order.id,
        userId: order.userId,
        shopId: order.shopId,
        deliveryStart,
        deliveryEnd,
      });
      break;

    case 'delivered':
      eventBus.emit(ORDER_EVENTS.DELIVERED, {
        orderId: order.id,
        userId: order.userId,
        shopId: order.shopId,
      });
      break;

    case 'confirmed':
      eventBus.emit(ORDER_EVENTS.CONFIRMED, {
        orderId: order.id,
        userId: order.userId,
        shopId: order.shopId,
      });
      break;

    case 'released':
      eventBus.emit(ORDER_EVENTS.RELEASED, {
        orderId: order.id,
        shopId: order.shopId,
      });
      break;
  }
}

async function reserveStock(order, transaction) {
  const orderPackages = await OrderPackage.findAll({
    where: { orderId: order.id },
    transaction
  });

  for (const opkg of orderPackages) {
    const units = await PackageUnit.findAll({
      where: { packageId: opkg.packageId, isSold: false },
      order: [['id', 'ASC']],
      limit: opkg.quantity,
      lock: transaction.LOCK.UPDATE,
      transaction
    });

    if (units.length < opkg.quantity) {
      throw new AppError('Stok yetersiz', 409);
    }

    for (const unit of units) {
      unit.isSold = true;
      await unit.save({ transaction });
    }

    const remaining = await PackageUnit.count({
      where: { packageId: opkg.packageId, isSold: false },
      transaction
    });

    await Package.update(
      { quantity: remaining },
      { where: { id: opkg.packageId }, transaction }
    );
  }
}

async function createOrder(userId, data) {
  const { shopId, packages } = data;

  const t = await sequelize.transaction();
  try {
    let totalPrice = 0;
    const validatedPackages = [];

    for (const pkg of packages) {
      const dbPackage = await Package.findOne({
        where: { id: pkg.packageId, shopId },
        transaction: t
      });

      if (!dbPackage) throw new AppError(`Geçersiz paket: ${pkg.packageId}`, 400);

      const available = await PackageUnit.count({
        where: { packageId: pkg.packageId, isSold: false },
        transaction: t
      });

      if (available < pkg.quantity) throw new AppError('Yeterli stok yok', 409);

      const realPrice = dbPackage.price;
      totalPrice += realPrice * pkg.quantity;

      validatedPackages.push({
        packageId: pkg.packageId,
        quantity: pkg.quantity,
        price: realPrice
      });
    }

    const deliveryToken = crypto.randomBytes(16).toString('hex');

    const order = await Order.create(
      { userId, shopId, totalPrice, status: 'pending', deliveryToken },
      { transaction: t }
    );

    for (const pkg of validatedPackages) {
      await OrderPackage.create(
        { orderId: order.id, packageId: pkg.packageId, quantity: pkg.quantity, price: pkg.price },
        { transaction: t }
      );
    }

    await t.commit();
    return order;
  } catch (err) {
    await t.rollback();
    throw err;
  }
}

async function confirmByQRCode(marketUserId, deliveryToken) {
  const t = await sequelize.transaction();
  try {
    const order = await Order.findOne({
      where: { deliveryToken, status: 'delivered' },
      include: [
        { model: User, attributes: ['id', 'firstName', 'lastName'] },
        {
          model: OrderPackage,
          include: [{ model: Package, attributes: ['id', 'name'] }]
        }
      ],
      transaction: t
    });

    if (!order) throw new AppError('Geçersiz veya süresi dolmuş QR kod', 404);

    const shop = await Shop.findOne({
      where: { id: order.shopId, ownerId: marketUserId },
      transaction: t
    });

    if (!shop) throw new AppError('Bu siparişe erişim yetkiniz yok', 403);

    await changeStatusInternal(order, 'confirmed', 'user', t);

    await t.commit();
    return order;
  } catch (err) {
    await t.rollback();
    throw err;
  }
}

async function simulatePayment(userId, orderId) {
  const t = await sequelize.transaction();
  try {
    const order = await Order.findOne({
      where: { id: orderId, userId },
      lock: t.LOCK.UPDATE,
      transaction: t
    });

    if (!order) throw new AppError('Sipariş bulunamadı veya erişim yetkiniz yok', 404);
    if (order.status !== 'pending') throw new AppError('Bu sipariş zaten işlenmiş', 409);

    await changeStatusInternal(order, 'paid', 'system', t);

    await t.commit();
    return { success: true, order };
  } catch (err) {
    await t.rollback();
    throw err;
  }
}

async function changeStatus(orderId, newStatus, actor = 'user', userId = null) {
  const t = await sequelize.transaction();
  try {
    const order = await Order.findOne({ where: { id: orderId }, transaction: t });
    if (!order) throw new AppError('Sipariş bulunamadı', 404);

    if (actor === 'user' && order.userId !== userId) {
      throw new AppError('Bu siparişe erişim yetkiniz yok', 403);
    }

    if (actor === 'market') {
      const shop = await Shop.findOne({
        where: { id: order.shopId, ownerId: userId },
        transaction: t
      });

      if (!shop) {
        throw new AppError('Bu siparişe erişim yetkiniz yok', 403);
      }
    }

    await changeStatusInternal(order, newStatus, actor, t);

    await t.commit();
    return order;
  } catch (err) {
    await t.rollback();
    throw err;
  }
}

async function changeStatusInternal(order, newStatus, actor, transaction) {
  if (!canTransition(order.status, newStatus)) {
    throw new AppError(`Geçersiz durum geçişi: ${order.status} → ${newStatus}`, 409);
  }

  const now = new Date();
  order.status = newStatus;

  if (newStatus === 'paid') order.paidAt = now;
  if (newStatus === 'delivered') order.deliveredAt = now;
  if (newStatus === 'confirmed') order.confirmedAt = now;
  if (newStatus === 'released') order.releasedAt = now;

  await order.save({ transaction });
  await runSideEffects(order, newStatus, transaction);
}

async function listUserOrders(userId, statusGroup = 'active', page = 1, limit = 10) {
  const statuses = STATUS_GROUPS[statusGroup] || STATUS_GROUPS.active;

  if (statusGroup === 'past') {
    const offset = (page - 1) * limit;
    const { count, rows } = await Order.findAndCountAll({
      where: { userId, status: statuses },
      order: [['createdAt', 'DESC']],
      limit,
      offset,
    });
    return { total: count, page, limit, orders: rows };
  }

  const orders = await Order.findAll({
    where: { userId, status: statuses },
    order: [['createdAt', 'DESC']],
  });
  return { total: orders.length, page: 1, limit: orders.length, orders };
}

async function listShopOrders(shopId, statusGroup = 'active', page = 1, limit = 10) {
  const statuses = STATUS_GROUPS[statusGroup] || STATUS_GROUPS.active;

  if (statusGroup === 'past') {
    const offset = (page - 1) * limit;
    const { count, rows } = await Order.findAndCountAll({
      where: { shopId, status: statuses },
      order: [['createdAt', 'DESC']],
      limit,
      offset,
    });
    return { total: count, page, limit, orders: rows };
  }

  const orders = await Order.findAll({
    where: { shopId, status: statuses },
    order: [['createdAt', 'DESC']],
  });
  return { total: orders.length, page: 1, limit: orders.length, orders };
}

async function getShopByOwner(ownerId) {
  return await Shop.findOne({ where: { ownerId } });
}

module.exports = {
  createOrder,
  confirmByQRCode,
  simulatePayment,
  changeStatus,
  listUserOrders,
  listShopOrders,
  getShopByOwner
};