'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('shops', 'category', {
      type: Sequelize.ENUM('BAKERY', 'GROCERY', 'MARKET', 'PREPARED_MEALS', 'CAFE', 'DELI', 'OTHER'),
      allowNull: true,
    });
    await queryInterface.addColumn('shops', 'coverImageUrl', {
      type: Sequelize.STRING,
      allowNull: true,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('shops', 'coverImageUrl');
    await queryInterface.removeColumn('shops', 'category');
  },
};