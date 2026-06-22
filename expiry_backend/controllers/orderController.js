const orderService = require('../services/orderService');

async function createOrder(req, res) {
  try {
    const order = await orderService.createOrder(req.user.id, req.body);
    res.status(201).json(order);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

async function simulatePayment(req, res) {
  try {
    const result = await orderService.simulatePayment(
      req.user.id,
      req.body.orderId
    );

    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

async function changeOrderStatus(req, res) {
  try {
    const order = await orderService.changeStatus(
      req.params.id,
      req.body.status,
      req.user.role,
      req.user.id
    );
    res.json(order);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

async function markDelivered(req, res) {
  try {
    const order = await orderService.changeStatus(req.params.id, 'delivered', 'market', req.user.id);
    res.json(order);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

async function confirmOrder(req, res) {
  try {
    const order = await orderService.changeStatus(req.params.id, 'confirmed', 'user', req.user.id);
    res.json(order);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

async function getMyShopOrders(req, res) {
  try {
    const shop = await orderService.getShopByOwner(req.user.id);
    if (!shop) return res.status(404).json({ error: 'Shop not found' });

    const orders = await orderService.listShopOrders(shop.id);
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function getMyUserOrders(req, res) {
  try {
    const orders = await orderService.listUserOrders(req.user.id);
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = {
  createOrder,
  simulatePayment,
  changeOrderStatus,
  markDelivered,
  confirmOrder,
  getMyShopOrders,
  getMyUserOrders
};