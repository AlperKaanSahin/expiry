const AppError = require('../utils/AppError');

module.exports = (req, res, next) => {
  if (!req.user || req.user.role !== 'market') {
    return next(new AppError('Sadece market kullanıcıları erişebilir', 403));
  }
  next();
};