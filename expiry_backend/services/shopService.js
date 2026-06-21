const { Shop, User } = require('../models');

exports.applyShop = async (userId, data) => {
  
  // 1. kullanıcı zaten shop sahibi mi?
  const existingShop = await Shop.findOne({
    where: { ownerId: userId }
  });

  if (existingShop) {
    throw new Error('Zaten bir marketiniz var');
  }

  // 2. shop oluştur
  const shop = await Shop.create({
    name: data.name,
    address: data.address,
    phone: data.phone,
    ownerId: userId,
    status: 'pending'
  });

  return shop;
};