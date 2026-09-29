const Sentry = require('@sentry/node');
const eventBus = require('../events/eventBus');
const ORDER_EVENTS = require('../events/order.events');
const { Order, OrderPackage } = require('../models');
const iyzicoService = require('../services/iyzicoService');

// Bir OrderPackage otomatik retry tarafından (services/approvalRetryJob.js) kaç kez
// denendikten sonra "kalıcı başarısız" sayılıp insan müdahalesine bırakılacağını
// belirler. Bu sabit iki yerden kullanılıyor: burada (confirmed event'indeki ilk
// deneme) ve retry job'da (periyodik tekrar deneme) — tek yerden kontrol edilsin.
const MAX_APPROVAL_ATTEMPTS = 10;

/**
 * Callback'te paymentTransactionId eşlenemediyse (itemId uyuşmazlığı vb.)
 * iyzico'dan sonucu tekrar çekip eksik id'leri doldurur.
 */
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

/**
 * Bir order'ın henüz approve edilmemiş OrderPackage'larını iyzico'da approve eder.
 * Idempotent: iyzicoApprovedAt dolu olanlar atlanır, bu yüzden hem event listener
 * hem de retry job (services/approvalRetryJob.js) güvenle çağırabilir.
 *
 * Her item bağımsız — biri başarısız olursa diğerleri denenmeye devam eder.
 * MAX_APPROVAL_ATTEMPTS'e ulaşmış bir item bir daha denenmez — eşik aşıldığı anda
 * Sentry'ye BİR KEZ bildirilir, sonraki geçişlerde sessizce atlanır (insan
 * müdahalesi bekleniyor demektir, retry job'un iyzico'yu sonsuza dek dövmesi
 * engellenmiş olur).
 *
 * Dönen değer: tüm item'lar approve edildi mi.
 */
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
      // Eşik daha önce aşılmış ve Sentry'ye bildirilmiş — sessizce atla.
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

// Iyzico approve call'u BİLEREK confirmed transaction'ının dışında çalışıyor
// (dış HTTP çağrısını DB lock'u altında tutmamak için). Event commit sonrasında
// fırlatılıyor (bkz. orderService.runSideEffects), dolayısıyla rollback olmuş
// bir order için approve çalışmaz.
eventBus.on(ORDER_EVENTS.CONFIRMED, async ({ orderId }) => {
  try {
    await approveOrderPackages(orderId);
  } catch (err) {
    console.error(`[payment.handler] orderId=${orderId} approve akışı başarısız:`, err.message || err);
  }
});

module.exports = { approveOrderPackages, MAX_APPROVAL_ATTEMPTS };