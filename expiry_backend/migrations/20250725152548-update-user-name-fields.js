'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
await queryInterface.removeColumn('users', 'username');
await queryInterface.removeColumn('users', 'fullName');
await queryInterface.addColumn('users', 'firstName', {
  type: Sequelize.STRING,
  allowNull: false,
  defaultValue: ''
});
await queryInterface.addColumn('users', 'lastName', {
  type: Sequelize.STRING,
  allowNull: false,
  defaultValue: ''
});
  },

  async down (queryInterface, Sequelize) {
await queryInterface.removeColumn('users', 'firstName');
await queryInterface.removeColumn('users', 'lastName');
await queryInterface.addColumn('users', 'username', {
  type: Sequelize.STRING,
  allowNull: false,
  unique: true,
  defaultValue: ''
});
await queryInterface.addColumn('users', 'fullName', {
  type: Sequelize.STRING,
  allowNull: false,
  defaultValue: ''
});
  }
};
