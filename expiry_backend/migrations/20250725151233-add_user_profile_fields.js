'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn('users', 'fullName', {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: ''
    });
    await queryInterface.addColumn('users', 'phone', {
      type: Sequelize.STRING,
      allowNull: true
    });
    await queryInterface.addColumn('users', 'birthDate', {
      type: Sequelize.DATEONLY,
      allowNull: true
    });
    await queryInterface.addColumn('users', 'gender', {
      type: Sequelize.ENUM('Erkek', 'Kadın', 'Diğer'),
      allowNull: true
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('users', 'fullName');
    await queryInterface.removeColumn('users', 'phone');
    await queryInterface.removeColumn('users', 'birthDate');
    await queryInterface.removeColumn('users', 'gender');
  }
};