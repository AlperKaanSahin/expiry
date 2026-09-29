const Sentry = require('@sentry/node');
const { Op } = require('sequelize');
const { OrderPackage, Order } = require('../models');
const { approveOrderPackages, MAX_APPROVAL_ATTEMPTS } = require('../handlers/payment.handler');

// confirmed event'indeki ilk approve denemesi başarısız olursa (iyzico geçici
// hatası, network kopması, vb.) hiçbir şey onu tekrar denemiyordu — para
// markete hiç geçmeden sistemde asılı kalıyordu. Bu job o boşluğu kapatıyor:
// her SWEEP_INTERVAL_MS'de bir, approve edilmemiş ve MAX_APPROVAL_ATTEMPTS'e
// henüz ulaşmamış OrderPackage'ları tarayıp approveOrderPackages'ı (idempotent)
// tekrar çağırır.
const SWEEP_INTERVAL_MS = 10 * 60 * 1000; // 10 dakika

let isRunning = false;
let intervalHandle = null;

/**
 * Approve edilmemiş, deneme hakkı tükenmemiş OrderPackage'ların ait olduğu
 * order id'lerini bulur. Sadece 'confirmed'/'released' durumundaki order'lar
 * dahil edilir — approve mantıksal olarak sadece bu durumlarda anlamlıdır
 * (bkz. orderService.TRANSITIONS).
 */
async function findOrderIdsNeedingApproval() {
  const rows = await OrderPackage.findAll({
    attributes: ['orderId'],
    where: {
      iyzicoApprovedAt: null,
      approvalAttempts: { [Op.lt]: MAX_APPROVAL_ATTEMPTS },
    },
    include: [{
      model: Order,
      attributes: [],
      where: { status: { [Op.in]: ['confirmed', 'released'] } },
      required: true,
    }],
    group: ['orderId'],
    raw: true,
  });

  return rows.map((r) => r.orderId);
}

/**
 * Tek bir tarama turu. Üst üste binmeyi (overlap) önlemek için bir tur
 * çalışırken yeni bir tur başlatılmaz — bir önceki tur iyzico'nun yavaş cevap
 * vermesi yüzünden SWEEP_INTERVAL_MS'den uzun sürerse bu önemli, aksi halde
 * aynı kayıtlar eşzamanlı işlenmeye çalışılabilir.
 */
async function runApprovalRetrySweep() {
  if (isRunning) {
    console.log('[approvalRetryJob] önceki tur hâlâ çalışıyor, bu tur atlanıyor');
    return;
  }

  isRunning = true;
  try {
    const orderIds = await findOrderIdsNeedingApproval();

    for (const orderId of orderIds) {
      try {
        await approveOrderPackages(orderId);
      } catch (err) {
        console.error(`[approvalRetryJob] orderId=${orderId} approve denemesi başarısız:`, err.message || err);
        Sentry.captureException(err, { extra: { orderId, source: 'approvalRetryJob' } });
      }
    }
  } catch (err) {
    console.error('[approvalRetryJob] tarama başarısız:', err.message || err);
    Sentry.captureException(err, { extra: { source: 'approvalRetryJob-sweep' } });
  } finally {
    isRunning = false;
  }
}

function start() {
  // Testlerde interval'in arka planda çalışmaya devam etmesi (gerçek DB'ye
  // sorgu atması, jest'in process'i kapatamaması) istenmiyor.
  if (process.env.NODE_ENV === 'test') return;
  if (intervalHandle) return; // zaten başlatılmış

  intervalHandle = setInterval(runApprovalRetrySweep, SWEEP_INTERVAL_MS);
  // Sadece bu interval yüzünden process'in ayakta kalmasını engeller —
  // graceful shutdown sırasında process takılı kalmasın diye.
  intervalHandle.unref?.();
}

function stop() {
  if (intervalHandle) {
    clearInterval(intervalHandle);
    intervalHandle = null;
  }
}

module.exports = { start, stop, runApprovalRetrySweep, SWEEP_INTERVAL_MS };