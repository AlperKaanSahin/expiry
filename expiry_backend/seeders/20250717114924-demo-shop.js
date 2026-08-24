'use strict';

module.exports = {
  async up(queryInterface) {
    const [users] = await queryInterface.sequelize.query(
      `SELECT id FROM users WHERE email = 'market@example.com' LIMIT 1;`
    );
    const marketUserId = users[0].id;

    await queryInterface.bulkInsert('shops', [
      {
        name: 'Market1',
        address: 'Adres 1',
        phone: '5551112233',
        ownerId: marketUserId,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ], {});
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('shops', null, {});
  }
};