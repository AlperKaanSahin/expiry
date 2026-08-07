const { User, Order, RefreshToken, UserDevice  } = require('../models');
const jwt = require('jsonwebtoken');


const generateAccessToken = (user) => {
  return jwt.sign(
    { id: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );
};

const generateRefreshToken = async (user) => {
  const token = jwt.sign(
    { id: user.id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: '7d' }
  );

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  await RefreshToken.create({
    token,
    userId: user.id,
    expiresAt
  });

  return token;
};

exports.login = async (email, password) => {
  const user = await User.findOne({ where: { email } });

  if (!user || !user.validPassword(password)) {
    throw new Error('Invalid credentials');
  }

  const accessToken = generateAccessToken(user);
  const refreshToken = await generateRefreshToken(user); // await eklendi

  const safeUser = user.toJSON();
  delete safeUser.password;

  return { user: safeUser, accessToken, refreshToken };
};

const emailService = require('./emailService');

exports.register = async (data) => {
  const { email, password, firstName, lastName } = data;

  const existing = await User.findOne({ where: { email } });
  if (existing) throw new Error('Bu email zaten kayıtlı');

  const user = await User.create({ email, password, firstName, lastName });

  const accessToken = generateAccessToken(user);
  const refreshToken = await generateRefreshToken(user);

  emailService.sendWelcomeEmail(user.email, user.firstName).catch(() => {});

  const safeUser = user.toJSON();
  delete safeUser.password;

  return { user: safeUser, accessToken, refreshToken };
};
exports.refreshAccessToken = async (refreshToken) => {
  if (!refreshToken) throw new Error('Refresh token gerekli');

  let payload;
  try {
    payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
  } catch {
    throw new Error('Geçersiz refresh token');
  }

  const storedToken = await RefreshToken.findOne({ where: { token: refreshToken } });

  if (!storedToken || storedToken.revoked) {
    throw new Error('Refresh token geçersiz veya iptal edilmiş');
  }

  if (new Date() > storedToken.expiresAt) {
    throw new Error('Refresh token süresi dolmuş');
  }

  const user = await User.findByPk(payload.id);
  if (!user) throw new Error('Kullanıcı bulunamadı');

  const accessToken = generateAccessToken(user);
  return { accessToken };
};
exports.revokeRefreshToken = async (refreshToken) => {
  await RefreshToken.update(
    { revoked: true },
    { where: { token: refreshToken } }
  );
};

exports.revokeAllUserTokens = async (userId) => {
  await RefreshToken.update(
    { revoked: true },
    { where: { userId } }
  );
};

exports.getProfile = async (userId) => {
  const user = await User.findByPk(userId, {
    attributes: { exclude: ['password'] }
  });

  if (!user) throw new Error('User not found');
  return user;
};
exports.changePassword = async (userId, currentPassword, newPassword) => {
  const user = await User.findByPk(userId);
  if (!user) throw new Error('Kullanıcı bulunamadı');

  if (!user.validPassword(currentPassword)) {
    throw new Error('Mevcut şifre yanlış');
  }

  user.password = newPassword;
  await user.save();

  await exports.revokeAllUserTokens(userId); // yeni eklendi

  return true;
};
exports.updateProfile = async (userId, data) => {
  const user = await User.findByPk(userId);
  if (!user) throw new Error('Kullanıcı bulunamadı');

  const { firstName, lastName, phone, address } = data;

  user.firstName = firstName || user.firstName;
  user.lastName = lastName || user.lastName;
  user.phone = phone || user.phone;
  user.address = address || user.address;

  await user.save();

  const safeUser = user.toJSON();
  delete safeUser.password;
  return safeUser;
};
const crypto = require('crypto');

exports.forgotPassword = async (email) => {
  const user = await User.findOne({ where: { email } });

  if (user) {
    const resetToken = Math.floor(100000 + Math.random() * 900000).toString();
    const resetTokenExpiry = new Date(Date.now() + 15 * 60 * 1000);

    user.resetToken = resetToken;
    user.resetTokenExpiry = resetTokenExpiry;
    await user.save();

    try {
      await emailService.sendPasswordResetEmail(user.email, user.firstName, resetToken);
    } catch (err) {
      console.error('Password reset email failed for', email);
    }
  }

  return { message: 'Eğer bu email adresi kayıtlıysa, şifre sıfırlama kodu gönderildi' };
};

exports.resetPassword = async (email, token, newPassword) => {
  const user = await User.findOne({ where: { email } });
  if (!user) throw new Error('Kullanıcı bulunamadı');

  if (!user.resetToken || user.resetToken !== token) {
    throw new Error('Geçersiz kod');
  }

  if (new Date() > user.resetTokenExpiry) {
    throw new Error('Kodun süresi dolmuş, tekrar talep edin');
  }

  user.password = newPassword;
  user.resetToken = null;
  user.resetTokenExpiry = null;
  await user.save();

  return { message: 'Şifreniz başarıyla güncellendi' };
};
exports.deleteAccount = async (userId, password) => {
  const user = await User.findByPk(userId);
  if (!user) throw new Error('Kullanıcı bulunamadı');

  // Şifre doğrulama
  if (!user.validPassword(password)) {
    throw new Error('Şifre hatalı');
  }

  // Aktif sipariş kontrolü
  const activeOrders = await Order.findAll({
    where: {
      userId,
      status: ['pending', 'paid', 'delivered']
    }
  });

  if (activeOrders.length > 0) {
    throw new Error('Aktif siparişleriniz tamamlanmadan hesabınızı silemezsiniz');
  }

  // Anonimleştir
  user.email = `deleted_user_${userId}@deleted.com`;
  user.firstName = 'Silinmiş';
  user.lastName = 'Kullanıcı';
  user.phone = null;
  user.address = null;
  user.password = Math.random().toString(36);
  user.deletedAt = new Date();

  await user.save({ paranoid: false });

  return { message: 'Hesabınız başarıyla silindi' };
};
exports.registerDevice = async (userId, { deviceId, fcmToken, platform, appVersion }) => {
  if (!deviceId || !fcmToken || !platform) {
    throw new Error('deviceId, fcmToken ve platform gerekli');
  }

  const [device] = await UserDevice.upsert({
    userId,
    deviceId,
    fcmToken,
    platform,
    appVersion,
    lastSeenAt: new Date(),
  }, {
    conflictFields: ['userId', 'deviceId'],
  });

  return device;
};

exports.removeDevice = async (userId, deviceId) => {
  await UserDevice.destroy({ where: { userId, deviceId } });
};