'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.renameColumn(
      'AuditLogs',
      'userId',
      'actorId'
    );
  },

  async down(queryInterface) {
    await queryInterface.renameColumn(
      'AuditLogs',
      'actorId',
      'userId'
    );
  }
};