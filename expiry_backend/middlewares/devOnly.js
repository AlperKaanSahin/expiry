const AppError = require('../utils/AppError');

// app.js'teki authLimiter ile aynı ortam listesini kullanır — tutarlılık için.
const ALLOWED_ENVS = ['development', 'test'];

// Sadece development/test ortamında çalışmasına izin verilen endpoint'ler için guard.
// Örn: gerçek ödeme sağlayıcısı entegre olana kadar kullanılan simulate-payment gibi
// geçici/placeholder route'lar. Production'da 403 döner.
module.exports = (req, res, next) => {
  if (!ALLOWED_ENVS.includes(process.env.NODE_ENV)) {
    return next(new AppError(
      'Bu endpoint production ortamında kullanılamaz',
      403
    ));
  }
  next();
};