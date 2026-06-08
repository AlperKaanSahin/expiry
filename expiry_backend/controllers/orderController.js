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
async function getShopOrders(req, res) {try {
    const shop = await Shop.findOne({
      where: { ownerId: req.user.id }
    });

    if (!shop) {
      return res.status(404).json({
        success: false,
        message: "Shop not found"
      });
    }

    const orders = await Order.findAll({
      where: { shopId: shop.id }
    });

    return res.status(200).json({
      success: true,
      data: orders
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }};
async function getMyShopOrders(req, res) {
  try {
    console.log("USER:", req.user);

    const shop = await orderService.getShopByOwner(req.user.id);

    if (!shop) {
      return res.status(404).json({
        message: "No shop found for this user"
      });
    }

    const orders = await orderService.listShopOrders(shop.id);

    return res.json(orders);

  } catch (err) {
    console.log("GET SHOP ORDERS ERROR:", err);

    return res.status(500).json({
      error: err.message
    });
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
  listUserOrders,
  listShopOrders,
  markDelivered,
  confirmOrder,
  getShopOrders,
  getMyShopOrders,
  getMyUserOrders
};