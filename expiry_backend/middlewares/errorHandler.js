const Sentry = require('@sentry/node');

module.exports = (err, req, res, next) => {
  console.error('ERROR:', err.message);

  const status = err.status || 500;
  const message = err.message || 'Sunucu hatası oluştu';

  // Sadece sunucu hatalarını Sentry'ye gönder
  if (status >= 500) {
    Sentry.captureException(err);
  }

  res.status(status).json({
    error: message,
  });
};