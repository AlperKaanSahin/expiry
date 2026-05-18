// migrations/XXXXXX-add-delivery-time-to-packages.js
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('packages', 'deliveryStart', { type: Sequelize.DATE, allowNull: true });
    await queryInterface.addColumn('packages', 'deliveryEnd', { type: Sequelize.DATE, allowNull: true });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('packages', 'deliveryStart');
    await queryInterface.removeColumn('packages', 'deliveryEnd');
  }
};