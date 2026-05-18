'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.bulkInsert('products', [
      {
        productName: 'Elma',
        quantity: 100,
        price: 5.5,
        expiryDate: '2025-12-31',
        imageUrl: 'elma.jpg',
        userId: 23,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        productName: 'Muz',
        quantity: 50,
        price: 8.0,
        expiryDate: '2025-11-30',
        imageUrl: 'muz.jpg',
        userId: 23,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        productName: 'Portakal',
        quantity: 70,
        price: 6.0,
        expiryDate: '2025-10-15',
        imageUrl: 'orange.jpg',
        userId: 23,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ], {});
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('products', null, {});
  }
};