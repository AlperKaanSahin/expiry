const { User } = require('../models');
const jwt = require('jsonwebtoken');

const generateAccessToken = (user) => {
  return jwt.sign(
    { id: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '15m' }
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

exports.register = async (data) => {
  const { email, password, firstName, lastName, phone, address, birthDate, gender } = data;

  const existing = await User.findOne({ where: { email } });
  if (existing) throw new Error('Bu email zaten kayıtlı');

  const user = await User.create({ email, password, firstName, lastName, phone, address, birthDate, gender });

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

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