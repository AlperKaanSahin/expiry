'use strict';

module.exports = {
  async up(queryInterface) {
    const [shops] = await queryInterface.sequelize.query(
      `SELECT id FROM shops WHERE name = 'Market1' LIMIT 1;`
    );
    const shopId = shops[0].id;

    await queryInterface.bulkInsert('packages', [
      {
        shopId,
        name: 'Kutu1',
        description: 'Taze ve çeşitli kahvaltılık ürünler içerir.',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ], {});
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('package_products', null, {});
    await queryInterface.bulkDelete('packages', null, {});
  }
};