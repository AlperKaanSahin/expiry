'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {


    // 2. status enum güncelle
await queryInterface.changeColumn('orders', 'status', {
  type: Sequelize.ENUM(
    'pending',
    'paid',
    'delivered',
    'confirmed',
    'released'
  ),
  allowNull: false,
  defaultValue: 'pending'
});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.addColumn('orders', 'isReceivedByUser', {
      type: Sequelize.BOOLEAN,
      defaultValue: false
    });

    await queryInterface.addColumn('orders', 'isReceivedByMarket', {
      type: Sequelize.BOOLEAN,
      defaultValue: false
    });

    await queryInterface.changeColumn('orders', 'status', {
      type: Sequelize.STRING
    });
  }
};