module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('shop_products', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      shopId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'shops', key: 'id' },
        onDelete: 'CASCADE'
      },
      name: { type: Sequelize.STRING, allowNull: false },
      price: { type: Sequelize.FLOAT, allowNull: false },
      quantity: { type: Sequelize.INTEGER, allowNull: false },
      imageUrl: { type: Sequelize.STRING },
      expiryDate: { type: Sequelize.DATE },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false }
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('shop_products');
  }
};