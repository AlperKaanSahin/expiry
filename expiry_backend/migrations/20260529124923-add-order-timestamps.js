'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('orders', 'paidAt', {
      type: Sequelize.DATE,
      allowNull: true
    });

    await queryInterface.addColumn('orders', 'deliveredAt', {
      type: Sequelize.DATE,
      allowNull: true
    });

    await queryInterface.addColumn('orders', 'confirmedAt', {
      type: Sequelize.DATE,
      allowNull: true
    });

    await queryInterface.addColumn('orders', 'releasedAt', {
      type: Sequelize.DATE,
      allowNull: true
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('orders', 'paidAt');
    await queryInterface.removeColumn('orders', 'deliveredAt');
    await queryInterface.removeColumn('orders', 'confirmedAt');
    await queryInterface.removeColumn('orders', 'releasedAt');
  }
};