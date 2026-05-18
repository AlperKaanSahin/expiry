// migrations/XXXXXXXXXXXXXX-create-packageunit.js
'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('PackageUnits', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      packageId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'Packages', key: 'id' },
        onDelete: 'CASCADE'
      },
      isSold: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('PackageUnits');
  }
};