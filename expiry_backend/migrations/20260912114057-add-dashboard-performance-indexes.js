'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // dashboardService.getShopSummary — 'today' ve 'weeklyTrend' sorguları
    // shopId + status + createdAt üzerinden filtreliyor, bu üçünü kapsayan
    // bileşik index olmadan sipariş sayısı arttıkça full table scan olur.
    await queryInterface.addIndex('orders', ['shopId', 'status', 'createdAt'], {
      name: 'orders_shopId_status_createdAt',
    });

    // dashboardService.getShopSummary — 'expiringSoon' sorgusu shop_products.expiryDate
    // üzerinden filtreliyor (WHERE expiryDate IS NOT NULL + MIN(expiryDate)).
    await queryInterface.addIndex('shop_products', ['expiryDate'], {
      name: 'shop_products_expiryDate',
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeIndex('orders', 'orders_shopId_status_createdAt');
    await queryInterface.removeIndex('shop_products', 'shop_products_expiryDate');
  },
};