const Sentry = require('@sentry/node');
const { Op } = require('sequelize');
const { OrderPackage, Order } = require('../models');
const { approveOrderPackagesAndRelease, MAX_APPROVAL_ATTEMPTS } = require('../handlers/payment.handler');

const SWEEP_INTERVAL_MS = 10 * 60 * 1000; // 10 dakika

let isRunning = false;
let intervalHandle = null;

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
        await approveOrderPackagesAndRelease(orderId);
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
  if (process.env.NODE_ENV === 'test') return;
  if (intervalHandle) return;

  intervalHandle = setInterval(runApprovalRetrySweep, SWEEP_INTERVAL_MS);
  intervalHandle.unref?.();
}

function stop() {
  if (intervalHandle) {
    clearInterval(intervalHandle);
    intervalHandle = null;
  }
}

module.exports = { start, stop, runApprovalRetrySweep, SWEEP_INTERVAL_MS };