'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('UserDevices', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE',
      },
      deviceId: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      fcmToken: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      platform: {
        type: Sequelize.ENUM('ios', 'android'),
        allowNull: false,
      },
      appVersion: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      lastSeenAt: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    });

    await queryInterface.addConstraint('UserDevices', {
      fields: ['userId', 'deviceId'],
      type: 'unique',
      name: 'unique_user_device',
    });
  },
  down: async (queryInterface) => {
    await queryInterface.dropTable('UserDevices');
  },
};