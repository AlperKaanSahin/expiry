'use strict';

// NOT: tableName'leri 'orders' / 'orderpackages' olarak varsaydım
// (OrderPackage modelinde tableName: 'orderpackages' açıkça yazılıydı,
// Order modelini görmedim — 'orders' değilse burayı düzelt).

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('orders', 'platformFee', {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
    });

    await queryInterface.addColumn('orders', 'paidPrice', {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: true, // checkout initialize edilene kadar null
    });

    await queryInterface.addColumn('orders', 'checkoutToken', {
      type: Sequelize.STRING,
      allowNull: true,
      unique: true,
    });

    await queryInterface.addColumn('orderpackages', 'iyzicoItemId', {
      type: Sequelize.STRING,
      allowNull: true,
    });

    await queryInterface.addColumn('orderpackages', 'iyzicoPaymentTransactionId', {
      type: Sequelize.STRING,
      allowNull: true,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('orders', 'platformFee');
    await queryInterface.removeColumn('orders', 'paidPrice');
    await queryInterface.removeColumn('orders', 'checkoutToken');
    await queryInterface.removeColumn('orderpackages', 'iyzicoItemId');
    await queryInterface.removeColumn('orderpackages', 'iyzicoPaymentTransactionId');
  },
};