'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('orderpackages', 'iyzicoApprovedAt', {
      type: Sequelize.DATE,
      allowNull: true,
    });
    await queryInterface.addColumn('orderpackages', 'approvalAttempts', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0,
    });
    await queryInterface.addColumn('orderpackages', 'lastApprovalError', {
      type: Sequelize.STRING(500),
      allowNull: true,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('orderpackages', 'lastApprovalError');
    await queryInterface.removeColumn('orderpackages', 'approvalAttempts');
    await queryInterface.removeColumn('orderpackages', 'iyzicoApprovedAt');
  },
};