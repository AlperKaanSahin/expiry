const { User } = require('../models');
const jwt = require('jsonwebtoken');

const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );
};

exports.register = async (data) => {
  const { email, password, firstName, lastName, phone, address, birthDate, gender } = data;

  const existing = await User.findOne({ where: { email } });
  if (existing) throw new Error('Bu email zaten kayıtlı');

  const user = await User.create({ email, password, firstName, lastName, phone, address, birthDate, gender });
  const token = generateToken(user);

  return { user, token };
};

exports.login = async (email, password) => {
  const user = await User.findOne({ where: { email } });

  if (!user || !user.validPassword(password)) {
    throw new Error('Invalid credentials');
  }

  const token = generateToken(user);
  return { user, token };
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