// örnek: c:\Users\alper\Desktop\toogoddtogog\toogoddtogog_backend\migrations\XXXXXXXXXXXXXX-add-quantity-to-packages.js
'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('packages', 'quantity', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 1
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('packages', 'quantity');
  }
};