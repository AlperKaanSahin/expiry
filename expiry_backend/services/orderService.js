const {
  Order,
  OrderPackage,
  Package,
  PackageUnit,
  sequelize
} = require('../models');
const { Shop } = require('../models');

/**
 * STATE MACHINE
 */
const transitions = {
  pending: ['paid'],
  paid: ['delivered'],
  delivered: ['confirmed'],
  confirmed: ['released']
};

function canTransition(current, next) {
  return transitions[current]?.includes(next);
}

/**
 * SIDE EFFECTS
 */
async function runSideEffects(order, status, transaction) {
  switch (status) {
    case 'paid':
      // stock reserve (simulate payment sonrası)
      await reserveStock(order, transaction);
      break;

    case 'delivered':
      // market notify (opsiyonel)
      break;

    case 'confirmed':
      // user confirmed received
      break;

    case 'released':
      // payout simulation
      break;
  }
}

/**
 * STOCK RESERVE
 */
async function reserveStock(order, transaction) {
  const orderPackages = await OrderPackage.findAll({
    where: { orderId: order.id },
    transaction
  });

  for (const opkg of orderPackages) {
    const units = await PackageUnit.findAll({
      where: {
        packageId: opkg.packageId,
        isSold: false
      },
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
      where: {
        packageId: opkg.packageId,
        isSold: false
      },
      transaction
    });

    await Package.update(
      { quantity: remaining },
      { where: { id: opkg.packageId }, transaction }
    );
  }
}

/**
 * CREATE ORDER
 */
async function createOrder(userId, data) {
  const { shopId, packages } = data;

  const totalPrice = packages.reduce(
    (sum, p) => sum + p.price * p.quantity,
    0
  );

  const t = await sequelize.transaction();

  try {
    // stock check
    for (const pkg of packages) {
      const available = await PackageUnit.count({
        where: {
          packageId: pkg.packageId,
          isSold: false
        },
        transaction: t
      });

      if (available < pkg.quantity) {
        throw new Error('Not enough stock');
      }
    }

    const order = await Order.create(
      {
        userId,
        shopId,
        totalPrice,
        status: 'pending'
      },
      { transaction: t }
    );

    for (const pkg of packages) {
      await OrderPackage.create(
        {
          orderId: order.id,
          packageId: pkg.packageId,
          quantity: pkg.quantity,
          price: pkg.price
        },
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

/**
 * SIMULATE PAYMENT
 */
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

/**
 * CORE STATUS CHANGE (TEK GERÇEK NOKTA)
 */
async function changeStatus(orderId, newStatus, actor = 'user') {
  const t = await sequelize.transaction();

  try {
const order = await Order.findOne({
  where: { id: orderId },
  transaction: t
});

    console.log("BEFORE STATUS:", order.status);

    await changeStatusInternal(order, newStatus, actor, t);

    console.log("AFTER STATUS:", order.status);

    await t.commit();
    return order;

  } catch (err) {
    console.log("ERROR:", err.message);
    await t.rollback();
    throw err;
  }
}

/**
 * INTERNAL STATUS ENGINE
 */
async function changeStatusInternal(order, newStatus, actor, transaction) {
  if (!order) {
    throw new Error("Order not found (NULL)");
  }

  if (!canTransition(order.status, newStatus)) {
    throw new Error(
      `Invalid transition: ${order.status} → ${newStatus}`
    );
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

/**
 * LIST ORDERS
 */



async function listUserOrders(userId) {
  return await Order.findAll({
    where: { userId }
  });
}
async function listShopOrders(shopId) {
  return await Order.findAll({
    where: { shopId }
  });
}
async function getShopByOwner(ownerId) {
  return await Shop.findOne({
    where: { ownerId }
  });
}
module.exports = {
  createOrder,
  simulatePayment,
  changeStatus,
  listUserOrders,
  listShopOrders,
  getShopByOwner
};