'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('shops', 'ratingAverage', {
      type: Sequelize.FLOAT,
      allowNull: false,
      defaultValue: 0
    });
    await queryInterface.addColumn('shops', 'ratingCount', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('shops', 'ratingAverage');
    await queryInterface.removeColumn('shops', 'ratingCount');
  }
};