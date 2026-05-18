const { Order, OrderPackage, Package, PackageUnit } = require('../models');

async function createOrder(req, res) {
  const { shopId, packages } = req.body;
  const userId = req.user.id;

  // totalPrice'ı paketlerin fiyatlarından hesapla
  const totalPrice = packages.reduce((sum, pkg) => sum + (pkg.price * pkg.quantity), 0);

  try {
    // 1. Her paket için stok kontrolü (satılmamış PackageUnit sayısı yeterli mi?)
    for (const pkg of packages) {
      const availableUnits = await PackageUnit.count({
        where: { packageId: pkg.packageId, isSold: false }
      });
      if (availableUnits < pkg.quantity) {
        return res.status(400).json({ error: 'Yeterli kutu yok' });
      }
    }

    // 2. Siparişi oluştur
    const order = await Order.create({ userId, shopId, totalPrice, status: 'pending' });

    // 3. Sipariş-Paket ilişkilerini kaydet
    for (const pkg of packages) {
      await OrderPackage.create({
        orderId: order.id,
        packageId: pkg.packageId,
        quantity: pkg.quantity,
        price: pkg.price
      });
    }

    res.json(order);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
}

async function simulatePayment(req, res) {
  const { orderId } = req.body;
  try {
    await Order.update({ status: 'paid' }, { where: { id: orderId } });
    const orderPackages = await OrderPackage.findAll({ where: { orderId } });

    for (const opkg of orderPackages) {
      // Satılmamış kutuları bul ve isSold: true yap
      const units = await PackageUnit.findAll({
        where: { packageId: opkg.packageId, isSold: false },
        limit: opkg.quantity
      });
      for (const unit of units) {
        unit.isSold = true;
        await unit.save();
      }

      // Paketin kalan kutu sayısını güncelle
      const remaining = await PackageUnit.count({
        where: { packageId: opkg.packageId, isSold: false }
      });
      await Package.update(
        { quantity: remaining },
        { where: { id: opkg.packageId } }
      );
    }

    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
}

async function listUserOrders(req, res) {
  const userId = req.params.userId;
  try {
    const orders = await Order.findAll({
      where: { userId },
      include: [{ model: OrderPackage }]
    });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function listShopOrders(req, res) {
  const shopId = req.params.shopId;
  try {
    const orders = await Order.findAll({
      where: { shopId },
      include: [{ model: OrderPackage }]
    });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function confirmReceivedByUser(req, res) {
  try {
    const order = await Order.findByPk(req.params.id);
    if (!order) return res.status(404).json({ error: 'Sipariş bulunamadı' });
    order.isReceivedByUser = true;
    if (order.isReceivedByMarket) order.status = 'completed';
    await order.save();
    res.json(order);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function confirmReceivedByMarket(req, res) {
  try {
    const order = await Order.findByPk(req.params.id);
    if (!order) return res.status(404).json({ error: 'Sipariş bulunamadı' });
    order.isReceivedByMarket = true;
    if (order.isReceivedByUser) order.status = 'completed';
    await order.save();
    res.json(order);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

module.exports = {
  createOrder,
  listShopOrders,
  simulatePayment,
  listUserOrders,
  confirmReceivedByUser,
  confirmReceivedByMarket
};