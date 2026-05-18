'use strict';

module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.bulkInsert('package_products', [
      {
        packageId: 4,
        shopProductId: 4, // Yoğurt
        quantity: 2,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        packageId: 4,
        shopProductId: 5, // Peynir
        quantity: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ], {});
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('package_products', null, {});
  }
};