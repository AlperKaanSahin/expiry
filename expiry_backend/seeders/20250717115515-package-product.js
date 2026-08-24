'use strict';

module.exports = {
  async up(queryInterface) {
    const [packages] = await queryInterface.sequelize.query(
      `SELECT id FROM packages WHERE name = 'Kutu1' LIMIT 1;`
    );
    const packageId = packages[0].id;

    const [products] = await queryInterface.sequelize.query(
      `SELECT id, name FROM shop_products WHERE name IN ('Yoğurt', 'Peynir');`
    );
    const yogurt = products.find(p => p.name === 'Yoğurt');
    const peynir = products.find(p => p.name === 'Peynir');

    await queryInterface.bulkInsert('package_products', [
      {
        packageId,
        shopProductId: yogurt.id,
        quantity: 2,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        packageId,
        shopProductId: peynir.id,
        quantity: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ], {});
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('package_products', null, {});
  }
};