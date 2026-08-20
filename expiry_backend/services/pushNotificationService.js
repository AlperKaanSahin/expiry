const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getMessaging } = require('firebase-admin/messaging');
const { UserDevice } = require('../models');
const Sentry = require('@sentry/node');

let messaging;

function getFirebaseMessaging() {
  if (!messaging) {
    const serviceAccount = require('../config/firebase-service-account.json');

    const app = getApps().length
      ? getApps()[0]
      : initializeApp({
          credential: cert(serviceAccount),
        });

    messaging = getMessaging(app);
  }

  return messaging;
}

exports.sendToUser = async (userId, { title, body, data = {} }) => {
  console.log('[Push] sendToUser called', {
    userId,
    title,
    body,
    data,
  });

  const devices = await UserDevice.findAll({ where: { userId } });

  console.log(`[Push] Found ${devices.length} device(s) for user ${userId}`);

  if (devices.length === 0) return;

  console.log(
    '[Push] Tokens:',
    devices.map(d => d.fcmToken)
  );

  const tokens = devices.map(d => d.fcmToken);

  const message = {
    notification: { title, body },
    data: Object.fromEntries(
      Object.entries(data).map(([k, v]) => [k, String(v)])
    ),
    tokens,
  };

  try {
    const messaging = getFirebaseMessaging();

    const response = await messaging.sendEachForMulticast(message);

    console.log('[Push] Firebase response', {
      successCount: response.successCount,
      failureCount: response.failureCount,
    });

    const staleTokens = [];

    response.responses.forEach((res, idx) => {
      if (!res.success) {
        const code = res.error?.code;

        if (
          code === 'messaging/invalid-registration-token' ||
          code === 'messaging/registration-token-not-registered'
        ) {
          staleTokens.push(tokens[idx]);
        }
      }
    });

    if (staleTokens.length > 0) {
      await UserDevice.destroy({
        where: { fcmToken: staleTokens },
      });
    }
} catch (err) {
  console.error('PUSH NOTIFICATION SEND ERROR:', err);
  Sentry.captureException(err);
}
};