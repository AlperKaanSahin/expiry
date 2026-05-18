// örnek: c:\Users\alper\Desktop\toogoddtogog\toogoddtogog_backend\migrations\XXXXXXXXXX-make-orderpackage-price-nullable.js
'use strict';

module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.changeColumn('orderpackages', 'price', {
      type: Sequelize.FLOAT,
      allowNull: true
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.changeColumn('orderpackages', 'price', {
      type: Sequelize.FLOAT,
      allowNull: false
    });
  }
};