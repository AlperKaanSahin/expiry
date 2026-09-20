const eventBus = require('../events/eventBus');
const ORDER_EVENTS = require('../events/order.events');
const { OrderPackage } = require('../models');
const iyzicoService = require('../services/iyzicoService');

// notification.handler.js ve audit.handler.js ile aynı pattern: eventBus üzerinden
// dinle, side effect'i burada yap. Iyzico approve call'u BİLEREK confirmed
// transaction'ının dışında (burada) çalışıyor — dış HTTP çağrısını DB lock'u
// altında tutmamak için. Approve başarısız olursa order 'confirmed' kalır
// (teslimat gerçekleşmiş durumda), sadece para submerchant'a geçmemiş olur —
// bu yüzden hata burada yutulmuyor, loglanıp retry/alert mekanizmasına
// (şimdilik en azından log) bırakılıyor.
eventBus.on(ORDER_EVENTS.CONFIRMED, async ({ orderId }) => {
  let orderPackages;
  try {
    orderPackages = await OrderPackage.findAll({ where: { orderId } });
  } catch (err) {
    console.error(`[payment.handler] orderId=${orderId} OrderPackage sorgusu başarısız:`, err.message || err);
    return;
  }

  for (const opkg of orderPackages) {
    if (!opkg.iyzicoPaymentTransactionId) {
      console.error(
        `[payment.handler] orderId=${orderId} OrderPackage=${opkg.id} için paymentTransactionId yok, approve atlanıyor`
      );
      continue;
    }

    try {
      await iyzicoService.approvePaymentTransaction(opkg.iyzicoPaymentTransactionId);
    } catch (err) {
      // Her item bağımsız — biri başarısız olursa diğerleri denenmeye devam eder.
      // TODO: burada bir alerting/retry mekanizması (örn. bir "failedApprovals"
      // tablosu + cron ile tekrar deneme) eklenmeli — şimdilik sadece logluyoruz.
      console.error(`[payment.handler] orderId=${orderId} OrderPackage=${opkg.id} approve hatası:`, err.message || err);
    }
  }
});