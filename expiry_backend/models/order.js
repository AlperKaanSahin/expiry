'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Order extends Model {
    static associate(models) {
      Order.belongsTo(models.User, { foreignKey: 'userId' });
      Order.belongsTo(models.Shop, { foreignKey: 'shopId' });
      Order.hasMany(models.OrderPackage, { foreignKey: 'orderId' });
    }
  }
  Order.init({
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    shopId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    totalPrice: {
      type: DataTypes.FLOAT,
      allowNull: false
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'pending'
    },
    isReceivedByUser: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    isReceivedByMarket: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    }
  }, {
    sequelize,
    modelName: 'Order',
    tableName: 'orders',
    timestamps: true
  });
  return Order;
};