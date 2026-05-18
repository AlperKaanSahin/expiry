// migrations/XXXXXX-add-auto-price-drop-to-packages.js
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('packages', 'autoPriceDropEnabled', { type: Sequelize.BOOLEAN, defaultValue: false });
    await queryInterface.addColumn('packages', 'priceDropAmount', { type: Sequelize.DECIMAL(10,2), allowNull: true });
    await queryInterface.addColumn('packages', 'priceDropInterval', { type: Sequelize.INTEGER, allowNull: true }); // saat cinsinden
    await queryInterface.addColumn('packages', 'lastPriceDropAt', { type: Sequelize.DATE, allowNull: true });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('packages', 'autoPriceDropEnabled');
    await queryInterface.removeColumn('packages', 'priceDropAmount');
    await queryInterface.removeColumn('packages', 'priceDropInterval');
    await queryInterface.removeColumn('packages', 'lastPriceDropAt');
  }
};