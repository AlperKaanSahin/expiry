'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('PackageUnits', 'reservedByOrderId', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: { model: 'orders', key: 'id' },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
    });
    await queryInterface.addColumn('PackageUnits', 'reservedUntil', {
      type: Sequelize.DATE,
      allowNull: true,
    });
    await queryInterface.addIndex('PackageUnits', ['packageId', 'isSold', 'reservedUntil'], {
      name: 'package_units_availability_idx',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeIndex('PackageUnits', 'package_units_availability_idx');
    await queryInterface.removeColumn('PackageUnits', 'reservedUntil');
    await queryInterface.removeColumn('PackageUnits', 'reservedByOrderId');
  },
};