'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('shopratings', 'orderId', {
      type: Sequelize.INTEGER,
      allowNull: false,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('shopratings', 'orderId');
  }
};