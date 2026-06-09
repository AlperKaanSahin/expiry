const eventBus = require('../events/eventBus');
const SHOP_EVENTS = require('../events/shop.events');
const notificationService = require('../services/notificationService');

eventBus.on(SHOP_EVENTS.APPROVED, async (data) => {
  try {
    console.log("EVENT DATA:", data);

    const shop = data?.shop;
    if (!shop?.ownerId) {
      console.log("INVALID SHOP DATA");
      return;
    }

    await notificationService.createNotification({
      userId: shop.ownerId,
      type: 'SHOP_APPROVED',
      title: 'Market Başvurusu Onaylandı',
      message: 'Market başvurunuz onaylandı.',
      targetId: shop.id
    });

  } catch (err) {
    console.log("NOTIFICATION HANDLER ERROR:", err);
  }
});

eventBus.on(SHOP_EVENTS.REJECTED, async (data) => {
  try {
    const shop = data?.shop;

    if (!shop?.ownerId) {
      console.log("INVALID EVENT DATA:", data);
      return;
    }

    await notificationService.createNotification({
      userId: shop.ownerId,
      title: 'Reddedildi',
      message: data.reason,
      type: 'SHOP_REJECTED'
    });
  } catch (err) {
    console.log("REJECTED EVENT ERROR:", err);
  }
});