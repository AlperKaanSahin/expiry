'use strict';

module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.bulkInsert('packages', [
      {
        shopId: 1,
        name: 'Kutu1',
        description: 'Taze ve çeşitli kahvaltılık ürünler içerir.',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ], {});
  },

  async down (queryInterface, Sequelize) {
  await queryInterface.bulkDelete('package_products', null, {}); // Önce ilişkili kayıtları sil
  await queryInterface.bulkDelete('packages', null, {});
  }
};