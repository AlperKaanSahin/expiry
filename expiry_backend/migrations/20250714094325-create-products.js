'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
// up fonksiyonu
await queryInterface.createTable('products', {
  id: {
    allowNull: false,
    autoIncrement: true,
    primaryKey: true,
    type: Sequelize.INTEGER
  },
  productName: {
    type: Sequelize.STRING,
    allowNull: false
  },
  quantity: {
    type: Sequelize.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  price: {
    type: Sequelize.FLOAT,
    allowNull: false
  },
  expiryDate: {
    type: Sequelize.DATE
  },
  imageUrl: { // Resim için alan
    type: Sequelize.STRING,
    allowNull: true
  },
  userId: {
    type: Sequelize.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    },
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE'
  },
  createdAt: {
    allowNull: false,
    type: Sequelize.DATE
  },
  updatedAt: {
    allowNull: false,
    type: Sequelize.DATE
  }
});



  },

  async down (queryInterface, Sequelize) {
await queryInterface.dropTable('products');
  }
};
