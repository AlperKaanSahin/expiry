const jwt = require('jsonwebtoken');
const { User } = require('../models');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');

module.exports = catchAsync(async (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) {
    return next(new AppError('Authentication required', 401));
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return next(new AppError('Invalid or expired token', 401));
  }

  const user = await User.findByPk(decoded.id, {
    attributes: { exclude: ['password'] }
  });

  if (!user) {
    return next(new AppError('User not found', 401));
  }

  req.user = decoded;
  next();
});