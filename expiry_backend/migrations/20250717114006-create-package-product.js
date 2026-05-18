module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('package_products', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      packageId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'packages', key: 'id' },
        onDelete: 'CASCADE'
      },
      shopProductId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'shop_products', key: 'id' },
        onDelete: 'CASCADE'
      },
      quantity: { type: Sequelize.INTEGER },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false }
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('package_products');
  }
};