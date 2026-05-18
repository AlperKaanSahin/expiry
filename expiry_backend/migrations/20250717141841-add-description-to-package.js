'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
  return queryInterface.addColumn('packages', 'description', {
    type: Sequelize.TEXT,
    allowNull: true,
  });
  },

  async down (queryInterface, Sequelize) {
return queryInterface.removeColumn('packages', 'description');
  }
};
