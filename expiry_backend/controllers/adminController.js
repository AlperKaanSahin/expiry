
const { User, Shop } = require('../models');
const bcrypt = require('bcrypt'); // Şifreyi hashlemek için

exports.getAllUsers = async (req, res) => {
  // Tüm alanları getir (şifre hariç)
  const users = await User.findAll({
    attributes: { exclude: ['password', 'deletedAt'] } // Şifre hariç tüm alanlar gelir
  });
  res.json(users);
};

exports.deleteUser = async (req, res) => {
  await User.destroy({ where: { id: req.params.id } });
  res.json({ success: true });
};



exports.getAllMarkets = async (req, res) => {
  const markets = await Shop.findAll();
  res.json(markets);
};

exports.createMarket = async (req, res) => {
  const { name, address, phone } = req.body;
  const newMarket = await Shop.create({ name, address, phone });
  res.status(201).json(newMarket);
};
exports.deleteMarket = async (req, res) => {
  const { id } = req.params;
  const market = await Shop.findByPk(id);
  if (!market) return res.status(404).json({ error: 'Market bulunamadı' });

  // Önce market sahibini sil
  await User.destroy({ where: { id: market.ownerId } });

  // Sonra marketi sil
  await Shop.destroy({ where: { id } });

  res.json({ success: true });
};
exports.updateMarket = async (req, res) => {
  const { id } = req.params;
  const { name, address, phone } = req.body;
  const market = await Shop.findByPk(id);
  if (!market) return res.status(404).json({ error: 'Market bulunamadı' });
  market.name = name;
  market.address = address;
  market.phone = phone;
  await market.save();
  res.json(market);
};
exports.createMarketWithUser = async (req, res) => {
  const {
    ownerEmail,
    ownerPassword,
    ownerFirstName,
    ownerLastName,
    name,
    address,
    phone
  } = req.body;

  // 1. Önce kullanıcıyı oluştur
  const user = await User.create({
    email: ownerEmail,
    password: ownerPassword, // DÜZ ŞİFRE GÖNDER!
    firstName: ownerFirstName,
    lastName: ownerLastName,
    role: 'market'
  });

  // 2. Sonra marketi oluştur
  const shop = await Shop.create({
    name,
    address,
    phone,
    ownerId: user.id
  });

  res.json({ shop, user });
};

