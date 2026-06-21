'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Notification extends Model {
    static associate(models) {
      Notification.belongsTo(models.User, {
        foreignKey: 'userId'
      });
    }
  }

Notification.init({
  userId: { type: DataTypes.INTEGER, allowNull: false },
  type: DataTypes.STRING,
  title: DataTypes.STRING,
  message: DataTypes.STRING,
  isRead: { type: DataTypes.BOOLEAN, defaultValue: false },
  targetId: { type: DataTypes.INTEGER, allowNull: true },
  orderId: { type: DataTypes.INTEGER, allowNull: true },
}, {
  sequelize,
  modelName: 'Notification',
  tableName: 'notifications',
  timestamps: true
});

  return Notification;
};