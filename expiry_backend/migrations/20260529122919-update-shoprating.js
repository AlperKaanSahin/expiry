'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
async up (queryInterface, Sequelize) {

},

async down () {
  await queryInterface.removeColumn('shopratings', 'orderId');
}
};
