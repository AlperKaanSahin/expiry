'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('AuditLogs', 'actorSnapshot', {
      type: Sequelize.JSON,
      allowNull: true
    });
  },

  down: async (queryInterface) => {
    await queryInterface.removeColumn('AuditLogs', 'actorSnapshot');
  }
};