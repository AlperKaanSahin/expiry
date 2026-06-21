const {
  Order, OrderPackage, Package, PackageUnit, Shop, sequelize
} = require('../models');
const eventBus = require('../events/eventBus');
const ORDER_EVENTS = require('../events/order.events');

const transitions = {
  pending: ['paid'],
  paid: ['delivered'],
  delivered: ['confirmed'],
  confirmed: ['released']
};

function canTransition(current, next) {
  return transitions[current]?.includes(next);
}

async function runSideEffects(order, status, transaction) {
  switch (status) {
    case 'paid':
      await reserveStock(order, transaction);
      
      // Teslimat saatini çek
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
      limit: opkg.quantity,
      transaction
    });

    if (units.length < opkg.quantity) {
      throw new Error('Insufficient stock during reserve');
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

      if (!dbPackage) throw new Error(`Geçersiz paket: ${pkg.packageId}`);

      const available = await PackageUnit.count({
        where: { packageId: pkg.packageId, isSold: false },
        transaction: t
      });

      if (available < pkg.quantity) throw new Error('Not enough stock');

      const realPrice = dbPackage.price;
      totalPrice += realPrice * pkg.quantity;

      validatedPackages.push({
        packageId: pkg.packageId,
        quantity: pkg.quantity,
        price: realPrice
      });
    }

    const order = await Order.create(
      { userId, shopId, totalPrice, status: 'pending' },
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

async function simulatePayment(orderId) {
  const t = await sequelize.transaction();
  try {
    const order = await Order.findByPk(orderId, { transaction: t });
    if (!order) throw new Error('Order not found');

    await changeStatusInternal(order, 'paid', 'system', t);

    await t.commit();
    return { success: true };
  } catch (err) {
    await t.rollback();
    throw err;
  }
}

async function changeStatus(orderId, newStatus, actor = 'user', userId = null) {
  const t = await sequelize.transaction();
  try {
    const order = await Order.findOne({ where: { id: orderId }, transaction: t });
    if (!order) throw new Error('Order not found');

    // BURAYA — yetki kontrolü
    if (actor === 'user' && order.userId !== userId) {
      throw new Error('Bu siparişe erişim yetkiniz yok');
    }

    if (actor === 'market') {
      const shop = await Shop.findOne({ where: { id: order.shopId, ownerId: userId }, transaction: t });
      if (!shop) throw new Error('Bu siparişe erişim yetkiniz yok');
    }
    // admin her şeye erişebilir, kontrol yok

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
    throw new Error(`Invalid transition: ${order.status} → ${newStatus}`);
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

async function listUserOrders(userId) {
  return await Order.findAll({ where: { userId } });
}

async function listShopOrders(shopId) {
  return await Order.findAll({ where: { shopId } });
}

async function getShopByOwner(ownerId) {
  return await Shop.findOne({ where: { ownerId } });
}

module.exports = {
  createOrder,
  simulatePayment,
  changeStatus,
  listUserOrders,
  listShopOrders,
  getShopByOwner
};