'use strict';

module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.bulkInsert('shop_products', [
      {
        shopId: 1,
        name: 'Yoğurt',
        price: 25.5,
        quantity: 100,
        imageUrl: 'yogurt.jpg',
        expiryDate: new Date('2025-08-01'),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        shopId: 1,
        name: 'Peynir',
        price: 40,
        quantity: 50,
        imageUrl: 'peynir.jpg',
        expiryDate: new Date('2025-08-10'),
        createdAt: new Date(),
        updatedAt: new Date()
      },
    ], {});
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('shop_products', null, {});
  }
};