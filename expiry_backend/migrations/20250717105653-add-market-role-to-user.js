module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn('users', 'role', {
      type: Sequelize.ENUM('admin', 'user', 'market'),
      allowNull: false,
      defaultValue: 'user'
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn('users', 'role', {
      type: Sequelize.ENUM('admin', 'user'),
      allowNull: false,
      defaultValue: 'user'
    });
  }
};