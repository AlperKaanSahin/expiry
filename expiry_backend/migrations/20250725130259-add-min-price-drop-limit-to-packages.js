'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
await queryInterface.addColumn('packages', 'minPriceDropLimit', {
  type: Sequelize.FLOAT,
  allowNull: true,
  defaultValue: null
});
  },

  async down (queryInterface, Sequelize) {
await queryInterface.removeColumn('packages', 'minPriceDropLimit');
  }
};
