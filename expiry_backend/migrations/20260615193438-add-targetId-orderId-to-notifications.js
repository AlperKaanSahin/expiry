'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('notifications', 'targetId', {
      type: Sequelize.INTEGER,
      allowNull: true
    });
    await queryInterface.addColumn('notifications', 'orderId', {
      type: Sequelize.INTEGER,
      allowNull: true
    });
  },

  down: async (queryInterface) => {
    await queryInterface.removeColumn('notifications', 'targetId');
    await queryInterface.removeColumn('notifications', 'orderId');
  }
};