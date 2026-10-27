const Sentry = require('@sentry/node');
const eventBus = require('../events/eventBus');
const ORDER_EVENTS = require('../events/order.events');
const { Order, OrderPackage } = require('../models');
const iyzicoService = require('../services/iyzicoService');
const orderService = require('../services/orderService');
const AppError = require('../utils/AppError');

const MAX_APPROVAL_ATTEMPTS = 10;

async function backfillTransactionIds(orderId) {
  const order = await Order.findByPk(orderId, { attributes: ['id', 'checkoutToken'] });
  if (!order?.checkoutToken) return;

  const result = await iyzicoService.retrieveCheckoutForm(order.checkoutToken);
  if (result.paymentStatus !== 'SUCCESS') return;

  const orderPackages = await OrderPackage.findAll({ where: { orderId } });
  for (const itemTx of result.itemTransactions || []) {
    const matching = orderPackages.find((op) => op.iyzicoItemId === itemTx.itemId);
    if (matching && !matching.iyzicoPaymentTransactionId) {
      matching.iyzicoPaymentTransactionId = String(itemTx.paymentTransactionId);
      await matching.save();
    }
  }
}

async function approveOrderPackages(orderId) {
  let orderPackages = await OrderPackage.findAll({ where: { orderId } });

  const needsBackfill = orderPackages.some(
    (op) => !op.iyzicoApprovedAt && !op.iyzicoPaymentTransactionId
  );
  if (needsBackfill) {
    try {
      await backfillTransactionIds(orderId);
      orderPackages = await OrderPackage.findAll({ where: { orderId } });
    } catch (err) {
      console.error(
        `[payment.handler] orderId=${orderId} paymentTransactionId backfill başarısız:`,
        err.message || err
      );
    }
  }

  let allApproved = true;

  for (const opkg of orderPackages) {
    if (opkg.iyzicoApprovedAt) continue;

    if (opkg.approvalAttempts >= MAX_APPROVAL_ATTEMPTS) {
      allApproved = false;
      continue;
    }

    if (!opkg.iyzicoPaymentTransactionId) {
      allApproved = false;
      console.error(
        `[payment.handler] orderId=${orderId} OrderPackage=${opkg.id} için paymentTransactionId yok, approve edilemiyor`
      );
      continue;
    }

    try {
      await iyzicoService.approvePaymentTransaction(opkg.iyzicoPaymentTransactionId);
      opkg.iyzicoApprovedAt = new Date();
      opkg.lastApprovalError = null;
      opkg.approvalAttempts += 1;
      await opkg.save();
    } catch (err) {
      allApproved = false;
      const message = String(err.message || err).slice(0, 500);
      console.error(
        `[payment.handler] orderId=${orderId} OrderPackage=${opkg.id} approve hatası:`,
        message
      );

      opkg.approvalAttempts += 1;
      opkg.lastApprovalError = message;

      try {
        await opkg.save();
      } catch (saveErr) {
        console.error(
          `[payment.handler] OrderPackage=${opkg.id} hata durumu kaydedilemedi:`,
          saveErr.message || saveErr
        );
      }

      if (opkg.approvalAttempts === MAX_APPROVAL_ATTEMPTS) {
        Sentry.captureMessage(
          `[payment.handler] OrderPackage=${opkg.id} (orderId=${orderId}) ${MAX_APPROVAL_ATTEMPTS} denemede approve edilemedi, otomatik retry durduruldu — manuel müdahale gerekiyor`,
          'fatal'
        );
      }
    }
  }

  return allApproved;
}

/**
 * approveOrderPackages'ı çalıştırır; TÜM kalemler approve edildiyse order'ı
 * otomatik 'released'e geçirir — 'released' zaten "iyzico parayı markete
 * geçirdi" anlamına geliyor, bu bir insan kararı değil bir gerçek, market'in
 * elle işaretlemesini beklemek gereksiz ve unutulmaya açık bir adım.
 *
 * Idempotent: order zaten 'released' ise (örn. retry job ikinci kez çalıştı
 * ama release zaten önceden gerçekleşmişse) changeStatus'un fırlattığı 409
 * BEKLENEN bir durumdur, sessizce yutulur — Sentry'ye bildirilmez. Başka
 * türden bir hata (örn. gerçek bir DB sorunu) olursa bildirilir.
 */
async function approveOrderPackagesAndRelease(orderId) {
  const allApproved = await approveOrderPackages(orderId);
  if (!allApproved) return allApproved;

  try {
    await orderService.changeStatus(orderId, 'released', 'system');
  } catch (err) {
    const isIdempotentNoOp = err instanceof AppError && err.statusCode === 409;
    if (!isIdempotentNoOp) {
      console.error(`[payment.handler] orderId=${orderId} otomatik release başarısız:`, err.message || err);
      Sentry.captureException(err, { extra: { orderId, source: 'payment.handler-auto-release' } });
    }
  }

  return allApproved;
}

// Iyzico approve call'u BİLEREK confirmed transaction'ının dışında çalışıyor
// (dış HTTP çağrısını DB lock'u altında tutmamak için). Event commit sonrasında
// fırlatılıyor (bkz. orderService.runSideEffects), dolayısıyla rollback olmuş
// bir order için approve çalışmaz.
eventBus.on(ORDER_EVENTS.CONFIRMED, async ({ orderId }) => {
  try {
    await approveOrderPackagesAndRelease(orderId);
  } catch (err) {
    console.error(`[payment.handler] orderId=${orderId} approve akışı başarısız:`, err.message || err);
  }
});

module.exports = { approveOrderPackages, approveOrderPackagesAndRelease, MAX_APPROVAL_ATTEMPTS };