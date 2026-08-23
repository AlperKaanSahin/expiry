const AppError = require('../utils/AppError');

module.exports = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    return next();
  }
  return next(new AppError('Yetkisiz', 403));
};