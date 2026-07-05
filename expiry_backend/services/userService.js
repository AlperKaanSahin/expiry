const { User, Order } = require('../models');
const jwt = require('jsonwebtoken');


const generateAccessToken = (user) => {
  return jwt.sign(
    { id: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );
};

const generateRefreshToken = (user) => {
  return jwt.sign(
    { id: user.id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: '7d' }
  );
};

exports.login = async (email, password) => {
  const user = await User.findOne({ where: { email } });

  if (!user || !user.validPassword(password)) {
    throw new Error('Invalid credentials');
  }

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);
 

  const safeUser = user.toJSON();
  delete safeUser.password;

  return { user: safeUser, accessToken, refreshToken };
};

const emailService = require('./emailService');

exports.register = async (data) => {
  const { email, password, firstName, lastName, phone, address, birthDate, gender } = data;

  const existing = await User.findOne({ where: { email } });
  if (existing) throw new Error('Bu email zaten kayıtlı');

  const user = await User.create({ email, password, firstName, lastName, phone, address, birthDate, gender });

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  // Email gönder — hata olursa kayıt işlemini etkilemesin
  emailService.sendWelcomeEmail(user.email, user.firstName)
  .then(res => console.log("EMAIL OK:", res))
  .catch(err => console.log("EMAIL FAIL:", err));

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

  const user = await User.findByPk(payload.id);
  if (!user) throw new Error('Kullanıcı bulunamadı');

  const accessToken = generateAccessToken(user);
  return { accessToken };
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
  if (!user) throw new Error('Bu email ile kayıtlı kullanıcı bulunamadı');

  // 6 haneli kod üret
  const resetToken = Math.floor(100000 + Math.random() * 900000).toString();
  const resetTokenExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 dakika

  user.resetToken = resetToken;
  user.resetTokenExpiry = resetTokenExpiry;
  await user.save();

  await emailService.sendPasswordResetEmail(user.email, user.firstName, resetToken);

  return { message: 'Şifre sıfırlama kodu emailinize gönderildi' };
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