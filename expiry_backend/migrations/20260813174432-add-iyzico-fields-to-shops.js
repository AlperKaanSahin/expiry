'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('shops', 'subMerchantType', {
      type: Sequelize.ENUM('PERSONAL', 'LIMITED_OR_JOINT_STOCK_COMPANY'),
      allowNull: true,
    });
    await queryInterface.addColumn('shops', 'iban', {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn('shops', 'identityNumber', {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn('shops', 'taxNumber', {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn('shops', 'taxOffice', {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn('shops', 'legalCompanyTitle', {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn('shops', 'subMerchantKey', {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn('shops', 'subMerchantStatus', {
      type: Sequelize.ENUM('pending', 'active', 'failed'),
      allowNull: false,
      defaultValue: 'pending',
    });
  },
  down: async (queryInterface) => {
    await queryInterface.removeColumn('shops', 'subMerchantType');
    await queryInterface.removeColumn('shops', 'iban');
    await queryInterface.removeColumn('shops', 'identityNumber');
    await queryInterface.removeColumn('shops', 'taxNumber');
    await queryInterface.removeColumn('shops', 'taxOffice');
    await queryInterface.removeColumn('shops', 'legalCompanyTitle');
    await queryInterface.removeColumn('shops', 'subMerchantKey');
    await queryInterface.removeColumn('shops', 'subMerchantStatus');
    // ENUM tipleri MySQL'de column ile birlikte otomatik silinir, ayrıca DROP TYPE gerekmez (Postgres'ten farklı olarak)
  },
};