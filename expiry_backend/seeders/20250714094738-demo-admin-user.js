'use strict';
const bcrypt = require('bcrypt');
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
await queryInterface.bulkInsert('users', [
  {
    username: 'admin',
    email: 'admin@example.com',
    password: bcrypt.hashSync('1234', 10),
    role: 'admin',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    username: 'user',
    email: 'user@example.com',
    password: bcrypt.hashSync('1234', 10),
    role: 'user',
    createdAt: new Date(),
    updatedAt: new Date()
  },
        {
        username: 'market',
        email: 'market@example.com',
        password: bcrypt.hashSync('1234', 10),
        role: 'market',
        createdAt: new Date(),
        updatedAt: new Date()
      }
], {});
  },

down: async (queryInterface, Sequelize) => {
await queryInterface.bulkDelete('users', null, {});
}}
