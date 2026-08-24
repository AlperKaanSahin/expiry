'use strict';

module.exports = {
  async up(queryInterface) {
    const [shops] = await queryInterface.sequelize.query(
      `SELECT id FROM shops WHERE name = 'Market1' LIMIT 1;`
    );
    const shopId = shops[0].id;

    await queryInterface.bulkInsert('shop_products', [
      {
        shopId,
        name: 'Yoğurt',
        price: 25.5,
        quantity: 100,
        imageUrl: 'yogurt.jpg',
        expiryDate: new Date('2027-08-01'),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        shopId,
        name: 'Peynir',
        price: 40,
        quantity: 50,
        imageUrl: 'peynir.jpg',
        expiryDate: new Date('2027-08-10'),
        createdAt: new Date(),
        updatedAt: new Date()
      },
    ], {});
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('shop_products', null, {});
  }
};