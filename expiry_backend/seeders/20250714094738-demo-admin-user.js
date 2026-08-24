'use strict';
const bcrypt = require('bcrypt');

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert('users', [
      {
        firstName: 'Admin',
        lastName: 'User',
        email: 'admin@example.com',
        password: bcrypt.hashSync('1234', 10),
        role: 'admin',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        firstName: 'Test',
        lastName: 'User',
        email: 'user@example.com',
        password: bcrypt.hashSync('1234', 10),
        role: 'user',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        firstName: 'Test',
        lastName: 'Market',
        email: 'market@example.com',
        password: bcrypt.hashSync('1234', 10),
        role: 'market',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ], {});
  },

  down: async (queryInterface) => {
    await queryInterface.bulkDelete('users', null, {});
  }
};