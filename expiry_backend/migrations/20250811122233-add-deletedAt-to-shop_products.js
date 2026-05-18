'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('shop_products', 'deletedAt', {
      allowNull: true,
      type: Sequelize.DATE
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('shop_products', 'deletedAt');
  }
};