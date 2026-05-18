module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('packages', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      shopId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'shops', key: 'id' },
        onDelete: 'CASCADE'
      },
      name: { type: Sequelize.STRING, allowNull: false },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false }
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('packages');
  }
};