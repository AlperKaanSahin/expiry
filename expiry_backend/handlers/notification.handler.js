const eventBus = require('../events/eventBus');
const SHOP_EVENTS = require('../events/shop.events');
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