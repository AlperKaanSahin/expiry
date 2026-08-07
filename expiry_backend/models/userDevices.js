// models/userDevices.js
'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class UserDevice extends Model {
    static associate(models) {
      UserDevice.belongsTo(models.User, { foreignKey: 'userId' });
    }
  }

  UserDevice.init({
    userId: { type: DataTypes.INTEGER, allowNull: false },
    deviceId: { type: DataTypes.STRING, allowNull: false },
    fcmToken: { type: DataTypes.STRING, allowNull: false },
    platform: { type: DataTypes.ENUM('ios', 'android'), allowNull: false },
    appVersion: { type: DataTypes.STRING, allowNull: true },
    lastSeenAt: { type: DataTypes.DATE, allowNull: true },
  }, {
    sequelize,
    modelName: 'UserDevice',
    tableName: 'UserDevices',
  });

  return UserDevice;
};