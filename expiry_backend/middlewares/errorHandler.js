const Sentry = require('@sentry/node');

module.exports = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;

  console.error('ERROR:', err);

  if (statusCode >= 500) {
    Sentry.captureException(err);
  }

  if (err.isOperational) {
    return res.status(statusCode).json({ error: err.message });
  }

  return res.status(500).json({ error: 'Sunucu hatası oluştu' });
};