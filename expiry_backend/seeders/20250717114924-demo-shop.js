'use strict';

module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.bulkInsert('shops', [
      {
        name: 'Market1',
        address: 'Adres 1',
        phone: '5551112233',
        ownerId: 25, // örnek user id (market rolünde bir kullanıcı)
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ], {});
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('shops', null, {});
  }
};