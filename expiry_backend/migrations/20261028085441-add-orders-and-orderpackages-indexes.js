'use strict';

// Sorgu yollarına göre eksik index'ler:
// - orders(userId, status, createdAt): listUserOrders (müşterinin sipariş listesi)
// - orders(deliveryToken) UNIQUE: confirmByQRCode her QR okutmada token ile tek sipariş
//   arıyor; unique olması ayrıca bir token'ın iki siparişe ait olamayacağını garanti eder
//   (NULL'lar unique kısıtına takılmaz)
// - orderpackages(orderId): reserveStock, initiateCheckout, payment.handler, retry job
// - orderpackages(packageId): hardDeletePackageIfSafe
//
// orderpackages.packageId'ye bilerek FK EKLENMİYOR: tamamlanmış siparişi olan paketler
// silinebiliyor ve geçmiş siparişler silinmiş pakete soft referans veriyor.
module.exports = {
  async up(queryInterface) {
    await queryInterface.addIndex('orders', ['userId', 'status', 'createdAt'], {
      name: 'orders_userId_status_createdAt',
    });
    await queryInterface.addIndex('orders', ['deliveryToken'], {
      name: 'orders_deliveryToken_unique',
      unique: true,
    });
    await queryInterface.addIndex('orderpackages', ['orderId'], {
      name: 'orderpackages_orderId',
    });
    await queryInterface.addIndex('orderpackages', ['packageId'], {
      name: 'orderpackages_packageId',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeIndex('orderpackages', 'orderpackages_packageId');
    await queryInterface.removeIndex('orderpackages', 'orderpackages_orderId');
    await queryInterface.removeIndex('orders', 'orders_deliveryToken_unique');
    await queryInterface.removeIndex('orders', 'orders_userId_status_createdAt');
  },
};