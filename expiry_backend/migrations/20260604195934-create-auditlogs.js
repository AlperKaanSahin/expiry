'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('AuditLogs', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true
      },

      userId: {
        type: Sequelize.INTEGER,
        allowNull: false
      },

      action: {
        type: Sequelize.STRING,
        allowNull: false
      },

      entityType: {
        type: Sequelize.STRING,
        allowNull: false
      },

      entityId: {
        type: Sequelize.INTEGER,
        allowNull: true
      },

      description: {
        type: Sequelize.STRING,
        allowNull: false
      },

      metadata: {
        type: Sequelize.JSON,
        allowNull: true
      },

      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn('NOW')
      },

      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn('NOW')
      }
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('AuditLogs');
  }
};