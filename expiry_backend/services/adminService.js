const { User, Shop } = require('../models');
const bcrypt = require('bcrypt');

// USERS
exports.getAllUsers = async (page = 1, limit = 10) => {
  const offset = (page - 1) * limit;

  const users = await User.findAndCountAll({
    attributes: { exclude: ['password', 'deletedAt'] },
    limit,
    offset
  });

  return users;
};

exports.deleteUser = async (targetUserId, currentUserId) => {

    if (targetUserId === currentUserId) {
        throw new Error('You cannot delete your own account');
    }

    const user = await User.findByPk(targetUserId);

    if (!user) {
        throw new Error('User not found');
    }

    await user.destroy();

    return true;
};

exports.getUserById = async (id) => {
  return await User.findByPk(id, {
    attributes: { exclude: ['password', 'deletedAt'] }
  });
};
exports.updateUserRole = async (userId, role) => {

  const user = await User.findByPk(userId);

  if (!user) {
    throw new Error('User not found');
  }

  user.role = role;
  await user.save();

  return user;
};

// MARKETS
exports.getAllMarkets = async () => {
  return await Shop.findAll();
};

exports.createMarket = async ({ name, address, phone }) => {
  return await Shop.create({ name, address, phone });
};

exports.updateMarket = async (id, data) => {
  const market = await Shop.findByPk(id);
  if (!market) return null;

  market.name = data.name;
  market.address = data.address;
  market.phone = data.phone;

  await market.save();
  return market;
};

exports.deleteMarket = async (id) => {
  const market = await Shop.findByPk(id);
  if (!market) return null;

  await User.destroy({ where: { id: market.ownerId } });
  await Shop.destroy({ where: { id } });

  return true;
};

// COMPLEX LOGIC
exports.createMarketWithUser = async (data) => {
  const {
    ownerEmail,
    ownerPassword,
    ownerFirstName,
    ownerLastName,
    name,
    address,
    phone
  } = data;

  const hashedPassword = await bcrypt.hash(ownerPassword, 10);

  const user = await User.create({
    email: ownerEmail,
    password: hashedPassword,
    firstName: ownerFirstName,
    lastName: ownerLastName,
    role: 'market'
  });

  const shop = await Shop.create({
    name,
    address,
    phone,
    ownerId: user.id
  });

  return { user, shop };
};