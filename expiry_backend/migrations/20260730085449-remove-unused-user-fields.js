'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('users', 'phone');
    await queryInterface.removeColumn('users', 'birthDate');
    await queryInterface.removeColumn('users', 'gender');
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('users', 'phone', {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn('users', 'birthDate', {
      type: Sequelize.DATEONLY,
      allowNull: true,
    });
    await queryInterface.addColumn('users', 'gender', {
      type: Sequelize.ENUM('Erkek', 'Kadın', 'Diğer'),
      allowNull: true,
    });
  }
};