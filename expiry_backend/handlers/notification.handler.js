const eventBus = require('../events/eventBus');
const SHOP_EVENTS = require('../events/shop.events');
const ORDER_EVENTS = require('../events/order.events');
const { Shop, User, Order, OrderPackage } = require('../models');


const notificationService = require('../services/notificationService');

eventBus.on(SHOP_EVENTS.STATUS_CHANGED, async (data) => {
  try {
    const { shop, status, user } = data;

    if (!user?.id) return;

    if (status.to === 'active') {
      await notificationService.createNotification({
        userId: user.id,
        type: 'SHOP_APPROVED',
        title: 'Market Başvurusu Onaylandı',
        message: `${shop.name} marketiniz onaylandı, artık aktif!`,
      });
    }

    if (status.to === 'rejected') {
      await notificationService.createNotification({
        userId: user.id,
        type: 'SHOP_REJECTED',
        title: 'Market Başvurusu Reddedildi',
        message: `${shop.name} marketiniz reddedildi.`,
      });
    }

  } catch (err) {
    console.error('NOTIFICATION HANDLER ERROR:', err);
  }
});


// PAID
eventBus.on(ORDER_EVENTS.PAID, async (data) => {
  try {
    const shop = await Shop.findByPk(data.shopId);
    if (!shop) return;

    const formatTime = (dateStr) => {
      if (!dateStr) return '';
      return new Date(dateStr).toLocaleTimeString('tr-TR', {
        hour: '2-digit', minute: '2-digit'
      });
    };

    const deliveryText = data.deliveryStart && data.deliveryEnd
      ? `Teslimat saati: ${formatTime(data.deliveryStart)} - ${formatTime(data.deliveryEnd)}`
      : '';

    // Kullanıcıya
    await notificationService.createNotification({
      userId: data.userId,
      type: 'ORDER_PAID',
      title: 'Ödemeniz Alındı',
      message: `Siparişiniz onaylandı. ${deliveryText} arasında ${shop.name} marketine gidiniz.`,
      targetId: data.orderId,
    });

    // Market sahibine
    const shopOwner = await User.findOne({ where: { id: shop.ownerId } });
    if (shopOwner) {
      await notificationService.createNotification({
        userId: shopOwner.id,
        type: 'ORDER_NEW',
        title: 'Yeni Sipariş!',
        message: `Yeni bir sipariş aldınız. ${deliveryText} arasında hazır olun.`,
        targetId: data.orderId,
      });
    }
  } catch (err) {
    console.error('ORDER PAID NOTIFICATION ERROR:', err);
  }
});

// DELIVERED
eventBus.on(ORDER_EVENTS.DELIVERED, async (data) => {
  try {
    await notificationService.createNotification({
      userId: data.userId,
      type: 'ORDER_DELIVERED',
      title: 'Siparişiniz Hazır',
      message: 'Siparişiniz hazırlandı. Teslim aldıysanız lütfen onaylayın.',
      targetId: data.orderId,
    });
  } catch (err) {
    console.error('ORDER DELIVERED NOTIFICATION ERROR:', err);
  }
});

// CONFIRMED
eventBus.on(ORDER_EVENTS.CONFIRMED, async (data) => {
  try {
    const shop = await Shop.findByPk(data.shopId);
    if (!shop) return;

    // Kullanıcıya
    await notificationService.createNotification({
      userId: data.userId,
      type: 'RATE_SHOP',
      title: 'Siparişiniz Tamamlandı',
      message: `${shop.name} marketini değerlendirmek ister misiniz?`,
      targetId: data.shopId,
      orderId: data.orderId,
    });

    // Market sahibine
    const shopOwner = await User.findOne({ where: { id: shop.ownerId } });
    if (shopOwner) {
      await notificationService.createNotification({
        userId: shopOwner.id,
        type: 'ORDER_CONFIRMED',
        title: 'Sipariş Tamamlandı',
        message: 'Müşteri siparişi teslim aldığını onayladı.',
        targetId: data.orderId,
      });
    }
  } catch (err) {
    console.error('ORDER CONFIRMED NOTIFICATION ERROR:', err);
  }
});

// RELEASED
eventBus.on(ORDER_EVENTS.RELEASED, async (data) => {
  try {
    const shop = await Shop.findByPk(data.shopId);
    if (!shop) return;

    const shopOwner = await User.findOne({ where: { id: shop.ownerId } });
    if (shopOwner) {
      await notificationService.createNotification({
        userId: shopOwner.id,
        type: 'ORDER_RELEASED',
        title: 'Ödeme Aktarıldı',
        message: 'Sipariş ödemesi hesabınıza aktarıldı.',
        targetId: data.orderId,
      });
    }
  } catch (err) {
    console.error('ORDER RELEASED NOTIFICATION ERROR:', err);
  }
});