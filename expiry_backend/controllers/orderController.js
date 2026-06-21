const orderService = require('../services/orderService');

/**
 * CREATE ORDER
 */
async function createOrder(req, res) {
  try {
    const order = await orderService.createOrder(req.user.id, req.body);
    res.json(order);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

/**
 * SIMULATE PAYMENT → status = paid
 */
async function simulatePayment(req, res) {
  try {
    const result = await orderService.simulatePayment(req.body.orderId);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

/**
 * STATUS CHANGE (GENERIC ESCROW FLOW)
 * pending → paid → delivered → confirmed → released
 */
async function changeOrderStatus(req, res) {
  try {
    const orderId = req.params.id;
    const { status } = req.body;

    const order = await orderService.changeStatus(
      orderId,
      status,
      req.user?.role || 'user'
    );

    return res.json(order);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
}

/**
 * LIST USER ORDERS
 */
async function listUserOrders(req, res) {
  try {
    const orders = await orderService.listUserOrders(req.params.userId);
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

/**
 * LIST SHOP ORDERS
 */
async function listShopOrders(req, res) {
  try {
    const orders = await orderService.listShopOrders(req.params.shopId);
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
async function markDelivered(req, res) {
  try {
    const order = await orderService.changeStatus(
      req.params.id,
      'delivered',
      'market'
    );

    res.json(order);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}
async function confirmOrder(req, res) {
  try {
    const order = await orderService.changeStatus(
      req.params.id,
      'confirmed',
      'user'
    );

    res.json(order);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

module.exports = {
  createOrder,
  simulatePayment,
  changeOrderStatus,
  listUserOrders,
  listShopOrders,
  markDelivered,
  confirmOrder,
};