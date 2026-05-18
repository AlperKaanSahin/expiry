// örnek: migrations/20230723XXXXXX-add-price-to-packages.js
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('packages', 'price', {
      type: Sequelize.DECIMAL(10,2),
      allowNull: true,
      defaultValue: null
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('packages', 'price');
  }
};