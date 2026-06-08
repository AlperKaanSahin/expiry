'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {

    await queryInterface.addColumn(
      'shops',
      'status',
      {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: 'pending'
      }
    );

  },

  async down(queryInterface, Sequelize) {

    await queryInterface.removeColumn(
      'shops',
      'status'
    );

  }
};